import { lerPDFReal, PDFInventario, PDFProcessamentoProgress } from '../utils/realPdfReader';
import { lerExcelReal, ExcelMovimentacao, ExcelProcessamentoProgress } from '../utils/realExcelReader';
import { calcularDiscrepanciasReais, DiscrepanciaReal } from '../utils/realDiscrepancyCalculator';
import { supabase } from '../lib/supabase';

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

// Nova função para identificar os 5 produtos mais vendidos e buscar nos inventários
async function analisarTop5MaisVendidos(
  movimentacoes: ExcelMovimentacao[],
  inventarioFisico: PDFInventario[],
  inventarioContabil: PDFInventario[],
  onProgress?: (progress: ProcessamentoProgress) => void
): Promise<DiscrepanciaReal[]> {
  console.log('🏆 ANALISANDO TOP 5 PRODUTOS MAIS VENDIDOS...');
  
  if (onProgress) {
    onProgress({
      etapa: 'Identificando Top 5 Mais Vendidos',
      progresso: 60,
      mensagem: 'Analisando produtos com maior volume de vendas...',
      detalhes: 'Buscando CFOPs de venda e quantidades'
    });
  }

  // 1. Identificar produtos com CFOPs de venda (5xxx, 6xxx, 7xxx)
  const produtosVenda = new Map<string, {
    codigo: string;
    produto: string;
    totalVendas: number;
    cfops: string[];
    entradas: number;
    est_inicial: number;
  }>();

  for (const mov of movimentacoes) {
    const cfopNum = parseInt(mov.cfop);
    
    // CFOPs de venda: 5xxx, 6xxx, 7xxx
    if (cfopNum >= 5000 && cfopNum < 8000) {
      if (!produtosVenda.has(mov.codigo)) {
        produtosVenda.set(mov.codigo, {
          codigo: mov.codigo,
          produto: mov.produto,
          totalVendas: 0,
          cfops: [],
          entradas: mov.entradas,
          est_inicial: mov.est_inicial
        });
      }
      
      const produto = produtosVenda.get(mov.codigo)!;
      produto.totalVendas += mov.saidas;
      if (!produto.cfops.includes(mov.cfop)) {
        produto.cfops.push(mov.cfop);
      }
    }
  }

  console.log(`📊 Produtos com vendas identificados: ${produtosVenda.size}`);

  // 2. Ordenar por volume de vendas e pegar os top 5
  const top5Vendidos = Array.from(produtosVenda.values())
    .sort((a, b) => b.totalVendas - a.totalVendas)
    .slice(0, 5);

  console.log('🏆 TOP 5 PRODUTOS MAIS VENDIDOS:');
  top5Vendidos.forEach((prod, index) => {
    console.log(`${index + 1}. ${prod.produto} (${prod.codigo}) - ${prod.totalVendas} vendas`);
  });

  // 3. Buscar quantidades nos inventários
  const mapFisico = new Map(inventarioFisico.map(item => [item.codigo, item]));
  const mapContabil = new Map(inventarioContabil.map(item => [item.codigo, item]));

  const discrepanciasTop5: DiscrepanciaReal[] = [];

  for (const produtoVenda of top5Vendidos) {
    console.log(`🔍 Analisando ${produtoVenda.produto} (${produtoVenda.codigo})...`);
    
    // Buscar nos inventários
    const fisico = mapFisico.get(produtoVenda.codigo);
    const contabil = mapContabil.get(produtoVenda.codigo);
    
    // Calcular estoque teórico
    const estoqueCalculado = produtoVenda.est_inicial + produtoVenda.entradas - produtoVenda.totalVendas;
    
    // Determinar estoque real (prioridade: físico > contábil)
    const estoqueReal = fisico?.quantidade || contabil?.quantidade || 0;
    
    // Calcular discrepância
    const discrepanciaValor = Math.abs(estoqueReal - estoqueCalculado);
    
    // Determinar tipo de discrepância
    let tipo: DiscrepanciaReal['discrepancia_tipo'] = 'Sem Discrepância';
    let observacoes = `TOP 5 MAIS VENDIDO - ${produtoVenda.totalVendas} vendas`;
    
    if (fisico && contabil) {
      const divergenciaFisicoContabil = Math.abs(fisico.quantidade - contabil.quantidade);
      if (divergenciaFisicoContabil > 0) {
        tipo = 'Divergência Física/Contábil';
        observacoes += ` | Físico: ${fisico.quantidade}, Contábil: ${contabil.quantidade}`;
      }
    }
    
    if (estoqueReal > estoqueCalculado + 1) {
      tipo = 'Estoque Excedente';
      observacoes += ` | Possível compra sem nota fiscal`;
    } else if (estoqueReal < estoqueCalculado - 1) {
      tipo = 'Estoque Faltante';
      observacoes += ` | Possível venda sem nota fiscal`;
    }
    
    // Adicionar informações dos CFOPs
    observacoes += ` | CFOPs: ${produtoVenda.cfops.join(', ')}`;
    
    const discrepancia: DiscrepanciaReal = {
      produto: produtoVenda.produto,
      codigo: produtoVenda.codigo,
      cfop: produtoVenda.cfops.join(', '),
      entradas: produtoVenda.entradas,
      saidas: produtoVenda.totalVendas,
      est_inicial: produtoVenda.est_inicial,
      est_final: estoqueReal,
      est_calculado: estoqueCalculado,
      discrepancia_tipo: tipo,
      discrepancia_valor: discrepanciaValor,
      valor_total: 0, // Será calculado se necessário
      observacoes,
      fonte_inventario_fisico: fisico?.quantidade,
      fonte_inventario_contabil: contabil?.quantidade,
      ranking_vendas: top5Vendidos.indexOf(produtoVenda) + 1
    };
    
    discrepanciasTop5.push(discrepancia);
    
    console.log(`✅ ${produtoVenda.produto}: ${tipo} (${discrepanciaValor} unidades)`);
  }

  console.log(`🏆 Análise dos Top 5 concluída: ${discrepanciasTop5.length} produtos analisados`);
  return discrepanciasTop5;
}

export async function processarArquivosReais(
  files: File[],
  onProgress?: (progress: ProcessamentoProgress) => void
): Promise<ProcessamentoResult> {
  const inicio = Date.now();
  console.log('🚀 Iniciando processamento real de arquivos:', files.map(f => f.name));
  
  try {
    // Separar arquivos por tipo
    const pdfs = files.filter(f => f.name.toLowerCase().endsWith('.pdf'));
    const excels = files.filter(f => 
      f.name.toLowerCase().endsWith('.xlsx') || 
      f.name.toLowerCase().endsWith('.xls') ||
      f.name.toLowerCase().endsWith('.csv')
    );
    
    console.log(`📁 Arquivos encontrados: ${pdfs.length} PDFs, ${excels.length} Excel/CSV`);
    
    // Validar arquivos mínimos
    if (pdfs.length < 2) {
      throw new Error('São necessários pelo menos 2 PDFs (inventário físico e contábil)');
    }
    
    if (excels.length < 1) {
      throw new Error('É necessário pelo menos 1 arquivo Excel/CSV com movimentações fiscais');
    }
    
    // FASE 1: PROCESSAR PDFs
    let pdfFisico: PDFInventario[] = [];
    let pdfContabil: PDFInventario[] = [];
    
    // Identificar PDF físico vs contábil pelo nome
    const pdfFisicoFile = pdfs.find(f => 
      f.name.toLowerCase().includes('fisico') || 
      f.name.toLowerCase().includes('físico') ||
      f.name.toLowerCase().includes('inventario')
    ) || pdfs[0];
    
    const pdfContabilFile = pdfs.find(f => 
      f.name.toLowerCase().includes('contabil') || 
      f.name.toLowerCase().includes('contábil') ||
      f.name.toLowerCase().includes('sistema')
    ) || pdfs[1];
    
    // Processar PDF Físico
    if (onProgress) {
      onProgress({
        etapa: 'Lendo PDF Físico',
        progresso: 10,
        mensagem: `Processando ${pdfFisicoFile.name}...`,
        detalhes: 'Extraindo dados do inventário físico'
      });
    }
    
    pdfFisico = await lerPDFReal(pdfFisicoFile, (progress) => {
      if (onProgress) {
        onProgress({
          etapa: 'Lendo PDF Físico',
          progresso: 10 + (progress.paginaAtual / progress.totalPaginas) * 15,
          mensagem: `Página ${progress.paginaAtual}/${progress.totalPaginas}`,
          detalhes: `${progress.produtosEncontrados} produtos encontrados`,
          subProgresso: { pdf1: progress }
        });
      }
    });
    
    // Processar PDF Contábil
    if (onProgress) {
      onProgress({
        etapa: 'Lendo PDF Contábil',
        progresso: 25,
        mensagem: `Processando ${pdfContabilFile.name}...`,
        detalhes: 'Extraindo dados do inventário contábil'
      });
    }
    
    pdfContabil = await lerPDFReal(pdfContabilFile, (progress) => {
      if (onProgress) {
        onProgress({
          etapa: 'Lendo PDF Contábil',
          progresso: 25 + (progress.paginaAtual / progress.totalPaginas) * 15,
          mensagem: `Página ${progress.paginaAtual}/${progress.totalPaginas}`,
          detalhes: `${progress.produtosEncontrados} produtos encontrados`,
          subProgresso: { pdf2: progress }
        });
      }
    });
    
    // FASE 2: PROCESSAR EXCELs
    let movimentacoes: ExcelMovimentacao[] = [];
    
    for (let i = 0; i < excels.length; i++) {
      const excelFile = excels[i];
      
      if (onProgress) {
        onProgress({
          etapa: 'Lendo Excel/CSV',
          progresso: 40 + (i / excels.length) * 10,
          mensagem: `Processando ${excelFile.name}...`,
          detalhes: `Arquivo ${i + 1} de ${excels.length}`
        });
      }
      
      const movimentacoesExcel = await lerExcelReal(excelFile, (progress) => {
        if (onProgress) {
          onProgress({
            etapa: 'Lendo Excel/CSV',
            progresso: 40 + (i / excels.length) * 10 + (progress.linhaAtual / progress.totalLinhas) * 5,
            mensagem: `Linha ${progress.linhaAtual}/${progress.totalLinhas}`,
            detalhes: `${progress.produtosEncontrados} produtos encontrados`,
            subProgresso: { excel1: progress }
          });
        }
      });
      
      movimentacoes.push(...movimentacoesExcel);
    }
    
    // FASE 3: ANÁLISE DOS TOP 5 MAIS VENDIDOS
    const discrepanciasTop5 = await analisarTop5MaisVendidos(
      movimentacoes,
      pdfFisico,
      pdfContabil,
      onProgress
    );
    
    // FASE 4: CALCULAR DISCREPÂNCIAS GERAIS
    if (onProgress) {
      onProgress({
        etapa: 'Calculando Discrepâncias',
        progresso: 70,
        mensagem: 'Analisando todas as discrepâncias...',
        detalhes: 'Cruzando dados dos 3 fontes'
      });
    }
    
    const discrepanciasGerais = calcularDiscrepanciasReais(
      movimentacoes,
      pdfFisico,
      pdfContabil
    );
    
    // FASE 5: COMBINAR RESULTADOS (priorizar Top 5)
    const todasDiscrepancias = [...discrepanciasTop5];
    
    // Adicionar discrepâncias gerais que não estão no Top 5
    for (const discrepanciaGeral of discrepanciasGerais) {
      const jaExisteNoTop5 = discrepanciasTop5.some(d => d.codigo === discrepanciaGeral.codigo);
      if (!jaExisteNoTop5) {
        todasDiscrepancias.push(discrepanciaGeral);
      }
    }
    
    // FASE 6: SALVAR NO SUPABASE
    if (onProgress) {
      onProgress({
        etapa: 'Salvando Resultados',
        progresso: 90,
        mensagem: 'Salvando análise no banco de dados...',
        detalhes: `${todasDiscrepancias.length} registros`
      });
    }
    
    await salvarDiscrepanciasNoSupabase(todasDiscrepancias);
    
    const tempoProcessamento = Date.now() - inicio;
    
    if (onProgress) {
      onProgress({
        etapa: 'Concluído',
        progresso: 100,
        mensagem: 'Análise concluída com sucesso!',
        detalhes: `${todasDiscrepancias.length} discrepâncias encontradas`
      });
    }
    
    console.log(`✅ Processamento concluído em ${tempoProcessamento}ms`);
    console.log(`🏆 Top 5 mais vendidos analisados: ${discrepanciasTop5.length}`);
    console.log(`📊 Total de discrepâncias: ${todasDiscrepancias.length}`);
    
    return {
      success: true,
      message: `Análise concluída: ${todasDiscrepancias.length} discrepâncias encontradas (incluindo Top 5 mais vendidos)`,
      discrepancias: todasDiscrepancias,
      totalProcessados: pdfFisico.length + pdfContabil.length + movimentacoes.length,
      tempoProcessamento
    };
    
  } catch (error) {
    console.error('❌ Erro no processamento:', error);
    
    const tempoProcessamento = Date.now() - inicio;
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro desconhecido no processamento',
      discrepancias: [],
      totalProcessados: 0,
      tempoProcessamento
    };
  }
}

async function salvarDiscrepanciasNoSupabase(discrepancias: DiscrepanciaReal[]): Promise<void> {
  console.log('💾 Salvando discrepâncias no Supabase...');
  
  try {
    // Limpar dados anteriores
    const { error: deleteError } = await supabase
      .from('analise_discrepancia')
      .delete()
      .neq('id', 0); // Deletar todos
    
    if (deleteError) {
      console.warn('⚠️ Erro ao limpar dados anteriores:', deleteError);
    }
    
    // Inserir novos dados em lotes
    const batchSize = 50;
    for (let i = 0; i < discrepancias.length; i += batchSize) {
      const batch = discrepancias.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('analise_discrepancia')
        .insert(batch.map(d => ({
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
        })));
      
      if (error) {
        console.error('❌ Erro ao salvar lote:', error);
        throw error;
      }
      
      console.log(`✅ Lote ${Math.floor(i / batchSize) + 1} salvo: ${batch.length} registros`);
    }
    
    console.log(`✅ Total de ${discrepancias.length} discrepâncias salvas no Supabase`);
    
  } catch (error) {
    console.error('❌ Erro ao salvar no Supabase:', error);
    throw error;
  }
}

// Função para processar arquivos grandes em chunks
export async function processarArquivosGrandes(
  files: File[],
  onProgress?: (progress: ProcessamentoProgress) => void
): Promise<ProcessamentoResult> {
  console.log('🚀 Iniciando processamento de arquivos grandes...');
  
  // Para arquivos muito grandes, usar processamento em chunks
  const arquivosGrandes = files.filter(f => f.size > 10 * 1024 * 1024); // > 10MB
  
  if (arquivosGrandes.length > 0) {
    console.log(`📁 ${arquivosGrandes.length} arquivos grandes detectados, usando processamento em chunks`);
    
    if (onProgress) {
      onProgress({
        etapa: 'Processamento em Chunks',
        progresso: 5,
        mensagem: 'Arquivos grandes detectados, processando em partes...',
        detalhes: `${arquivosGrandes.length} arquivos > 10MB`
      });
    }
  }
  
  // Usar o processamento normal (que já tem suporte a chunks internamente)
  return processarArquivosReais(files, onProgress);
} 