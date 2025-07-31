import { PDFExtract } from 'pdf.js-extract';

export interface InventarioPDF {
  ano: number;
  produtos: ProdutoInventario[];
}

export interface ProdutoInventario {
  codigo: string;
  descricao: string;
  quantidade: number;
  unidade: string;
}

export interface EstoqueProduto {
  codigo: string;
  descricao: string;
  estoqueInicial: number;
  estoqueFinal: number;
  vendas: number;
  estoqueEsperado: number;
  discrepancia: number;
  status: 'OK' | 'ERRO';
}

export async function extrairAnoDoPDF(pdfText: string): Promise<number> {
  console.log('🔍 Extraindo ano do PDF...');
  
  // Padrões para encontrar ano no PDF
  const padroesAno = [
    /invent[aá]rio\s+(\d{4})/i,
    /estoque\s+(\d{4})/i,
    /balan[cç]o\s+(\d{4})/i,
    /(\d{4})\s*-\s*invent[aá]rio/i,
    /ano\s+(\d{4})/i,
    /exerc[ií]cio\s+(\d{4})/i
  ];
  
  for (const padrao of padroesAno) {
    const match = pdfText.match(padrao);
    if (match) {
      const ano = parseInt(match[1]);
      console.log(`✅ Ano encontrado: ${ano}`);
      return ano;
    }
  }
  
  // Fallback: procurar por ano no formato YYYY
  const anoMatch = pdfText.match(/\b(20[12]\d)\b/);
  if (anoMatch) {
    const ano = parseInt(anoMatch[1]);
    console.log(`✅ Ano encontrado (fallback): ${ano}`);
    return ano;
  }
  
  console.log('⚠️ Ano não encontrado, usando ano atual');
  return new Date().getFullYear();
}

export interface PDFInventario {
  codigo: string;
  produto: string;
  quantidade: number;
  valor?: number;
  pagina?: number;
}

export interface PDFProcessamentoProgress {
  etapa: string;
  mensagem: string;
  progresso: number;
  detalhes: string;
}

export async function lerPDFReal(
  file: File,
  onProgress?: (progress: PDFProcessamentoProgress) => void
): Promise<string> {
  console.log('📄 Iniciando leitura REAL do PDF:', file.name, 'Tamanho:', file.size);
  
  try {
    const pdfExtract = new PDFExtract();
    const options = {}; // Opções padrão
    
    // Converter File para Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log('🔄 Extraindo dados do PDF...');
    
    // Extrair dados reais do PDF
    const data = await pdfExtract.extractBuffer(buffer, options);
    
    console.log(`📊 PDF extraído: ${data.pages.length} páginas encontradas`);
    
    let textoCompleto = '';
    let linhasProcessadas = 0;
    
    // Processar cada página
    for (let paginaIndex = 0; paginaIndex < data.pages.length; paginaIndex++) {
      const pagina = data.pages[paginaIndex];
      
      // Atualizar progresso
      if (onProgress) {
        onProgress({
          etapa: 'Lendo PDF',
          mensagem: `Processando página ${paginaIndex + 1}`,
          progresso: (paginaIndex / data.pages.length) * 100,
          detalhes: `Página ${paginaIndex + 1} de ${data.pages.length}`
        });
      }
      
      console.log(`📄 Processando página ${paginaIndex + 1}: ${pagina.content.length} elementos`);
      
      // Extrair texto da página
      const textoPagina = pagina.content.map(item => item.str).join(' ');
      textoCompleto += textoPagina + '\n';
      
      linhasProcessadas += pagina.content.length;
      
      // PAUSA ASSÍNCRONA PARA NÃO TRAVAR A INTERFACE
      if (paginaIndex % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 5)); // 5ms de pausa
      }
    }
    
    console.log(`✅ PDF processado REALMENTE: ${linhasProcessadas} elementos extraídos`);
    console.log(`📝 Texto extraído: ${textoCompleto.length} caracteres`);
    
    return textoCompleto;
    
  } catch (error) {
    console.error('❌ Erro na leitura REAL do PDF:', error);
    throw new Error(`Falha na leitura do PDF ${file.name}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

function extrairProdutoDaLinhaReal(linha: string): PDFInventario | null {
  // Padrões para identificar produtos em inventário
  const padroes = [
    // Padrão: CÓDIGO PRODUTO QUANTIDADE
    /^(\d{1,4})\s+([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞŸ\s]+)\s+(\d+(?:[.,]\d+)?)$/i,
    // Padrão: CÓDIGO - PRODUTO - QUANTIDADE
    /^(\d{1,4})\s*[-–]\s*([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞŸ\s]+)\s*[-–]\s*(\d+(?:[.,]\d+)?)$/i,
    // Padrão: PRODUTO CÓDIGO QUANTIDADE
    /^([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞŸ\s]+)\s+(\d{1,4})\s+(\d+(?:[.,]\d+)?)$/i
  ];
  
  for (const padrao of padroes) {
    const match = linha.match(padrao);
    if (match) {
      const [, codigo, produto, quantidade] = match;
      
      // Normalizar dados
      const codigoNormalizado = codigo.trim();
      const produtoNormalizado = produto.trim().toUpperCase();
      const quantidadeNormalizada = parseFloat(quantidade.replace(',', '.'));
      
      // Validar se é um produto válido
      if (codigoNormalizado && produtoNormalizado && !isNaN(quantidadeNormalizada)) {
        return {
          codigo: codigoNormalizado,
          produto: produtoNormalizado,
          quantidade: quantidadeNormalizada
        };
      }
    }
  }
  
  return null;
}

// Função para processar PDFs grandes em chunks
export async function processarPDFEmChunks(
  file: File,
  chunkSize: number = 1000,
  onProgress?: (progress: PDFProcessamentoProgress) => void
): Promise<PDFInventario[]> {
  console.log('📄 Processando PDF grande em chunks...');
  
  try {
    const pdfExtract = new PDFExtract();
    const options = {};
    
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const data = await pdfExtract.extractBuffer(buffer, options);
    
    const produtos: PDFInventario[] = [];
    let linhasProcessadas = 0;
    
    for (let paginaIndex = 0; paginaIndex < data.pages.length; paginaIndex++) {
      const pagina = data.pages[paginaIndex];
      
      // Atualizar progresso
      if (onProgress) {
        onProgress({
          etapa: 'Processando PDF',
          mensagem: `Página ${paginaIndex + 1}`,
          progresso: (paginaIndex / data.pages.length) * 100,
          detalhes: `Página ${paginaIndex + 1} de ${data.pages.length}`
        });
      }
      
      // Processar linhas em chunks
      for (let i = 0; i < pagina.content.length; i += chunkSize) {
        const chunk = pagina.content.slice(i, i + chunkSize);
        
        for (const content of chunk) {
          const texto = content.str.trim();
          linhasProcessadas++;
          
          const produto = extrairProdutoDaLinhaReal(texto);
          if (produto) {
            produtos.push({
              ...produto,
              pagina: paginaIndex + 1
            });
          }
        }
        
        // Atualizar progresso
        if (onProgress) {
          onProgress({
            etapa: 'Processando PDF',
            mensagem: `Página ${paginaIndex + 1}`,
            progresso: (paginaIndex / data.pages.length) * 100,
            detalhes: `Página ${paginaIndex + 1} de ${data.pages.length}`
          });
        }
      }
    }
    
    return produtos;
    
  } catch (error) {
    console.error('❌ Erro no processamento em chunks:', error);
    throw error;
  }
} 

export function buscarProdutoNoPDF(pdfText: string, produto: string): ProdutoInventario | null {
  console.log(`🔍 Buscando produto "${produto}" no PDF...`);
  
  // Normalizar nome do produto para busca
  const produtoNormalizado = produto.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  // Dividir PDF em linhas
  const linhas = pdfText.split('\n');
  
  for (const linha of linhas) {
    const linhaNormalizada = linha.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    // Verificar se a linha contém o produto
    if (linhaNormalizada.includes(produtoNormalizado) || 
        produtoNormalizado.includes(linhaNormalizada.substring(0, 20))) {
      
      console.log(`✅ Produto encontrado na linha: "${linha}"`);
      
      // Extrair dados da linha
      const produtoEncontrado = extrairDadosProdutoDaLinha(linha);
      if (produtoEncontrado) {
        return produtoEncontrado;
      }
    }
  }
  
  console.log(`⚠️ Produto "${produto}" não encontrado no PDF`);
  return null;
}

function extrairDadosProdutoDaLinha(linha: string): ProdutoInventario | null {
  try {
    console.log(`🔍 Extraindo dados da linha: "${linha}"`);
    
    // Padrões para extrair dados do produto
    const padroes = [
      // Padrão: CÓDIGO DESCRIÇÃO QUANTIDADE UNIDADE
      /(\d+)\s+([A-Z\s]+)\s+([\d,\.]+)\s+([A-Z]{2,})/i,
      // Padrão: DESCRIÇÃO CÓDIGO QUANTIDADE UNIDADE
      /([A-Z\s]+)\s+(\d+)\s+([\d,\.]+)\s+([A-Z]{2,})/i,
      // Padrão: DESCRIÇÃO QUANTIDADE UNIDADE
      /([A-Z\s]+)\s+([\d,\.]+)\s+([A-Z]{2,})/i,
      // Padrão: CÓDIGO DESCRIÇÃO QUANTIDADE
      /(\d+)\s+([A-Z\s]+)\s+([\d,\.]+)/i
    ];
    
    for (const padrao of padroes) {
      const match = linha.match(padrao);
      if (match) {
        let codigo = '';
        let descricao = '';
        let quantidade = 0;
        let unidade = '';
        
        if (match.length === 5) {
          // Padrão completo: CÓDIGO DESCRIÇÃO QUANTIDADE UNIDADE
          codigo = match[1].trim();
          descricao = match[2].trim();
          quantidade = parseFloat(match[3].replace(',', '.'));
          unidade = match[4].trim();
        } else if (match.length === 4) {
          // Padrão: DESCRIÇÃO CÓDIGO QUANTIDADE UNIDADE ou DESCRIÇÃO QUANTIDADE UNIDADE
          if (isNaN(parseInt(match[1]))) {
            descricao = match[1].trim();
            codigo = match[2].trim();
            quantidade = parseFloat(match[3].replace(',', '.'));
            unidade = match[4].trim();
          } else {
            descricao = match[1].trim();
            quantidade = parseFloat(match[2].replace(',', '.'));
            unidade = match[3].trim();
          }
        } else if (match.length === 4) {
          // Padrão: CÓDIGO DESCRIÇÃO QUANTIDADE
          codigo = match[1].trim();
          descricao = match[2].trim();
          quantidade = parseFloat(match[3].replace(',', '.'));
          unidade = 'UN'; // Unidade padrão
        }
        
        if (quantidade > 0) {
          console.log(`✅ Dados extraídos: Código=${codigo}, Descrição="${descricao}", Qtd=${quantidade}, Unidade=${unidade}`);
          return {
            codigo,
            descricao,
            quantidade,
            unidade
          };
        }
      }
    }
    
    console.log(`⚠️ Não foi possível extrair dados da linha: "${linha}"`);
    return null;
    
  } catch (error) {
    console.error('❌ Erro ao extrair dados do produto:', error);
    return null;
  }
} 

export async function processarInventariosEPDFs(
  pdfFiles: File[],
  top10Produtos: { codigo: string; quantidade: number; cfop: string; produto?: string }[],
  onProgress?: (progress: PDFProcessamentoProgress) => void
): Promise<EstoqueProduto[]> {
  console.log('📊 Processando inventários e PDFs...');
  console.log(`📋 Top 10 produtos:`, top10Produtos);
  
  try {
    if (pdfFiles.length < 2) {
      throw new Error('São necessários pelo menos 2 PDFs de inventário (inicial e final)');
    }
    
    // 1. LER E ANALISAR OS PDFs
    const inventarios: InventarioPDF[] = [];
    
    for (let i = 0; i < pdfFiles.length; i++) {
      const file = pdfFiles[i];
      console.log(`📄 Processando PDF ${i + 1}: ${file.name}`);
      
      if (onProgress) {
        onProgress({
          etapa: 'Lendo PDFs',
          mensagem: `Processando ${file.name}`,
          progresso: (i / pdfFiles.length) * 100,
          detalhes: `PDF ${i + 1} de ${pdfFiles.length}`
        });
      }
      
      const pdfText = await lerPDFReal(file);
      const ano = await extrairAnoDoPDF(pdfText);
      
      inventarios.push({
        ano,
        produtos: [] // Será preenchido conforme necessário
      });
      
      console.log(`✅ PDF ${file.name} processado - Ano: ${ano}`);
    }
    
    // 2. IDENTIFICAR INVENTÁRIO INICIAL E FINAL
    inventarios.sort((a, b) => a.ano - b.ano);
    const inventarioInicial = inventarios[0];
    const inventarioFinal = inventarios[inventarios.length - 1];
    
    console.log(`📊 Inventário Inicial: ${inventarioInicial.ano}`);
    console.log(`📊 Inventário Final: ${inventarioFinal.ano}`);
    
    // 3. PROCESSAR CADA PRODUTO DO TOP 10
    const resultados: EstoqueProduto[] = [];
    
    for (let i = 0; i < top10Produtos.length; i++) {
      const produto = top10Produtos[i];
      console.log(`🔍 Processando produto ${i + 1}/${top10Produtos.length}: ${produto.codigo}`);
      
      if (onProgress) {
        onProgress({
          etapa: 'Analisando produtos',
          mensagem: `Processando ${produto.codigo}`,
          progresso: (i / top10Produtos.length) * 100,
          detalhes: `Produto ${i + 1} de ${top10Produtos.length}`
        });
      }
      
      // Buscar produto nos PDFs
      const pdfInicialText = await lerPDFReal(pdfFiles[0]);
      const pdfFinalText = await lerPDFReal(pdfFiles[1]);
      
      const estoqueInicial = buscarProdutoNoPDF(pdfInicialText, produto.codigo);
      const estoqueFinal = buscarProdutoNoPDF(pdfFinalText, produto.codigo);
      
      // Calcular discrepâncias
      const estoqueInicialQtd = estoqueInicial?.quantidade || 0;
      const estoqueFinalQtd = estoqueFinal?.quantidade || 0;
      const vendas = produto.quantidade;
      
      const estoqueEsperado = estoqueInicialQtd - vendas;
      const discrepancia = estoqueFinalQtd - estoqueEsperado;
      const status = Math.abs(discrepancia) <= 1 ? 'OK' : 'ERRO'; // Tolerância de 1 unidade
      
      const resultado: EstoqueProduto = {
        codigo: produto.codigo,
        descricao: estoqueInicial?.descricao || estoqueFinal?.descricao || `PRODUTO_${produto.codigo}`,
        estoqueInicial: estoqueInicialQtd,
        estoqueFinal: estoqueFinalQtd,
        vendas,
        estoqueEsperado,
        discrepancia,
        status
      };
      
      resultados.push(resultado);
      
      console.log(`✅ Produto ${produto.codigo} processado:`);
      console.log(`   Estoque Inicial: ${estoqueInicialQtd}`);
      console.log(`   Vendas: ${vendas}`);
      console.log(`   Estoque Esperado: ${estoqueEsperado}`);
      console.log(`   Estoque Final: ${estoqueFinalQtd}`);
      console.log(`   Discrepância: ${discrepancia} (${status})`);
    }
    
    console.log(`✅ Processamento concluído: ${resultados.length} produtos analisados`);
    
    // 4. RESUMO FINAL
    const produtosComErro = resultados.filter(r => r.status === 'ERRO');
    const produtosOK = resultados.filter(r => r.status === 'OK');
    
    console.log(`📊 Resumo final:`);
    console.log(`   ✅ Produtos OK: ${produtosOK.length}`);
    console.log(`   ❌ Produtos com ERRO: ${produtosComErro.length}`);
    
    if (produtosComErro.length > 0) {
      console.log(`🚨 Produtos com discrepância:`);
      produtosComErro.forEach(p => {
        console.log(`   - ${p.codigo}: ${p.discrepancia} unidades`);
      });
    }
    
    return resultados;
    
  } catch (error) {
    console.error('❌ Erro ao processar inventários:', error);
    throw new Error(`Falha no processamento dos inventários: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
} 