import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables in Vercel.");
}

const supabase = createClient(
  supabaseUrl || '',
  supabaseServiceKey || ''
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { orgId } = req.query;

    if (!orgId || typeof orgId !== 'string') {
        return res.status(400).json({ error: 'Missing orgId' });
    }

    try {
        // 1. Get org from Supabase
        const { data: org, error } = await supabase
            .from('organizations')
            .select('mp_subscription_id, plan_type, subscription_status')
            .eq('id', orgId)
            .single();
        
        if (error || !org) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        if (!org.mp_subscription_id) {
            return res.status(200).json({ 
                hasSubscription: false,
                message: 'Esta barbearia ainda não possui uma assinatura vinculada no Mercado Pago.',
                localStatus: org.subscription_status,
                planType: org.plan_type
            });
        }

        // 2. Fetch from Mercado Pago
        const mpResponse = await fetch(`https://api.mercadopago.com/preapproval/${org.mp_subscription_id}`, {
            headers: {
                'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`
            }
        });

        if (!mpResponse.ok) {
            console.error('Mercado Pago Error:', await mpResponse.text());
            return res.status(500).json({ error: 'Falha ao buscar dados no Mercado Pago' });
        }

        const mpData = await mpResponse.json();

        return res.status(200).json({
            hasSubscription: true,
            id: mpData.id,
            status: mpData.status,
            reason: mpData.reason,
            date_created: mpData.date_created,
            next_payment_date: mpData.summarized?.next_payment_date,
            last_charged_date: mpData.summarized?.last_charged_date,
            transaction_amount: mpData.auto_recurring?.transaction_amount,
            free_trial: mpData.auto_recurring?.free_trial,
            payer_email: mpData.payer_email,
            localStatus: org.subscription_status,
            planType: org.plan_type
        });

    } catch (err: any) {
        console.error('Subscription details error:', err);
        return res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
}
