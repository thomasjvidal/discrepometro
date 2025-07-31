
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload as UploadIcon, FileText, Database, Sparkles, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import UploadArea from '@/components/UploadArea';
import FilePreview from '@/components/FilePreview';
import LoadingAnalysis from '@/components/LoadingAnalysis';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

interface UploadedFile {
  file: File;
  type: 'csv' | 'pdf' | 'excel';
  preview?: string;
}

const Upload = () => {
  const navigate = useNavigate();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const uploadCsvToSupabase = async (file: File) => {
    setIsUploading(true);
    
    try {
      console.log('📤 Iniciando processamento do CSV:', file.name);
      
      // Processar CSV real usando a biblioteca xlsx
      const text = await file.text();
      const lines = text.split('\n');
      
      if (lines.length < 2) {
        throw new Error('Arquivo CSV muito pequeno ou vazio');
      }
      
      // Validar se tem cabeçalho válido
      const header = lines[0].toLowerCase();
      const hasRequiredColumns = header.includes('cfop') && 
                                (header.includes('código') || header.includes('codigo') || header.includes('produto')) &&
                                (header.includes('quantidade') || header.includes('qtde') || header.includes('qtd'));
      
      if (!hasRequiredColumns) {
        throw new Error('CSV não possui colunas obrigatórias (CFOP, Código, Quantidade)');
      }
      
      console.log(`✅ CSV válido: ${lines.length - 1} linhas de dados encontradas`);
      
      toast({
        title: "CSV processado com sucesso",
        description: `${lines.length - 1} linhas de dados processadas.`,
      });

      return { success: true, filename: file.name, rowCount: lines.length - 1 };
    } catch (error) {
      console.error('❌ Erro no processamento do CSV:', error);
      toast({
        title: "Erro no processamento do CSV",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const uploadExcelToSupabase = async (file: File) => {
    setIsUploading(true);
    
    try {
      console.log('📤 Iniciando processamento do Excel:', file.name);
      
      // Processar Excel real usando a biblioteca xlsx
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      
      if (workbook.SheetNames.length === 0) {
        throw new Error('Arquivo Excel não possui planilhas');
      }
      
      let totalRows = 0;
      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        totalRows += jsonData.length - 1; // -1 para excluir cabeçalho
      }
      
      console.log(`✅ Excel processado: ${workbook.SheetNames.length} planilhas, ${totalRows} linhas de dados`);
      
      toast({
        title: "Excel processado com sucesso",
        description: `${workbook.SheetNames.length} planilhas com ${totalRows} linhas processadas.`,
      });

      return { success: true, filename: file.name, sheetCount: workbook.SheetNames.length, rowCount: totalRows };
    } catch (error) {
      console.error('❌ Erro no processamento do Excel:', error);
      toast({
        title: "Erro no processamento do Excel",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (files: File[]) => {
    const newFiles: UploadedFile[] = files.map(file => {
      let type: 'csv' | 'pdf' | 'excel';
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        type = 'csv';
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.xlsb')) {
        type = 'excel';
      } else {
        type = 'pdf';
      }
      return { file, type };
    });
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
    
    // Processar arquivos CSV e Excel automaticamente
    for (const fileData of newFiles) {
      if (fileData.type === 'csv') {
        try {
          await uploadCsvToSupabase(fileData.file);
        } catch (error) {
          // Erro já tratado na função uploadCsvToSupabase
        }
      } else if (fileData.type === 'excel') {
        try {
          await uploadExcelToSupabase(fileData.file);
        } catch (error) {
          // Erro já tratado na função uploadExcelToSupabase
        }
      }
    }
    
    toast({
      title: "Arquivos carregados",
      description: `${files.length} arquivo(s) adicionado(s) com sucesso.`,
    });
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    if (uploadedFiles.length === 0) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Por favor, faça upload dos arquivos antes de analisar.",
        variant: "destructive"
      });
      return;
    }

    // Separar arquivos por tipo
    const pdfs = uploadedFiles.filter(f => f.type === 'pdf').map(f => f.file);
    const excels = uploadedFiles.filter(f => f.type === 'excel').map(f => f.file);
    const csvs = uploadedFiles.filter(f => f.type === 'csv').map(f => f.file);

    // Verificar se temos os arquivos necessários
    if (pdfs.length < 2) {
      toast({
        title: "PDFs insuficientes",
        description: "São necessários pelo menos 2 PDFs de inventário (físico e contábil).",
        variant: "destructive"
      });
      return;
    }

    if (excels.length === 0 && csvs.length === 0) {
      toast({
        title: "Arquivo de movimentação necessário",
        description: "É necessário pelo menos um arquivo Excel ou CSV com movimentações.",
        variant: "destructive"
      });
      return;
    }

    console.log('📁 Arquivos para análise:', {
      pdfs: pdfs.map(f => f.name),
      excels: excels.map(f => f.name),
      csvs: csvs.map(f => f.name)
    });

    // Passar arquivos para a página de análise via state
    navigate('/analise', { 
      state: { 
        files: {
          pdfs,
          excels,
          csvs
        }
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-golden-400 to-golden-600 shadow-lg">
              <Sparkles className="w-8 h-8 text-dark-900" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-golden-400 to-golden-600 bg-clip-text text-transparent">
              Discrepômetro
            </h1>
          </div>
          <p className="text-xl text-dark-300 max-w-2xl mx-auto">
            Sistema inteligente de análise fiscal para detecção de discrepâncias
          </p>
        </div>

        {/* Upload Section */}
        <Card className="glass-effect p-8">
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-semibold text-foreground">Upload Inteligente</h2>
              <p className="text-dark-400">
                Faça upload de CSV/Excel com movimentações e PDFs de inventário
              </p>
            </div>

            {/* File Requirements */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="neomorphism p-4 border-dark-700/50">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-golden-500/20">
                    <Database className="w-5 h-5 text-golden-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Arquivo CSV</h3>
                    <p className="text-sm text-dark-400 mt-1">
                      Movimentações com CFOP, produtos, quantidades e valores
                    </p>
                    <div className="text-xs text-dark-500 mt-2">
                      Até 2 milhões de linhas
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="neomorphism p-4 border-dark-700/50">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-golden-500/20">
                    <FileSpreadsheet className="w-5 h-5 text-golden-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Arquivo Excel</h3>
                    <p className="text-sm text-dark-400 mt-1">
                      Planilhas com movimentações fiscais (.xlsx, .xls, .xlsb)
                    </p>
                    <div className="text-xs text-dark-500 mt-2">
                      Suporte completo
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="neomorphism p-4 border-dark-700/50">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-golden-500/20">
                    <FileText className="w-5 h-5 text-golden-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">PDFs de Inventário</h3>
                    <p className="text-sm text-dark-400 mt-1">
                      2 inventários de anos distintos para comparação
                    </p>
                    <div className="text-xs text-dark-500 mt-2">
                      Formato PDF padrão
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Upload Area */}
            <UploadArea onFileUpload={handleFileUpload} />

            {/* Upload Status */}
            {isUploading && (
              <div className="text-center p-4 bg-golden-500/10 rounded-xl border border-golden-500/20">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-golden-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-golden-400">Processando CSV...</span>
                </div>
              </div>
            )}

            {/* File Preview */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground">Arquivos Carregados</h3>
                <div className="grid gap-3">
                  {uploadedFiles.map((file, index) => (
                    <FilePreview
                      key={index}
                      file={file}
                      onRemove={() => removeFile(index)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Analyze Button */}
            <div className="flex justify-center pt-4">
              <Button
                onClick={handleAnalyze}
                size="lg"
                className="bg-gradient-to-r from-golden-500 to-golden-600 hover:from-golden-600 hover:to-golden-700 text-dark-900 font-semibold px-8 py-3 rounded-xl transition-all duration-300 hover:scale-105 golden-glow"
                disabled={uploadedFiles.length === 0 || isUploading}
              >
                <UploadIcon className="w-5 h-5 mr-2" />
                Analisar Arquivos
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Upload;
