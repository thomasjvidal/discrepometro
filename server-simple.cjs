const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(cors());

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
    // Simular processamento
    console.log('📊 Processando arquivos...');
    
    // Aguardar um pouco para simular processamento
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Dados simulados de resultado
    const resultado = {
      timestamp: new Date().toISOString(),
      estatisticas: {
        total_produtos: 10,
        criticos: 2,
        alertas: 3,
        ok: 5,
        percentual_critico: 20
      },
      top10_produtos: [
        {
          nome: "Produto Teste 1",
          codigo: "TEST001",
          quantidade: 1000,
          valor_unitario: 10.50,
          valor_total: 10500.00,
          cfop: "5101",
          cfops_utilizados: ["5101"]
        },
        {
          nome: "Produto Teste 2", 
          codigo: "TEST002",
          quantidade: 800,
          valor_unitario: 15.00,
          valor_total: 12000.00,
          cfop: "5102",
          cfops_utilizados: ["5102"]
        }
      ],
      discrepancias: [
        {
          produto: "Produto Teste 1",
          codigo: "TEST001",
          quantidade_vendida: 1000,
          quantidade_comprada: 0,
          estoque_inicial: 500,
          estoque_final: 200,
          discrepancia: -300,
          status: "CRÍTICO",
          valor_total_vendido: 10500.00,
          cfops_utilizados: ["5101"]
        },
        {
          produto: "Produto Teste 2",
          codigo: "TEST002", 
          quantidade_vendida: 800,
          quantidade_comprada: 0,
          estoque_inicial: 1000,
          estoque_final: 300,
          discrepancia: 100,
          status: "ALERTA",
          valor_total_vendido: 12000.00,
          cfops_utilizados: ["5102"]
        }
      ]
    };
    
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
    version: '3.0 - Sistema Automático'
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 Discrepômetro 3.0 - Sistema Automático Ativo`);
  console.log(`⚡ Processamento: Simulado para teste`);
  console.log(`🔗 Proxy configurado para Vite em http://localhost:8080`);
}); 