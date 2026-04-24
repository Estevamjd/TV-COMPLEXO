require('dotenv').config();

const webhookUrl = process.env.WEBHOOK_URL || 'http://localhost:3000/api/webhooks/social';
const secret = process.env.WEBHOOK_SECRET;

if (!secret) {
    console.error('❌ WEBHOOK_SECRET não definido no .env. Abortando.');
    process.exit(1);
}

const testPayload = {
    platform: "instagram",
    video_url: "https://www.instagram.com/reel/XYZ123ABC/",
    thumbnail: "https://images.unsplash.com/photo-1542204165-65bf26472b9b",
    title: "Postagem Teste n8n - Automação Direta",
    author: "@midianinja",
    external_id: "XYZ123ABC_INSTA_01",
    published_at: new Date().toISOString()
};

async function testWebhook() {
    console.log(`Enviando POST para ${webhookUrl}...`);

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-webhook-secret': secret
            },
            body: JSON.stringify(testPayload)
        });

        const data = await response.json();

        console.log(`\nStatus Code: ${response.status}`);
        console.log('Response Body:', data);

        if (response.status === 201) {
            console.log('\n✅ SUCESSO! Vídeo postado.');
        } else if (response.status === 409) {
            console.log('\n⚠️ ALERTA: Vídeo detectado como Duplicado no sistema. Funcionalidade Anti-Spam Operante.');
        } else {
            console.log('\n❌ ERRO: Resposta inesperada.');
        }

    } catch (err) {
        console.error('Falha de Rede:', err);
    }
}

testWebhook();
