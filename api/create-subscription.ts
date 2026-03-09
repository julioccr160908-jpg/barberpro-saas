import type { VercelRequest, VercelResponse } from '@vercel/node';

// Plan configuration
const PLANS: Record<string, { title: string; price: number; staffLimit: number; planType: string }> = {
  basic: {
    title: 'BarberHost Básico',
    price: 34.99,
    staffLimit: 3,
    planType: 'basic',
  },
  pro: {
    title: 'BarberHost Pro',
    price: 49.99,
    staffLimit: 6,
    planType: 'pro',
  },
  enterprise: {
    title: 'BarberHost Premium',
    price: 74.99,
    staffLimit: 999,
    planType: 'enterprise',
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orgId, planType, payerEmail } = req.body;

  if (!orgId || !planType || !payerEmail) {
    return res.status(400).json({ error: 'orgId, planType e payerEmail são obrigatórios' });
  }

  const plan = PLANS[planType];
  if (!plan) {
    return res.status(400).json({ error: 'Plano inválido' });
  }

  const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
  if (!MP_ACCESS_TOKEN) {
    return res.status(500).json({ error: 'Mercado Pago não configurado' });
  }

  try {
    // Create a preapproval (subscription) via Mercado Pago API
    const response = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        reason: plan.title,
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: plan.price,
          currency_id: 'BRL',
        },
        payer_email: payerEmail,
        back_url: `${req.headers.origin || 'https://barberhost.com.br'}/admin/settings?tab=subscription&status=success`,
        external_reference: JSON.stringify({ orgId, planType }),
        status: 'pending',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('MP Create Subscription Error:', data);
      return res.status(response.status).json({ error: data.message || 'Erro ao criar assinatura' });
    }

    return res.status(200).json({
      subscriptionId: data.id,
      initPoint: data.init_point,
      sandboxInitPoint: data.sandbox_init_point,
    });
  } catch (error: any) {
    console.error('Create subscription error:', error);
    return res.status(500).json({ error: error.message || 'Erro interno' });
  }
}
