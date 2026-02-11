const EVOLUTION_API_URL = "https://offline-copies-sympathy-mountains.trycloudflare.com";
const EVOLUTION_API_KEY = "429683C4C977415CAAFCCE10F7D57E11";
const INSTANCE = "barberpro-main";

async function checkConnection() {
    try {
        const response = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${INSTANCE}`, {
            headers: { 'apikey': EVOLUTION_API_KEY }
        });
        const data = await response.json();
        console.log("✅ Connection State:", data);
        return data?.instance?.state === 'open';
    } catch (error) {
        console.error("❌ Error checking connection:", error);
        return false;
    }
}

async function sendTestMessage(phoneNumber) {
    // Format: Country code + DDD + Number (e.g., 5511999999999 for Brazil)
    const cleanNumber = phoneNumber.replace(/\D/g, '');

    try {
        const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${INSTANCE}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': EVOLUTION_API_KEY
            },
            body: JSON.stringify({
                number: cleanNumber,
                textMessage: {
                    text: "✅ Teste do BarberPro SaaS - Evolution API funcionando perfeitamente!"
                }
            })
        });

        const data = await response.json();
        console.log("📤 Message sent:", data);
        return data;
    } catch (error) {
        console.error("❌ Error sending message:", error);
        return null;
    }
}

async function getQRCode() {
    try {
        const response = await fetch(`${EVOLUTION_API_URL}/instance/connect/${INSTANCE}`, {
            headers: { 'apikey': EVOLUTION_API_KEY }
        });
        const data = await response.json();

        if (data.qrcode?.base64) {
            console.log("📱 QR Code Base64:", data.qrcode.base64);
            console.log("\nSave this base64 string and open in browser:");
            console.log(`data:image/png;base64,${data.qrcode.base64}`);
        } else {
            console.log("⏳ QR Code not ready yet. Count:", data.count || 0);
        }

        return data;
    } catch (error) {
        console.error("❌ Error fetching QR code:", error);
        return null;
    }
}

// Main execution
(async () => {
    console.log("🚀 Evolution API Test Script\n");

    // Check connection first
    const isConnected = await checkConnection();

    if (!isConnected) {
        console.log("\n⚠️  WhatsApp not connected. Fetching QR code...\n");
        await getQRCode();
        console.log("\n📋 Next steps:");
        console.log("1. Copy the base64 string above");
        console.log("2. Open browser and paste in address bar");
        console.log("3. Scan with WhatsApp: Settings > Linked Devices > Link a Device");
        console.log("4. Run this script again to test sending a message");
    } else {
        console.log("\n✅ WhatsApp is connected!");

        // Ask for phone number to test
        const testPhone = process.argv[2];
        if (!testPhone) {
            console.log("\n📝 To send a test message, run:");
            console.log("   node test-evolution-api.js 5511999999999");
            console.log("   (Replace with your WhatsApp number including country code)");
        } else {
            console.log(`\n📤 Sending test message to ${testPhone}...`);
            await sendTestMessage(testPhone);
        }
    }
})();
