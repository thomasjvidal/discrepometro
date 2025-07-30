const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Configurar multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limite
});

// Rota de teste
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Backend do Discrepômetro funcionando!',
    timestamp: new Date().toISOString()
  });
});

// Endpoint para processar arquivos
app.post('/api/process-files', upload.array('files'), async (req, res) => {
  console.log('🚀 Recebidos arquivos para processamento:', req.files?.length || 0);
  
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  }
  
  // Log dos arquivos recebidos
  req.files.forEach(file => {
    console.log(`📄 ${file.originalname} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
  });
  
  try {
    console.log('📊 Processando arquivos com Discrepômetro Automático...');
    
    // Importar e usar o processamento real
    const { DiscrepometroAuto } = require('./scripts/discrepometro_auto.js');
    const discrepometro = new DiscrepometroAuto();
    
    // Executar análise no diretório de uploads
    const uploadsDir = path.join(__dirname, 'uploads');
    const resultado = await discrepometro.executarAnalise(uploadsDir);
    
    // Limpar arquivos temporários
    req.files.forEach(file => {
      fs.unlink(file.path, (err) => {
        if (err) console.log('Erro ao limpar arquivo:', err);
      });
    });
    
    res.json({
      success: true,
      message: 'Processamento automático concluído com sucesso',
      resultado: resultado,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro no processamento:', error);
    res.status(500).json({ 
      error: 'Erro no processamento', 
      message: error.message 
    });
  }
});

// Endpoint de status
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'online', 
    timestamp: new Date().toISOString(),
    version: '3.0 - Sistema Automático Real'
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 Discrepômetro 3.0 - Sistema Automático Real`);
  console.log(`⚡ Processamento: Real com streaming`);
  console.log(`🔗 Proxy configurado para Vite em http://localhost:8080`);
}); 