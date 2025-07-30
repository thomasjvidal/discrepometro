
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload as UploadIcon, FileText, Database, Sparkles, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import UploadArea from '@/components/UploadArea';
import FilePreview from '@/components/FilePreview';
import LoadingAnalysis from '@/components/LoadingAnalysis';
import { toast } from '@/hooks/use-toast';

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
      const formData = new FormData();
      formData.append('file', file);
      formData.append('user_id', crypto.randomUUID());

      const response = await fetch('https://hvjjcegcdivumprqviug.functions.supabase.co/upload_csv', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2ampjZWdjZGl2dW1wcnF2aXVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2Nzg1MDAsImV4cCI6MjA2MzI1NDUwMH0.nerS1VvC5ebHOyHrtTMwrzdpCkAWpRpfvlvdlSspiG4'
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      
      toast({
        title: "CSV processado com sucesso",
        description: `Arquivo ${file.name} foi enviado e processado.`,
      });

      console.log('CSV upload result:', result);
      return result;
    } catch (error) {
      console.error('Erro no upload do CSV:', error);
      toast({
        title: "Erro no upload do CSV",
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
      const formData = new FormData();
      formData.append('file', file);
      formData.append('user_id', crypto.randomUUID());

      const response = await fetch('https://hvjjcegcdivumprqviug.functions.supabase.co/upload_xlsx', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2ampjZWdjZGl2dW1wcnF2aXVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2Nzg1MDAsImV4cCI6MjA2MzI1NDUwMH0.nerS1VvC5ebHOyHrtTMwrzdpCkAWpRpfvlvdlSspiG4'
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      
      toast({
        title: "Excel processado com sucesso",
        description: `Arquivo ${file.name} foi enviado e processado.`,
      });

      console.log('Excel upload result:', result);
      return result;
    } catch (error) {
      console.error('Erro no upload do Excel:', error);
      toast({
        title: "Erro no upload do Excel",
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

    // Redirecionar para a página de análise
    navigate('/analise');
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
