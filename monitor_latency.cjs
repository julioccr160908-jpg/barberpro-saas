#!/usr/bin/env node
const fs = require('fs');

const THRESHOLD_MS = 549;
const CHECK_INTERVAL_MS = 60000; // 1 min

// Read env directly
let SUPABASE_URL = '';
let SUPABASE_KEY = '';
try {
  const envFile = fs.readFileSync('.env.local', 'utf8');
  const lines = envFile.split('\n');
  for (const line of lines) {
    if (line.startsWith('VITE_SUPABASE_URL=')) SUPABASE_URL = line.split('=')[1].replace(/"/g, '').trim();
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) SUPABASE_KEY = line.split('=')[1].replace(/"/g, '').trim();
  }
} catch (err) {
  console.log('Erro ao ler .env.local', err.message);
}

console.log(`Iniciando monitoramento de latência do Supabase Remoto: ${SUPABASE_URL}`);
console.log(`Limiar de alerta (Threshold): ${THRESHOLD_MS}ms\n`);

async function checkLatency() {
  const start = Date.now();
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    
    const latency = Date.now() - start;
    const timeStr = new Date().toLocaleTimeString();
    
    if (res.ok) {
        if (latency > THRESHOLD_MS) {
            console.warn(`[${timeStr}] ⚠️ AVISO: Latência ALTA detectada: ${latency}ms (Threshold: ${THRESHOLD_MS}ms)`);
        } else {
            console.log(`[${timeStr}] ✅ OK: Latência ${latency}ms`);
        }
    } else {
        const text = await res.text();
        console.error(`[${timeStr}] ❌ ERRO: Status ${res.status} HTTP - ${text}`);
    }
  } catch(e) {
      console.error(`[${timeStr}] ❌ FALHA NA CONEXÃO: ${e.message}`);
  }
}

// Primeiro check imediato
checkLatency();

// Verifica a cada intervalo configurado se o processo for mantido aberto
setInterval(checkLatency, CHECK_INTERVAL_MS);
