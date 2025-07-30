const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

dotenv.config();

// Configurar Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
app.use(express.json());
app.use(fileUpload());
app.use(cors());
app.use(express.static('dist'));

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
    // Manter nome original para compatibilidade com script Python
    cb(null, file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limite
});

// Rota de teste para verificar se o servidor está funcionando
app.get('/', (req, res) => {
  res.json({ message: 'Servidor do Discrepômetro funcionando!' });
});

// Rota para testar a conexão com o Supabase
app.get('/test-supabase', async (req, res) => {
  try {
    const { data, error } = await supabase.from('analise_discrepancia').select('*').limit(1);
    if (error) throw error;
    res.json({ message: 'Conexão com Supabase OK!', data });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao conectar com Supabase', error: error.message });
  }
});

// Endpoint para processar arquivos com Discrepômetro Automático
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
    // Usar o novo sistema automático Node.js
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
    console.error('❌ Erro no processamento automático:', error);
    res.status(500).json({ 
      error: 'Erro no processamento automático', 
      message: error.message 
    });
  }
});

// Endpoint de status/teste
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'online', 
    timestamp: new Date().toISOString(),
    version: '2.0 - Python Integration'
  });
});

// Rota de teste para verificar se o servidor está funcionando
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Backend do Discrepômetro funcionando!',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 Discrepômetro 3.0 - Sistema Automático Ativo`);
  console.log(`⚡ Processamento: TypeScript/Node.js com streaming`);
  console.log(`📋 Capacidade: Milhões de linhas + PDFs grandes`);
  console.log(`🔗 Proxy configurado para Vite em http://localhost:8080`);
}); 