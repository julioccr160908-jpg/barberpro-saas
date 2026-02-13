const EVOLUTION_API_URL = "https://offline-copies-sympathy-mountains.trycloudflare.com";
const EVOLUTION_API_KEY = "429683C4C977415CAAFCCE10F7D57E11";
const INSTANCE = "barberhost-main";
const fs = require('fs');

async function main() {
    console.log("🔄 Buscando QR Code da instância:", INSTANCE);

    try {
        const response = await fetch(`${EVOLUTION_API_URL}/instance/connect/${INSTANCE}`, {
            headers: { 'apikey': EVOLUTION_API_KEY }
        });
        const data = await response.json();
        console.log("Status HTTP:", response.status);

        if (data.base64) {
            const html = `<!DOCTYPE html>
<html>
<head><title>BarberHost - QR Code WhatsApp</title></head>
<body style="background:#111;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:Arial,sans-serif">
<div style="text-align:center">
<h1 style="color:#25D366">📱 Escaneie o QR Code</h1>
<img src="${data.base64}" style="width:400px;border-radius:12px;border:3px solid #25D366">
<p style="color:#aaa;margin-top:20px">WhatsApp → Configurações → Aparelhos Conectados → Conectar Aparelho</p>
<p style="color:#666;font-size:12px">QR Code expira em ~45 segundos. Recarregue se necessário.</p>
</div>
</body>
</html>`;
            fs.writeFileSync('qrcode.html', html);
            console.log("✅ QR Code salvo em qrcode.html");
            console.log("📂 Abrindo no navegador...");

            // Open in browser
            const { exec } = require('child_process');
            exec('start qrcode.html');
        } else {
            console.log("Resposta da API:", JSON.stringify(data, null, 2));
            if (data.instance && data.instance.state === 'open') {
                console.log("✅ WhatsApp JÁ ESTÁ CONECTADO!");
            } else {
                console.log("⚠️ QR Code não disponível. Tente novamente em alguns segundos.");
            }
        }
    } catch (error) {
        console.error("❌ Erro:", error.message);
    }
}

main();
