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

// Endpoint para processar arquivos com Python
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
    // Executar script Python no diretório de uploads
    const pythonProcess = spawn('python3', ['../scripts/discrepometro_completo.py'], {
      cwd: path.join(__dirname, 'uploads'),
      env: {
        ...process.env,
        PYTHONPATH: path.join(__dirname, 'scripts')
      }
    });
    
    let output = '';
    let errorOutput = '';
    
    // Capturar saída do script
    pythonProcess.stdout.on('data', (data) => {
      const text = data.toString();
      console.log('🐍 Python:', text);
      output += text;
      
      // Enviar progresso em tempo real via SSE (opcional)
      if (text.includes('Processando')) {
        // Pode implementar Server-Sent Events aqui para progresso real
      }
    });
    
    pythonProcess.stderr.on('data', (data) => {
      const text = data.toString();
      console.error('🐍 Python Error:', text);
      errorOutput += text;
    });
    
    pythonProcess.on('close', (code) => {
      console.log(`🐍 Python script finalizado com código: ${code}`);
      
      // Limpar arquivos temporários
      req.files.forEach(file => {
        fs.unlink(file.path, (err) => {
          if (err) console.log('Erro ao limpar arquivo:', err);
        });
      });
      
      if (code === 0) {
        res.json({
          success: true,
          message: 'Processamento concluído com sucesso',
          output: output,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(500).json({
          error: 'Erro no processamento Python',
          output: output,
          errorOutput: errorOutput,
          code: code
        });
      }
    });
    
    // Timeout de 5 minutos
    setTimeout(() => {
      pythonProcess.kill();
      res.status(408).json({ error: 'Timeout no processamento' });
    }, 5 * 60 * 1000);
    
  } catch (error) {
    console.error('❌ Erro ao executar script Python:', error);
    res.status(500).json({ error: error.message });
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

// Servir arquivos estáticos do React
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 Discrepômetro 2.0 - Integração Python ativa`);
  console.log(`📋 Suporte XLSB: Ativo`);
}); 