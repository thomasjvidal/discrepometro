import * as pdfjsLib from 'pdfjs-dist';

// Configurar worker do PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export interface PDFInventario {
  codigo: string;
  produto: string;
  quantidade: number;
  tipo: 'fisico' | 'contabil';
}

export async function lerPDFReal(file: File): Promise<PDFInventario[]> {
  console.log('📄 INICIANDO LEITURA REAL DO PDF COM PDF.js');
  console.log(`📁 Arquivo: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
  
  try {
    // Converter File para ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Determinar tipo baseado no nome do arquivo
    const tipo: 'fisico' | 'contabil' = 
      file.name.toLowerCase().includes('fisico') || 
      file.name.toLowerCase().includes('2021') ||
      file.name.toLowerCase().includes('inventario')
        ? 'fisico' 
        : 'contabil';
    
    console.log(`🏷️ Tipo identificado: ${tipo}`);
    
    // Carregar PDF com PDF.js
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    console.log(`📄 PDF carregado: ${pdf.numPages} páginas`);
    
    let textoCompleto = '';
    
    // Extrair texto de todas as páginas
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      console.log(`📖 Processando página ${pageNum}/${pdf.numPages}`);
      
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Concatenar todos os itens de texto
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      textoCompleto += pageText + '\n';
    }
    
    console.log(`📝 Texto extraído: ${textoCompleto.length} caracteres`);
    
    // Extrair dados do texto
    const inventario = extrairInventarioDoPDF(textoCompleto, tipo);
    
    console.log(`📊 PDF REAL PROCESSADO: ${inventario.length} itens extraídos`);
    return inventario;
    
  } catch (error) {
    console.error('❌ Erro na leitura real do PDF:', error);
    throw new Error(`Erro ao ler PDF: ${error.message}`);
  }
}

function extrairInventarioDoPDF(texto: string, tipo: 'fisico' | 'contabil'): PDFInventario[] {
  console.log('🔍 EXTRAINDO DADOS REAIS DO TEXTO DO PDF...');
  
  const inventario: PDFInventario[] = [];
  const linhas = texto.split(/[\n\r]+/).filter(linha => linha.trim());
  
  console.log(`📄 Processando ${linhas.length} linhas de texto`);
  
  // Padrões REAIS para diferentes formatos de PDF
  const padroes = [
    // Padrão 1: "Código: 001 Produto: NESCAU Quantidade: 95"
    /(?:código|codigo|cod)[:\s]*(\d+)[\s\-]*([A-ZÀ-ÿ][A-Za-zÀ-ÿ0-9\s\-\.]{3,80})[\s\-]*(?:quantidade|qtd|quant|estoque|saldo)[:\s]*(\d+)/gi,
    
    // Padrão 2: "001 - NESCAU CEREAL 210G - 95"
    /(\d{2,6})\s*[\-\s]+([A-ZÀ-ÿ][A-Za-zÀ-ÿ0-9\s\-\.]{3,80})\s*[\-\s]+(\d{1,8})/g,
    
    // Padrão 3: Tabular "001    NESCAU CEREAL    95"
    /(\d{2,6})\s+([A-ZÀ-ÿ][A-Za-zÀ-ÿ0-9\s\-\.]{3,80})\s+(\d{1,8})(?:\s|$)/g,
    
    // Padrão 4: "Item: 001 Desc: NESCAU Estoque: 95"
    /(?:item|produto)[:\s]*(\d+)[\s\-]*(?:desc|descrição|produto|nome)[:\s]*([A-ZÀ-ÿ][A-Za-zÀ-ÿ0-9\s\-\.]{3,80})[\s\-]*(?:estoque|quantidade|saldo)[:\s]*(\d+)/gi,
    
    // Padrão 5: "001|NESCAU CEREAL|95" (separado por pipe)
    /(\d{2,6})\s*\|\s*([A-ZÀ-ÿ][A-Za-zÀ-ÿ0-9\s\-\.]{3,80})\s*\|\s*(\d{1,8})/g,
    
    // Padrão 6: "001;NESCAU CEREAL;95" (separado por ponto e vírgula)
    /(\d{2,6})\s*;\s*([A-ZÀ-ÿ][A-Za-zÀ-ÿ0-9\s\-\.]{3,80})\s*;\s*(\d{1,8})/g,
    
    // Padrão 7: "001,NESCAU CEREAL,95" (separado por vírgula)
    /(\d{2,6})\s*,\s*([A-ZÀ-ÿ][A-Za-zÀ-ÿ0-9\s\-\.]{3,80})\s*,\s*(\d{1,8})/g
  ];
  
  // Tentar cada padrão
  for (let i = 0; i < padroes.length; i++) {
    const padrao = padroes[i];
    console.log(`🔎 Testando padrão ${i + 1}/${padroes.length}: ${padrao.source.substring(0, 50)}...`);
    
    let match;
    padrao.lastIndex = 0; // Reset regex
    let encontrados = 0;
    
    while ((match = padrao.exec(texto)) !== null) {
      const codigo = match[1].trim();
      let produto = match[2].trim();
      const quantidadeStr = match[3];
      const quantidade = parseInt(quantidadeStr);
      
      // Limpar produto
      produto = produto
        .replace(/[^\w\s\-\.çÇãÃõÕáÁéÉíÍóÓúÚâÂêÊîÎôÔûÛ]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      // Validações RIGOROSAS
      if (codigo && 
          codigo.length >= 2 && codigo.length <= 10 &&
          produto && 
          produto.length >= 3 && produto.length <= 80 &&
          !isNaN(quantidade) && 
          quantidade >= 0 && 
          quantidade <= 999999) {
        
        // Evitar duplicatas
        const jaExiste = inventario.find(item => item.codigo === codigo);
        if (!jaExiste) {
          inventario.push({
            codigo,
            produto,
            quantidade,
            tipo
          });
          
          encontrados++;
          console.log(`✅ Item ${encontrados}: ${codigo} - ${produto} (${quantidade})`);
        }
      }
    }
    
    // Se encontrou resultados suficientes, parar
    if (inventario.length >= 3) {
      console.log(`🎯 Padrão ${i + 1} funcionou! ${inventario.length} itens encontrados`);
      break;
    } else if (inventario.length > 0) {
      console.log(`⚠️ Padrão ${i + 1} encontrou apenas ${inventario.length} itens, tentando próximo...`);
      inventario.length = 0; // Limpar e tentar próximo padrão
    }
  }
  
  // Se ainda não encontrou nada, tentar extração linha por linha
  if (inventario.length === 0) {
    console.log('⚠️ Padrões específicos falharam, tentando análise linha por linha...');
    
    for (const linha of linhas) {
      // Procurar qualquer linha com números que podem ser códigos e quantidades
      const matches = linha.match(/(\d{2,6})\s+(.{3,50}?)\s+(\d{1,6})(?:\s|$)/);
      
      if (matches) {
        const codigo = matches[1];
        const produto = matches[2].trim();
        const quantidade = parseInt(matches[3]);
        
        if (quantidade > 0 && quantidade < 100000 && produto.length > 3) {
          inventario.push({
            codigo,
            produto,
            quantidade,
            tipo
          });
          
          console.log(`✅ Item linha por linha: ${codigo} - ${produto} (${quantidade})`);
          
          if (inventario.length >= 50) break; // Limitar para não sobrecarregar
        }
      }
    }
  }
  
  // Log final
  if (inventario.length > 0) {
    console.log(`🎉 EXTRAÇÃO REAL CONCLUÍDA: ${inventario.length} produtos encontrados!`);
    
    // Mostrar primeiros e últimos itens
    if (inventario.length > 5) {
      console.log('📋 Primeiros 3 itens:');
      inventario.slice(0, 3).forEach(item => 
        console.log(`   • ${item.codigo}: ${item.produto} (${item.quantidade})`)
      );
      console.log('📋 Últimos 2 itens:');
      inventario.slice(-2).forEach(item => 
        console.log(`   • ${item.codigo}: ${item.produto} (${item.quantidade})`)
      );
    }
  } else {
    console.warn('⚠️ NENHUM ITEM ENCONTRADO - Verifique o formato do PDF');
    console.log('📄 Amostra do texto extraído (primeiros 500 chars):');
    console.log(texto.substring(0, 500));
  }
  
  return inventario;
} 