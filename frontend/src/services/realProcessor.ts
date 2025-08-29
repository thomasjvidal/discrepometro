import { processarArquivosPython } from './pythonProcessor';

export interface ProcessamentoProgress {
  etapa: string;
  mensagem: string;
  detalhes?: string;
  progresso: number;
}

export interface ProcessamentoResultado {
  success: boolean;
  message?: string;
  totalProcessados?: number;
  tempoProcessamento?: number;
}

// Função para enviar arquivos para o backend Python
async function enviarParaBackendPython(files: File[], onProgress?: (progress: ProcessamentoProgress) => void): Promise<ProcessamentoResultado> {
  try {
    console.log('🐍 Enviando arquivos para backend Python...');
    
    // Separar arquivos por tipo
    const excel = files.find(f => f.name.toLowerCase().includes('.xls') || f.name.toLowerCase().includes('.csv'));
    const pdfs = files.filter(f => f.name.toLowerCase().includes('.pdf'));
    
    if (!excel || pdfs.length < 2) {
      throw new Error('São necessários: 1 Excel + 2 PDFs');
    }
    
    // Ordenar PDFs por nome (assumindo que contém ano)
    const pdfInicial = pdfs.find(f => f.name.toLowerCase().includes('2023') || f.name.toLowerCase().includes('inicial'));
    const pdfFinal = pdfs.find(f => f.name.toLowerCase().includes('2024') || f.name.toLowerCase().includes('final'));
    
    if (!pdfInicial || !pdfFinal) {
      throw new Error('PDFs devem conter "2023/inicial" e "2024/final" no nome');
    }
    
    console.log('📁 Arquivos preparados:', {
      excel: excel.name,
      pdfInicial: pdfInicial.name,
      pdfFinal: pdfFinal.name
    });
    
    // Atualizar progresso
    if (onProgress) {
      onProgress({
        etapa: 'Enviando para Backend Python',
        mensagem: 'Conectando com servidor Python...',
        progresso: 10
      });
    }
    
    // Enviar para backend Python usando o serviço existente
    const resultado = await processarArquivosPython(
      [excel, pdfInicial, pdfFinal], 
      10, // max_produtos
      1.0 // tolerancia
    );
    
    if (resultado.success && resultado.data) {
      // Salvar resultados no localStorage
      localStorage.setItem('analise_discrepancia', JSON.stringify(resultado.data.resultados));
      
      console.log('✅ Análise concluída pelo backend Python:', resultado);
      
      return {
        success: true,
        totalProcessados: resultado.data.metadata.total_produtos,
        tempoProcessamento: Date.now() // Simplificado por enquanto
      };
    } else {
      throw new Error(resultado.message || 'Erro desconhecido do backend Python');
    }
    
  } catch (error) {
    console.error('❌ Erro ao enviar para backend Python:', error);
    throw error;
  }
}

// Função principal de processamento
export async function processarArquivosReais(
  files: File[],
  onProgress?: (progress: ProcessamentoProgress) => void
): Promise<ProcessamentoResultado> {
  console.log('🚀 INICIANDO PROCESSAMENTO REAL COM PYTHON...');
  console.log('📁 Arquivos recebidos:', files);
  
  try {
    // Atualizar progresso inicial
    if (onProgress) {
      onProgress({
        etapa: 'Iniciando Análise',
        mensagem: 'Preparando arquivos...',
        progresso: 5
      });
    }
    
    // Enviar para backend Python
    const resultado = await enviarParaBackendPython(files, onProgress);
    
    return resultado;
    
  } catch (error) {
    console.error('❌ Erro no processamento real:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
} 