import { lerPDFReal, PDFInventario, PDFProcessamentoProgress } from '../utils/realPdfReader';
import { lerExcelReal, ExcelMovimentacao, ExcelProcessamentoProgress } from '../utils/realExcelReader';
import { calcularDiscrepanciasReais, DiscrepanciaReal } from '../utils/realDiscrepancyCalculator';

export interface ProcessamentoProgress {
  etapa: string;
  progresso: number;
  mensagem: string;
  detalhes?: string;
  subProgresso?: {
    pdf1?: PDFProcessamentoProgress;
    pdf2?: PDFProcessamentoProgress;
    excel1?: ExcelProcessamentoProgress;
    excel2?: ExcelProcessamentoProgress;
  };
}

export interface ProcessamentoResult {
  success: boolean;
  message: string;
  discrepancias: DiscrepanciaReal[];
  totalProcessados: number;
  tempoProcessamento: number;
}

// ETAPA 1: VALIDAR E SEPARAR ARQUIVOS
function validarESepararArquivos(files: File[]): {
  pdfs: File[];
  excels: File[];
  pdfInicial: File;
  pdfFinal: File;
} {
  console.log('📁 Validando e separando arquivos...');
  
    const pdfs = files.filter(f => f.name.toLowerCase().endsWith('.pdf'));
    const excels = files.filter(f => 
      f.name.toLowerCase().endsWith('.xlsx') || 
      f.name.toLowerCase().endsWith('.xls') ||
    f.name.toLowerCase().endsWith('.xlsb') ||
      f.name.toLowerCase().endsWith('.csv')
    );
    
  // Validar quantidade mínima
    if (pdfs.length < 2) {
      throw new Error('São necessários pelo menos 2 PDFs (inventário físico e contábil)');
    }
    
    if (excels.length < 1) {
      throw new Error('É necessário pelo menos 1 arquivo Excel/CSV com movimentações fiscais');
    }
    
  // Identificar anos dos PDFs e validar se são consecutivos
  const pdfsComAno = pdfs.map(pdf => {
    const ano = pdf.name.match(/\d{4}/)?.[0];
    return { file: pdf, ano: ano ? parseInt(ano) : 0 };
  }).filter(p => p.ano > 0);
  
  if (pdfsComAno.length < 2) {
    throw new Error('Não foi possível identificar anos consecutivos nos PDFs');
  }
  
  // Ordenar por ano e validar se são consecutivos
  pdfsComAno.sort((a, b) => a.ano - b.ano);
  
  if (pdfsComAno[1].ano - pdfsComAno[0].ano !== 1) {
    throw new Error('Os PDFs devem ser de anos consecutivos (ex: 2023 e 2024)');
  }
  
  const pdfInicial = pdfsComAno[0].file;
  const pdfFinal = pdfsComAno[1].file;
  
  console.log(`✅ PDF Inicial (${pdfsComAno[0].ano}): ${pdfInicial.name}`);
  console.log(`✅ PDF Final (${pdfsComAno[1].ano}): ${pdfFinal.name}`);
  
  return { pdfs, excels, pdfInicial, pdfFinal };
}

// ETAPA 2: IDENTIFICAR TOP 10 PRODUTOS MAIS VENDIDOS
async function identificarTop10ProdutosVendidos(
  excels: File[],
  onProgress?: (progress: ProcessamentoProgress) => void
): Promise<{
  produto: string;
  codigo: string;
  totalVendas: number;
  cfops: string[];
}[]> {
  console.log('🏆 Identificando Top 10 produtos mais vendidos...');
  console.log(`📁 Total de arquivos Excel/CSV: ${excels.length}`);
  
    if (onProgress) {
      onProgress({
      etapa: 'Lendo Planilhas',
        progresso: 10,
        mensagem: 'Identificando CFOPs de venda...',
        detalhes: 'Buscando produtos mais vendidos'
      });
    }
    
    let movimentacoes: ExcelMovimentacao[] = [];
  let totalMovimentacoes = 0;
  let cfopsVendaEncontrados = 0;
    
    for (let i = 0; i < excels.length; i++) {
      const excelFile = excels[i];
    console.log(`📊 Processando arquivo ${i + 1}/${excels.length}: ${excelFile.name}`);
      
      if (onProgress) {
        onProgress({
          etapa: 'Lendo Excel/CSV',
          progresso: 10 + (i / excels.length) * 20,
          mensagem: `Processando ${excelFile.name}...`,
          detalhes: `Arquivo ${i + 1} de ${excels.length}`
        });
      }
      
      const movimentacoesExcel = await lerExcelReal(excelFile, (progress) => {
        if (onProgress) {
          onProgress({
            etapa: 'Lendo Excel/CSV',
            progresso: 10 + (i / excels.length) * 20 + (progress.planilhaAtual / progress.totalPlanilhas) * 10,
            mensagem: `Planilha ${progress.planilhaAtual}/${progress.totalPlanilhas}`,
            detalhes: `${progress.movimentacoesEncontradas} movimentações encontradas`,
            subProgresso: { excel1: progress }
          });
        }
      });
      
    console.log(`✅ Arquivo ${excelFile.name}: ${movimentacoesExcel.length} movimentações extraídas`);
      movimentacoes.push(...movimentacoesExcel);
    totalMovimentacoes += movimentacoesExcel.length;
  }
  
  console.log(`📊 TOTAL DE MOVIMENTAÇÕES EXTRAÍDAS: ${totalMovimentacoes}`);
    
    // Agrupar por produto e somar vendas (CFOPs 5xxx, 6xxx, 7xxx)
    const vendasPorProduto = new Map<string, {
      produto: string;
      codigo: string;
      totalVendas: number;
      cfops: string[];
    }>();
  
  console.log('🔍 Analisando CFOPs de venda...');
    
    for (const mov of movimentacoes) {
      const cfopNum = parseInt(mov.cfop);
      
      // CFOPs de venda: 5xxx, 6xxx, 7xxx
      if (cfopNum >= 5000 && cfopNum < 8000) {
      cfopsVendaEncontrados++;
        const key = mov.codigo || mov.produto;
        
        if (!vendasPorProduto.has(key)) {
          vendasPorProduto.set(key, {
            produto: mov.produto,
            codigo: mov.codigo,
            totalVendas: 0,
            cfops: []
          });
        }
        
        const produto = vendasPorProduto.get(key)!;
        produto.totalVendas += mov.saidas;
        if (!produto.cfops.includes(mov.cfop)) {
          produto.cfops.push(mov.cfop);
        }
      
      // Log detalhado para debug
      if (cfopsVendaEncontrados <= 10) {
        console.log(`✅ CFOP ${mov.cfop} (${mov.produto}): ${mov.saidas} vendas`);
      }
    }
  }
  
  console.log(`📊 CFOPs de venda encontrados: ${cfopsVendaEncontrados}`);
  console.log(`📊 Produtos com vendas identificados: ${vendasPorProduto.size}`);
    
    // Ordenar por vendas e pegar top 10
    const top10Vendidos = Array.from(vendasPorProduto.values())
      .sort((a, b) => b.totalVendas - a.totalVendas)
      .slice(0, 10);
    
    console.log('🏆 TOP 10 PRODUTOS MAIS VENDIDOS:');
  if (top10Vendidos.length === 0) {
    console.log('⚠️ NENHUM PRODUTO COM VENDAS ENCONTRADO!');
    console.log('🔍 Possíveis causas:');
    console.log('   - Planilhas não contêm CFOPs de venda (5xxx, 6xxx, 7xxx)');
    console.log('   - Colunas não identificadas corretamente');
    console.log('   - Dados não estão no formato esperado');
  } else {
    top10Vendidos.forEach((prod, index) => {
      console.log(`${index + 1}. ${prod.produto} (${prod.codigo}) - ${prod.totalVendas} vendas`);
    });
  }
  
  return top10Vendidos;
}

// ETAPA 3: LER PDFs E CAPTURAR ESTOQUES
async function lerPDFsECapturarEstoques(
  pdfInicial: File,
  pdfFinal: File,
  top10Vendidos: { produto: string; codigo: string; totalVendas: number; cfops: string[] }[],
  onProgress?: (progress: ProcessamentoProgress) => void
): Promise<{
  estoquesIniciais: Map<string, number>;
  estoquesFinais: Map<string, number>;
}> {
  console.log('📄 Lendo PDFs e capturando estoques...');
    
    // Processar PDF Inicial
    if (onProgress) {
      onProgress({
        etapa: 'Lendo PDF Inicial',
        progresso: 50,
        mensagem: `Processando ${pdfInicial.name}...`,
        detalhes: 'Extraindo estoque inicial dos produtos mais vendidos'
      });
    }
    
    const pdfInicialData = await lerPDFReal(pdfInicial, (progress) => {
      if (onProgress) {
        onProgress({
          etapa: 'Lendo PDF Inicial',
          progresso: 50 + (progress.paginaAtual / progress.totalPaginas) * 15,
          mensagem: `Página ${progress.paginaAtual}/${progress.totalPaginas}`,
          detalhes: `${progress.produtosEncontrados} produtos encontrados`,
          subProgresso: { pdf1: progress }
        });
      }
    });
    
    // Processar PDF Final
    if (onProgress) {
      onProgress({
        etapa: 'Lendo PDF Final',
        progresso: 65,
        mensagem: `Processando ${pdfFinal.name}...`,
        detalhes: 'Extraindo estoque final dos produtos mais vendidos'
      });
    }
    
    const pdfFinalData = await lerPDFReal(pdfFinal, (progress) => {
      if (onProgress) {
        onProgress({
          etapa: 'Lendo PDF Final',
          progresso: 65 + (progress.paginaAtual / progress.totalPaginas) * 15,
          mensagem: `Página ${progress.paginaAtual}/${progress.totalPaginas}`,
          detalhes: `${progress.produtosEncontrados} produtos encontrados`,
          subProgresso: { pdf2: progress }
        });
      }
    });
    
  // Criar mapas para busca rápida
  const mapInicial = new Map(pdfInicialData.map(item => [item.codigo || item.produto, item.quantidade]));
  const mapFinal = new Map(pdfFinalData.map(item => [item.codigo || item.produto, item.quantidade]));
  
  return {
    estoquesIniciais: mapInicial,
    estoquesFinais: mapFinal
  };
}

// ETAPA 4: CALCULAR DISCREPÂNCIAS
function calcularDiscrepancias(
  top10Vendidos: { produto: string; codigo: string; totalVendas: number; cfops: string[] }[],
  estoquesIniciais: Map<string, number>,
  estoquesFinais: Map<string, number>
): DiscrepanciaReal[] {
  console.log('⚖️ Calculando discrepâncias...');
  console.log(`📊 Produtos para análise: ${top10Vendidos.length}`);
    
    const discrepancias: DiscrepanciaReal[] = [];
    
    for (const produtoVenda of top10Vendidos) {
      console.log(`🔍 Analisando ${produtoVenda.produto} (${produtoVenda.codigo})...`);
      
      // Buscar estoques nos PDFs
    const estoqueInicial = estoquesIniciais.get(produtoVenda.codigo) || estoquesIniciais.get(produtoVenda.produto) || 0;
    const estoqueFinal = estoquesFinais.get(produtoVenda.codigo) || estoquesFinais.get(produtoVenda.produto) || 0;
    
    console.log(`📊 ${produtoVenda.produto}:`);
    console.log(`   - Estoque inicial: ${estoqueInicial}`);
    console.log(`   - Total vendido: ${produtoVenda.totalVendas}`);
    console.log(`   - Estoque final: ${estoqueFinal}`);
    
    // CORREÇÃO: Calcular estoque esperado conforme documentação
    // estoque_esperado = estoque_inicial - quantidade_vendida
      const estoqueEsperado = estoqueInicial - produtoVenda.totalVendas;
      
      // Calcular discrepância
      const diferenca = estoqueFinal - estoqueEsperado;
      const discrepanciaValor = Math.abs(diferenca);
      
    console.log(`   - Estoque esperado: ${estoqueEsperado}`);
    console.log(`   - Diferença: ${diferenca} (${discrepanciaValor} unidades)`);
    
    // Determinar tipo de discrepância conforme documentação
      let tipo: DiscrepanciaReal['discrepancia_tipo'] = 'Sem Discrepância';
      let observacoes = '';
      
      if (discrepanciaValor > 1) { // Margem de tolerância de 1 unidade
        if (diferenca < 0) {
          // Estoque final < esperado = VENDA SEM NOTA
          tipo = 'Estoque Faltante';
          observacoes = `VENDA SEM NOTA FISCAL: ${Math.abs(diferenca)} unidades a menos. `;
        } else {
          // Estoque final > esperado = COMPRA SEM NOTA
          tipo = 'Estoque Excedente';
          observacoes = `COMPRA SEM NOTA FISCAL: ${diferenca} unidades a mais. `;
        }
      }
      
      // Adicionar informações detalhadas
      observacoes += `Estoque inicial: ${estoqueInicial}, Estoque final: ${estoqueFinal}. `;
      observacoes += `Total vendido: ${produtoVenda.totalVendas}. `;
      observacoes += `Estoque esperado: ${estoqueEsperado}. `;
      observacoes += `CFOPs de venda: ${produtoVenda.cfops.join(', ')}.`;
      
      const discrepancia: DiscrepanciaReal = {
        produto: produtoVenda.produto,
        codigo: produtoVenda.codigo,
        cfop: produtoVenda.cfops.join(', '),
        valor_unitario: 0, // Será calculado depois se necessário
        valor_total: 0, // Será calculado depois se necessário
        entradas: 0, // Não temos entradas, apenas vendas
        saidas: produtoVenda.totalVendas,
        est_inicial: estoqueInicial,
        est_final: estoqueFinal,
        est_calculado: estoqueEsperado,
        est_fisico: estoqueFinal, // Assumindo que é o estoque físico
        est_contabil: estoqueFinal, // Assumindo que é o estoque contábil
        discrepancia_tipo: tipo,
        discrepancia_valor: discrepanciaValor,
        observacoes: observacoes,
        ano: new Date().getFullYear(),
        user_id: 'sistema_real',
        ranking_vendas: discrepancias.length + 1
      };
      
      discrepancias.push(discrepancia);
      console.log(`✅ ${produtoVenda.produto}: ${tipo} (${discrepanciaValor} unidades)`);
    }
    
    console.log(`✅ Análise concluída: ${discrepancias.length} produtos do top 10 analisados`);
    
  // Resumo das discrepâncias
  const produtosComErro = discrepancias.filter(d => d.discrepancia_tipo !== 'Sem Discrepância');
  const produtosOK = discrepancias.filter(d => d.discrepancia_tipo === 'Sem Discrepância');
  
  console.log(`📊 RESUMO:`);
  console.log(`   - Produtos OK: ${produtosOK.length}`);
  console.log(`   - Produtos com ERRO: ${produtosComErro.length}`);
  
  return discrepancias;
}

// ETAPA 5: SALVAR RESULTADOS LOCALMENTE (SEM SUPABASE)
async function salvarResultadosLocalmente(discrepancias: DiscrepanciaReal[]): Promise<void> {
  console.log('💾 Salvando resultados localmente...');
  
  try {
    // Salvar em localStorage para persistência local
    const dadosParaSalvar = discrepancias.map(d => ({
      produto: d.produto,
      codigo: d.codigo,
      cfop: d.cfop,
      entradas: d.entradas,
      saidas: d.saidas,
      est_inicial: d.est_inicial,
      est_final: d.est_final,
      est_calculado: d.est_calculado,
      discrepancia_tipo: d.discrepancia_tipo,
      discrepancia_valor: d.discrepancia_valor,
      valor_total: d.valor_total,
      observacoes: d.observacoes,
      created_at: new Date().toISOString()
    }));
    
    // Salvar no localStorage
    localStorage.setItem('analise_discrepancia', JSON.stringify(dadosParaSalvar));
    
    console.log(`✅ ${dadosParaSalvar.length} resultados salvos localmente`);
    
  } catch (error) {
    console.error('❌ Erro ao salvar localmente:', error);
    throw error;
  }
}

// FUNÇÃO PRINCIPAL - PROCESSAMENTO COMPLETO
export async function processarArquivosReais(
  files: File[],
  onProgress?: (progress: ProcessamentoProgress) => void
): Promise<ProcessamentoResult> {
  const inicio = Date.now();
  console.log('🚀 Iniciando processamento real de arquivos:', files.map(f => f.name));
  console.log('📊 Total de arquivos:', files.length);
  
  try {
    // ETAPA 1: VALIDAR E SEPARAR ARQUIVOS
    const { pdfs, excels, pdfInicial, pdfFinal } = validarESepararArquivos(files);
    
    // ETAPA 2: IDENTIFICAR TOP 10 PRODUTOS MAIS VENDIDOS
    const top10Vendidos = await identificarTop10ProdutosVendidos(excels, onProgress);
    
    // ETAPA 3: LER PDFs E CAPTURAR ESTOQUES
    const { estoquesIniciais, estoquesFinais } = await lerPDFsECapturarEstoques(
      pdfInicial, 
      pdfFinal, 
      top10Vendidos, 
      onProgress
    );
    
    // ETAPA 4: CALCULAR DISCREPÂNCIAS
    if (onProgress) {
      onProgress({
        etapa: 'Calculando Discrepâncias',
        progresso: 80,
        mensagem: 'Analisando discrepâncias dos produtos mais vendidos...',
        detalhes: 'Comparando estoque esperado vs real'
      });
    }
    
    const discrepancias = calcularDiscrepancias(top10Vendidos, estoquesIniciais, estoquesFinais);
    
    // ETAPA 5: SALVAR RESULTADOS LOCALMENTE
    if (onProgress) {
      onProgress({
        etapa: 'Salvando Resultados',
        progresso: 90,
        mensagem: 'Salvando resultados localmente...',
        detalhes: `${discrepancias.length} discrepâncias encontradas`
      });
    }
    
    await salvarResultadosLocalmente(discrepancias);
    
    // ETAPA 6: CONCLUIR PROCESSAMENTO
    if (onProgress) {
      onProgress({
        etapa: 'Concluído',
        progresso: 100,
        mensagem: 'Processamento finalizado!',
        detalhes: `${discrepancias.length} discrepâncias analisadas`
      });
    }
    
    return {
      success: true,
      message: `Processamento real concluído: ${discrepancias.length} discrepâncias encontradas`,
      discrepancias: discrepancias,
      totalProcessados: discrepancias.length,
      tempoProcessamento: Date.now() - inicio
    };
    
  } catch (error: any) {
    console.error('❌ Erro no processamento real:', error);
    
    return {
      success: false,
      message: error.message || 'Erro desconhecido no processamento',
      discrepancias: [],
      totalProcessados: 0,
      tempoProcessamento: Date.now() - inicio
    };
  }
}

// Função para processar arquivos grandes em chunks
export async function processarArquivosGrandes(
  files: File[],
  onProgress?: (progress: ProcessamentoProgress) => void
): Promise<ProcessamentoResult> {
  // Implementação para arquivos muito grandes
  return processarArquivosReais(files, onProgress);
} 