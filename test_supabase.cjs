const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function checkColors() {
  try {
    const env = fs.readFileSync('.env.local', 'utf-8');
    const urlMatches = env.match(/VITE_SUPABASE_URL=['"]?(.*?)['"]?$/m);
    const keyMatches = env.match(/VITE_SUPABASE_ANON_KEY=['"]?(.*?)['"]?$/m);
    
    if (!urlMatches || !keyMatches) {
       console.log("Could not find keys in .env.local");
       return;
    }
    
    const url = urlMatches[1].trim();
    const key = keyMatches[1].trim();

    const supabase = createClient(url, key);

    console.log("Fetching barbearia-1 (Public ANON)...");
    const { data: orgData, error: orgError } = await supabase.from('organizations').select('id, name, slug, primary_color, secondary_color').eq('slug', 'barbearia-1').single();
    
    console.log("ORG Result:", orgData);
    if (orgError) console.error("ORG Error:", orgError);

    if (orgData && orgData.id) {
       console.log("Fetching settings for ID:", orgData.id);
       const { data: settingsData, error: setError } = await supabase.from('settings').select('*').eq('organization_id', orgData.id).single();
       console.log("SETTINGS Result:", settingsData ? { primary: settingsData.primary_color, secondary: settingsData.secondary_color } : null);
       if (setError) console.error("SETTINGS Error:", setError);
    }
  } catch (error) {
    console.error("Script error:", error);
  }
}

checkColors();
