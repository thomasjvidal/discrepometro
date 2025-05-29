import { createClient } from '@supabase/supabase-js';
import { lerExcelReal } from '../utils/realExcelReader';
import { lerPDFReal } from '../utils/realPdfReader';
import { calcularDiscrepanciasReais, DiscrepanciaReal } from '../utils/realDiscrepancyCalculator';

const supabaseUrl = 'https://hvjjcegcdivumprqviug.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2ampjZWdjZGl2dW1wcnF2aXVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2Nzg1MDAsImV4cCI6MjA2MzI1NDUwMH0.nerS1VvC5ebHOyHrtTMwrzdpCkAWpRpfvlvdlSspiG4';

const supabase = createClient(supabaseUrl, supabaseKey);

export interface ProcessoReal {
  etapa: string;
  progresso: number;
  mensagem: string;
  detalhes?: string;
}

export interface ResultadoProcessamento {
  sucesso: boolean;
  totalProdutos: number;
  totalDiscrepancias: number;
  valorTotalDiscrepancias: number;
  tempoProcessamento: number;
  metodo: string;
}

export async function processarArquivosReal(
  arquivos: File[],
  onProgress: (processo: ProcessoReal) => void
): Promise<ResultadoProcessamento> {
  const inicioProcessamento = Date.now();
  
  console.log('🚀 INICIANDO PROCESSAMENTO REAL COMPLETO');
  console.log(`📁 Arquivos recebidos: ${arquivos.length}`);
  
  try {
    // ETAPA 1: VALIDAR E CLASSIFICAR ARQUIVOS
    onProgress({
      etapa: 'Validando arquivos',
      progresso: 5,
      mensagem: 'Classificando tipos de arquivo...',
      detalhes: `${arquivos.length} arquivos para processar`
    });
    
    let arquivoExcel: File | null = null;
    let pdfFisico: File | null = null;
    let pdfContabil: File | null = null;
    
    for (const arquivo of arquivos) {
      console.log(`📄 Analisando: ${arquivo.name} (${arquivo.type})`);
      
      if (arquivo.name.toLowerCase().includes('.xlsx') || 
          arquivo.name.toLowerCase().includes('.xls') || 
          arquivo.type.includes('spreadsheet')) {
        arquivoExcel = arquivo;
        console.log('📊 Excel identificado');
      } 
      else if (arquivo.name.toLowerCase().includes('.pdf') || 
               arquivo.type.includes('pdf')) {
        if (arquivo.name.toLowerCase().includes('fisico') || 
            arquivo.name.toLowerCase().includes('2021') ||
            arquivo.name.toLowerCase().includes('inventario')) {
          pdfFisico = arquivo;
          console.log('📋 PDF Físico identificado');
        } else {
          pdfContabil = arquivo;
          console.log('📋 PDF Contábil identificado');
        }
      }
    }
    
    if (!arquivoExcel) {
      throw new Error('Arquivo Excel (.xlsx) é obrigatório para análise de movimentação');
    }
    
    // ETAPA 2: PROCESSAR EXCEL
    onProgress({
      etapa: 'Lendo Excel',
      progresso: 15,
      mensagem: 'Extraindo movimentação do Excel...',
      detalhes: `Processando ${arquivoExcel.name}`
    });
    
    const movimentacoes = await lerExcelReal(arquivoExcel);
    console.log(`✅ Excel processado: ${movimentacoes.length} movimentações`);
    
    // ETAPA 3: PROCESSAR PDF FÍSICO
    let inventarioFisico: any[] = [];
    if (pdfFisico) {
      onProgress({
        etapa: 'Lendo PDF Físico',
        progresso: 35,
        mensagem: 'Extraindo inventário físico...',
        detalhes: `Processando ${pdfFisico.name}`
      });
      
      inventarioFisico = await lerPDFReal(pdfFisico);
      console.log(`✅ PDF Físico processado: ${inventarioFisico.length} itens`);
    }
    
    // ETAPA 4: PROCESSAR PDF CONTÁBIL
    let inventarioContabil: any[] = [];
    if (pdfContabil) {
      onProgress({
        etapa: 'Lendo PDF Contábil',
        progresso: 55,
        mensagem: 'Extraindo inventário contábil...',
        detalhes: `Processando ${pdfContabil.name}`
      });
      
      inventarioContabil = await lerPDFReal(pdfContabil);
      console.log(`✅ PDF Contábil processado: ${inventarioContabil.length} itens`);
    }
    
    // ETAPA 5: CALCULAR DISCREPÂNCIAS
    onProgress({
      etapa: 'Calculando discrepâncias',
      progresso: 75,
      mensagem: 'Cruzando dados e calculando discrepâncias...',
      detalhes: `Analisando ${movimentacoes.length} produtos`
    });
    
    const discrepancias = calcularDiscrepanciasReais(
      movimentacoes,
      inventarioFisico,
      inventarioContabil
    );
    
    console.log(`✅ Discrepâncias calculadas: ${discrepancias.length} produtos analisados`);
    
    // ETAPA 6: GRAVAR NO SUPABASE
    onProgress({
      etapa: 'Salvando no banco',
      progresso: 90,
      mensagem: 'Gravando resultados no Supabase...',
      detalhes: `Inserindo ${discrepancias.length} registros`
    });
    
    await salvarDiscrepanciasSupabase(discrepancias);
    
    // ETAPA 7: FINALIZAR
    onProgress({
      etapa: 'Concluído',
      progresso: 100,
      mensagem: 'Processamento real concluído com sucesso!',
      detalhes: `${discrepancias.length} produtos analisados`
    });
    
    const fimProcessamento = Date.now();
    const tempoProcessamento = fimProcessamento - inicioProcessamento;
    
    const resultado: ResultadoProcessamento = {
      sucesso: true,
      totalProdutos: discrepancias.length,
      totalDiscrepancias: discrepancias.filter(d => d.discrepancia_tipo !== 'Sem Discrepância').length,
      valorTotalDiscrepancias: discrepancias.reduce((sum, d) => sum + d.discrepancia_valor, 0),
      tempoProcessamento,
      metodo: 'PROCESSAMENTO_REAL_EXCELJS_PDFPARSE'
    };
    
    console.log('🎉 PROCESSAMENTO REAL CONCLUÍDO:', resultado);
    return resultado;
    
  } catch (error) {
    console.error('❌ Erro no processamento real:', error);
    throw new Error(`Falha no processamento: ${error.message}`);
  }
}

async function salvarDiscrepanciasSupabase(discrepancias: DiscrepanciaReal[]): Promise<void> {
  console.log('💾 SALVANDO DISCREPÂNCIAS NO SUPABASE');
  
  try {
    // Limpar dados anteriores
    console.log('🗑️ Limpando dados anteriores...');
    const { error: deleteError } = await supabase
      .from('analise_discrepancia')
      .delete()
      .neq('id', 0);
    
    if (deleteError) {
      console.warn('⚠️ Erro ao limpar dados anteriores:', deleteError);
    }
    
    // Inserir novos dados em lotes para evitar timeout
    const TAMANHO_LOTE = 50;
    let inseridos = 0;
    
    for (let i = 0; i < discrepancias.length; i += TAMANHO_LOTE) {
      const lote = discrepancias.slice(i, i + TAMANHO_LOTE);
      
      console.log(`💾 Inserindo lote ${Math.floor(i / TAMANHO_LOTE) + 1}: ${lote.length} registros`);
      
      const { data, error } = await supabase
        .from('analise_discrepancia')
        .insert(lote)
        .select();
      
      if (error) {
        console.error('❌ Erro ao inserir lote:', error);
        throw new Error(`Erro ao salvar dados: ${error.message}`);
      }
      
      inseridos += lote.length;
      console.log(`✅ Lote inserido: ${inseridos}/${discrepancias.length} registros`);
    }
    
    console.log(`💾 SUCESSO: ${inseridos} discrepâncias salvas no Supabase`);
    
  } catch (error) {
    console.error('❌ Erro ao salvar no Supabase:', error);
    throw new Error(`Falha ao salvar no banco: ${error.message}`);
  }
} 