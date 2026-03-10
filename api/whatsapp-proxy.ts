import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Add CORS headers for the proxy itself if needed, although Vercel handles same-origin
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, apikey'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { path } = req.query;
    const instanceName = req.query.instanceName as string;

    const EVOLUTION_API_URL = process.env.VITE_EVOLUTION_API_URL;
    const EVOLUTION_API_KEY = process.env.VITE_EVOLUTION_API_KEY;

    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
        return res.status(500).json({ error: 'Evolution API environment variables missing on server' });
    }

    try {
        // Construct target URL based on the action
        let targetUrl = '';
        if (req.query.action === 'sendText') {
            targetUrl = `${EVOLUTION_API_URL}/message/sendText/${instanceName}`;
        } else if (req.query.action === 'connectionState') {
            targetUrl = `${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`;
        } else if (req.query.action === 'connect') {
            targetUrl = `${EVOLUTION_API_URL}/instance/connect/${instanceName}`;
        } else if (req.query.action === 'create') {
            targetUrl = `${EVOLUTION_API_URL}/instance/create`;
        } else {
            return res.status(400).json({ error: 'Invalid action' });
        }

        const response = await fetch(targetUrl, {
            method: req.method,
            headers: {
                'Content-Type': 'application/json',
                'apikey': EVOLUTION_API_KEY
            },
            body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
        });

        const data = await response.json();
        return res.status(response.status).json(data);
    } catch (error: any) {
        console.error("WhatsApp Proxy Error:", error);
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}
