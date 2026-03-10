const https = require('https');
const fs = require('fs');

async function checkColors() {
  try {
    const env = fs.readFileSync('.env.local', 'utf-8');
    const url = env.match(/VITE_SUPABASE_URL=['""]?(.*?)['""]?$/m)[1].trim();
    const key = env.match(/VITE_SUPABASE_ANON_KEY=['""]?(.*?)['""]?$/m)[1].trim();
    const hostname = url.replace('https://', '');

    const fetchJson = (path) => new Promise((resolve, reject) => {
      const req = https.request({
        hostname, path, method: 'GET',
        headers: { 'apikey': key, 'Authorization': 'Bearer ' + key }
      }, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
        res.on('error', reject);
      });
      req.on('error', reject);
      req.end();
    });

    const orgs = await fetchJson('/rest/v1/organizations?slug=eq.barbearia-1&select=*');
    console.log('--- ANON PUBLIC QUERY ---');
    console.log('ORGS:', JSON.stringify(orgs, null, 2));
    
    if (orgs.length > 0) {
      const settings = await fetchJson('/rest/v1/settings?organization_id=eq.' + orgs[0].id + '&select=*');
      console.log('SETTINGS:', JSON.stringify(settings, null, 2));
    }
  } catch(e) { console.error('Script Error:', e.message); }
}
checkColors();
