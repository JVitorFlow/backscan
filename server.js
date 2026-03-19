const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");
const path = require("path");

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// LOG 1: Verificar variáveis de ambiente na inicialização
console.log("🚀 INICIANDO SERVIDOR");
console.log("📱 TELEGRAM_BOT_TOKEN:", TELEGRAM_BOT_TOKEN ? `${TELEGRAM_BOT_TOKEN.slice(0, 10)}...` : "❌ NÃO DEFINIDO");
console.log("💬 TELEGRAM_CHAT_ID:", TELEGRAM_CHAT_ID ? TELEGRAM_CHAT_ID : "❌ NÃO DEFINIDO");
console.log("⏰ Timestamp:", new Date().toISOString());
console.log("=" * 50);

app.post("/send-location", async (req, res) => {
  console.log("\n🌍 === NOVA REQUISIÇÃO DE LOCALIZAÇÃO ===");
  console.log("⏰ Timestamp:", new Date().toISOString());
  
  // LOG 2: Dados recebidos
  console.log("📥 Body recebido:", JSON.stringify(req.body, null, 2));
  console.log("📋 Headers:", JSON.stringify(req.headers, null, 2));
  
  const { latitude, longitude, maps } = req.body;
  
  // LOG 3: Validação dos dados
  if (!latitude || !longitude) {
    console.log("❌ ERRO: Dados inválidos");
    console.log("   Latitude:", latitude);
    console.log("   Longitude:", longitude);
    return res.status(400).json({ 
      success: false, 
      message: "Latitude e longitude são obrigatórias" 
    });
  }
  
  // LOG 4: Validação das variáveis
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log("❌ ERRO: Variáveis de ambiente faltando");
    console.log("   BOT_TOKEN existe:", !!TELEGRAM_BOT_TOKEN);
    console.log("   CHAT_ID existe:", !!TELEGRAM_CHAT_ID);
    return res.status(500).json({ 
      success: false, 
      message: "Configuração do servidor incompleta" 
    });
  }

  const message = `🌍 Nova localização recebida!

📍 Coordenadas:
• Latitude: ${latitude}
• Longitude: ${longitude}

🗺️ Link do Maps:
${maps}

⏰ Data/Hora: ${new Date().toLocaleString('pt-BR')}`;

  // LOG 5: Preparando envio
  console.log("📤 PREPARANDO ENVIO PARA TELEGRAM");
  console.log("   URL:", `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN.slice(0, 10)}...`);
  console.log("   Chat ID:", TELEGRAM_CHAT_ID);
  console.log("   Mensagem:", message);
  
  try {
    console.log("🔄 Enviando requisição para Telegram...");
    
    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const payload = {
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'HTML'
    };
    
    console.log("🌐 URL completa:", telegramUrl);
    console.log("📦 Payload:", JSON.stringify(payload, null, 2));
    
    const response = await axios.post(telegramUrl, payload, {
      timeout: 10000, // 10 segundos
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // LOG 6: Sucesso
    console.log("✅ SUCESSO! Resposta do Telegram:");
    console.log("   Status:", response.status);
    console.log("   Data:", JSON.stringify(response.data, null, 2));
    
    res.status(200).json({ 
      success: true,
      telegram_response: response.data
    });
    
  } catch (error) {
    // LOG 7: Erro detalhado
    console.log("🔥 ERRO AO ENVIAR PARA TELEGRAM:");
    console.log("   Tipo do erro:", error.constructor.name);
    console.log("   Mensagem:", error.message);
    
    if (error.response) {
      console.log("   Status HTTP:", error.response.status);
      console.log("   Status Text:", error.response.statusText);
      console.log("   Headers:", JSON.stringify(error.response.headers, null, 2));
      console.log("   Data:", JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log("   Request feito mas sem resposta:");
      console.log("   Request:", error.request);
    } else {
      console.log("   Erro na configuração da requisição:");
      console.log("   Config:", error.config);
    }
    
    console.log("   Stack trace:", error.stack);
    
    res.status(500).json({ 
      success: false, 
      message: "Erro ao enviar a localização para o Telegram.",
      error_details: {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      }
    });
  }
  
  console.log("=== FIM DA REQUISIÇÃO ===\n");
});

// LOG 8: Teste de saúde
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