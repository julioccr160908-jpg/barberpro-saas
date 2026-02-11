// Script para atualizar URL do Ngrok rapidamente
const fs = require('fs');

const ngrokUrl = process.argv[2];

if (!ngrokUrl) {
    console.log('❌ Erro: Forneça a URL do Ngrok');
    console.log('Uso: node update-ngrok-url.js https://XXXX.ngrok-free.app');
    process.exit(1);
}

// Atualizar .env.local
const envPath = '.env.local';
let envContent = fs.readFileSync(envPath, 'utf-8');
envContent = envContent.replace(
    /VITE_EVOLUTION_API_URL=.*/,
    `VITE_EVOLUTION_API_URL=${ngrokUrl}`
);
fs.writeFileSync(envPath, envContent);
console.log('✅ .env.local atualizado');

// Atualizar test-evolution-api.js
const testPath = 'test-evolution-api.js';
let testContent = fs.readFileSync(testPath, 'utf-8');
testContent = testContent.replace(
    /const EVOLUTION_API_URL = ".*";/,
    `const EVOLUTION_API_URL = "${ngrokUrl}";`
);
fs.writeFileSync(testPath, testContent);
console.log('✅ test-evolution-api.js atualizado');

console.log(`\n🚀 URL atualizada para: ${ngrokUrl}`);
console.log('\nExecute agora: node test-evolution-api.js');
