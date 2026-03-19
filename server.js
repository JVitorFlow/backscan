const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");
const path = require("path");

const app = express();

app.use(cors());
app.use(bodyParser.json());

// Servir arquivos estáticos da raiz (onde estão index.html e styles.css)
app.use(express.static('.', {
  setHeaders: (res, path) => {
    if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post("/send-location", async (req, res) => {
  const { latitude, longitude, maps } = req.body;
  const message = `A localização do usuário é:\nLatitude: ${latitude}\nLongitude: ${longitude}\nMaps: ${maps}`;

  try {
    // Correção da sintaxe do axios
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
    });
    res.status(200).json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ 
      success: false, 
      message: "Erro ao enviar a localização para o Telegram." 
    });
  }
});


// Para desenvolvimento local
if (process.env.NODE_ENV !== 'production') {
  app.listen(8088, () => {
    console.log("Servidor rodando na porta 8088");
  });
}

// Exportar para Vercel
module.exports = app;