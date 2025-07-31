const express = require('express');
const multer = require('multer');
const cors = require('cors');
const pdfParse = require('pdf-parse');
const XLSX = require('xlsx');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// Configuração do Multer para upload de arquivos
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 10
  }
});

// Função para extrair dados do PDF
async function extrairDadosPDF(buffer) {
  try {
    const data = await pdfParse(buffer);
    const texto = data.text;
    
    console.log('📄 PDF processado:', data.info?.Title || 'Sem título');
    console.log('📝 Texto extraído:', texto.length, 'caracteres');
    
    // Extrair produtos do texto do PDF
    const produtos = {};
    const linhas = texto.split('\n');
    
    for (const linha of linhas) {
      // Padrão para encontrar código e quantidade
      const match = linha.match(/(\d{4,})\s+.*?\s+(\d+(?:[.,]\d+)?)/);
      if (match) {
        const codigo = match[1];
        const quantidade = parseFloat(match[2].replace(',', '.'));
        
        if (codigo && !isNaN(quantidade) && quantidade > 0) {
          produtos[codigo] = quantidade;
        }
      }
    }
    
    console.log('🏷️ Produtos encontrados no PDF:', Object.keys(produtos).length);
    return produtos;
    
  } catch (error) {
    console.error('❌ Erro ao processar PDF:', error);
    throw new Error(`Falha no processamento do PDF: ${error.message}`);
  }
}

// Função para extrair Top 10 produtos do Excel
function extrairTop10Produtos(buffer) {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log('📊 Excel processado:', data.length, 'linhas');
    
    // Encontrar cabeçalho
    let headerRow = 0;
    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i];
      if (row && row.some(cell => 
        typeof cell === 'string' && 
        (cell.toLowerCase().includes('cfop') || 
         cell.toLowerCase().includes('código') || 
         cell.toLowerCase().includes('quantidade'))
      )) {
        headerRow = i;
        break;
      }
    }
    
    console.log('📋 Cabeçalho encontrado na linha:', headerRow);
    
    // Mapear colunas
    const header = data[headerRow];
    let cfopIndex = -1, codigoIndex = -1, quantidadeIndex = -1;
    
    for (let i = 0; i < header.length; i++) {
      const cell = String(header[i]).toLowerCase();
      if (cell.includes('cfop')) cfopIndex = i;
      else if (cell.includes('código') || cell.includes('codigo')) codigoIndex = i;
      else if (cell.includes('quantidade') || cell.includes('qtd')) quantidadeIndex = i;
    }
    
    console.log('📍 Índices mapeados:', { cfopIndex, codigoIndex, quantidadeIndex });
    
    // Processar vendas
    const vendas = {};
    
    for (let i = headerRow + 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length < Math.max(cfopIndex, codigoIndex, quantidadeIndex)) continue;
      
      const cfop = String(row[cfopIndex] || '');
      const codigo = String(row[codigoIndex] || '');
      const quantidade = parseFloat(row[quantidadeIndex] || 0);
      
      // Filtrar apenas vendas (CFOP 5xxx, 6xxx, 7xxx)
      if (cfop.match(/^[567]\d{3}$/) && codigo && !isNaN(quantidade) && quantidade > 0) {
        if (!vendas[codigo]) vendas[codigo] = 0;
        vendas[codigo] += quantidade;
      }
    }
    
    // Top 10 produtos mais vendidos
    const top10 = Object.entries(vendas)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([codigo, quantidade]) => ({ codigo, quantidade }));
    
    console.log('🏆 Top 10 produtos:', top10);
    return top10;
    
  } catch (error) {
    console.error('❌ Erro ao processar Excel:', error);
    throw new Error(`Falha no processamento do Excel: ${error.message}`);
  }
}

// Endpoint principal para análise
app.post('/api/analisar', upload.fields([
  { name: 'excel', maxCount: 1 },
  { name: 'pdfInicial', maxCount: 1 },
  { name: 'pdfFinal', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('🚀 Iniciando análise de discrepâncias...');
    
    const files = req.files;
    
    if (!files.excel || !files.pdfInicial || !files.pdfFinal) {
      return res.status(400).json({
        success: false,
        message: 'São necessários: 1 Excel + 2 PDFs'
      });
    }
    
    // 1. Extrair Top 10 produtos do Excel
    console.log('📊 Processando Excel...');
    const top10Produtos = extrairTop10Produtos(files.excel[0].buffer);
    const codigosProdutos = top10Produtos.map(p => p.codigo);
    
    // 2. Processar PDF inicial
    console.log('📄 Processando PDF inicial...');
    const estoqueInicial = await extrairDadosPDF(files.pdfInicial[0].buffer);
    
    // 3. Processar PDF final
    console.log('📄 Processando PDF final...');
    const estoqueFinal = await extrairDadosPDF(files.pdfFinal[0].buffer);
    
    // 4. Calcular discrepâncias
    console.log('🧮 Calculando discrepâncias...');
    const resultados = [];
    
    for (const produto of top10Produtos) {
      const codigo = produto.codigo;
      const vendido = produto.quantidade;
      const inicial = estoqueInicial[codigo] || 0;
      const final = estoqueFinal[codigo] || 0;
      
      const esperado = inicial - vendido;
      const diferenca = final - esperado;
      
      let status = 'OK';
      let tipo = 'NORMAL';
      
      if (Math.abs(diferenca) > 0.01) {
        status = 'ERRO';
        tipo = diferenca < 0 ? 'VENDA_SEM_NOTA' : 'COMPRA_SEM_NOTA';
      }
      
      resultados.push({
        codigo,
        produto: `PRODUTO_${codigo}`,
        vendido,
        estoque_inicial: inicial,
        estoque_final: final,
        estoque_esperado: esperado,
        diferenca,
        status,
        tipo_discrepancia: tipo
      });
    }
    
    console.log('✅ Análise concluída:', resultados.length, 'produtos processados');
    
    res.json({
      success: true,
      resultados,
      total_processados: resultados.length,
      tempo_processamento: Date.now() - req.startTime
    });
    
  } catch (error) {
    console.error('❌ Erro na análise:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Middleware para medir tempo
app.use((req, res, next) => {
  req.startTime = Date.now();
  next();
});

// Rota para servir o frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 Endpoint de análise: http://localhost:${PORT}/api/analisar`);
}); 