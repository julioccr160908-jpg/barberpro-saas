import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Plan limits mapping
const PLAN_LIMITS: Record<string, { planType: string; staffLimit: number }> = {
  basic: { planType: 'basic', staffLimit: 3 },
  pro: { planType: 'pro', staffLimit: 6 },
  enterprise: { planType: 'enterprise', staffLimit: 999 },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!MP_ACCESS_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing env vars:', { MP_ACCESS_TOKEN: !!MP_ACCESS_TOKEN, SUPABASE_URL: !!SUPABASE_URL, SUPABASE_SERVICE_KEY: !!SUPABASE_SERVICE_KEY });
    return res.status(500).json({ error: 'Server not configured' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const body = req.body;

    // Mercado Pago sends different notification types
    // We care about subscription (preapproval) events
    const { type, data, action } = body;

    console.log('MP Webhook received:', { type, action, dataId: data?.id });

    // Handle subscription/preapproval notifications
    if (type === 'subscription_preapproval' || type === 'preapproval') {
      const preapprovalId = data?.id;
      if (!preapprovalId) {
        return res.status(200).json({ ok: true, message: 'No preapproval ID' });
      }

      // Fetch the full preapproval details from Mercado Pago
      const mpResponse = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
        headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` },
      });

      if (!mpResponse.ok) {
        console.error('Failed to fetch preapproval:', await mpResponse.text());
        return res.status(200).json({ ok: true, message: 'Could not fetch preapproval' });
      }

      const preapproval = await mpResponse.json();
      console.log('Preapproval status:', preapproval.status, 'external_reference:', preapproval.external_reference);

      // Parse the external_reference to find the org and plan
      let orgId: string | null = null;
      let planType: string | null = null;

      try {
        const ref = JSON.parse(preapproval.external_reference);
        orgId = ref.orgId;
        planType = ref.planType;
      } catch {
        console.error('Cannot parse external_reference:', preapproval.external_reference);
        return res.status(200).json({ ok: true, message: 'Invalid external_reference' });
      }

      if (!orgId || !planType) {
        return res.status(200).json({ ok: true, message: 'Missing orgId or planType' });
      }

      const planConfig = PLAN_LIMITS[planType] || PLAN_LIMITS.basic;

      // Map Mercado Pago status to our subscription_status
      let subscriptionStatus: string;
      switch (preapproval.status) {
        case 'authorized':
          subscriptionStatus = 'active';
          break;
        case 'paused':
          subscriptionStatus = 'past_due';
          break;
        case 'cancelled':
          subscriptionStatus = 'canceled';
          break;
        case 'pending':
          subscriptionStatus = 'past_due';
          break;
        default:
          subscriptionStatus = 'pending';
      }

      // Update the organization in Supabase
      const { error: updateError } = await supabase
        .from('organizations')
        .update({
          subscription_status: subscriptionStatus,
          plan_type: planConfig.planType,
          staff_limit: planConfig.staffLimit,
          mp_subscription_id: preapprovalId,
          mp_payer_email: preapproval.payer_email || null,
        })
        .eq('id', orgId);

      if (updateError) {
        console.error('Supabase update error:', updateError);
        return res.status(500).json({ error: 'Database update failed' });
      }

      console.log(`✅ Org ${orgId} updated: status=${subscriptionStatus}, plan=${planConfig.planType}`);
    }

    // Always return 200 to acknowledge the webhook
    return res.status(200).json({ ok: true });

  } catch (error: any) {
    console.error('Webhook handler error:', error);
    // Still return 200 to prevent Mercado Pago retries on our errors
    return res.status(200).json({ ok: true, error: error.message });
  }
}
