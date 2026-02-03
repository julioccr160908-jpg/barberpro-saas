
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { title, quantity, price, back_urls } = await req.json()

        console.log("Mock Checkout Session Requested:", { title, price });

        // Generate a simulated Preference ID
        const mockPreferenceId = `mock_pref_${Math.random().toString(36).substr(2, 9)}`;

        // Construct the Init Point (URL to redirect the user to)
        // In production, this comes from Mercado Pago.
        // In dev, this points to our local React page.
        // We assume the frontend is running on localhost:5173 for now.
        // In a real scenario we might pass the origin in the body.
        const origin = req.headers.get('origin') || 'http://localhost:5173';

        const init_point = `${origin}/checkout/mock?preference_id=${mockPreferenceId}&amount=${price}&title=${encodeURIComponent(title)}`;

        return new Response(
            JSON.stringify({ init_point, id: mockPreferenceId }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
