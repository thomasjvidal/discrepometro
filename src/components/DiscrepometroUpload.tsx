import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload as UploadIcon, Table, FileText, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import UploadArea from '@/components/UploadArea';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

const steps = [
  { label: 'Upload do Arquivo', description: 'Enviando arquivo para o servidor' },
  { label: 'Processando Dados', description: 'Analisando conteúdo do arquivo' },
  { label: 'Salvando Resultados', description: 'Armazenando dados no banco' },
  { label: 'Finalizando', description: 'Preparando visualização' }
];

interface DiscrepometroUploadProps {
  onFilesUploaded?: (files: File[]) => void;
}

const DiscrepometroUpload = ({ onFilesUploaded }: DiscrepometroUploadProps) => {
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Limpar qualquer cache quando o componente monta
  useEffect(() => {
    console.log('🔥 DiscrepometroUpload montado - limpando estado');
    setFiles([]);
    setError(null);
    setProgress(0);
    setCurrentStep(0);
    setIsUploading(false);
  }, []);

  const handleFileUpload = (newFiles: File[]) => {
    console.log('🔥 handleFileUpload chamado com:', newFiles.map(f => ({name: f.name, size: f.size, type: f.type})));
    setFiles(newFiles);
    setError(null);
    console.log('🔥 Estado dos arquivos atualizado para:', newFiles.map(f => f.name));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("Selecione pelo menos um arquivo para upload.");
      return;
    }
    // Nova validação: exigir pelo menos um arquivo Excel
    const hasExcel = files.some(f => 
      f.name.endsWith('.xlsx') || 
      f.name.endsWith('.xls') || 
      f.name.endsWith('.xlsb')
    );
    if (!hasExcel) {
      toast.error("É obrigatório enviar pelo menos um arquivo Excel (.xlsx, .xls ou .xlsb).");
      setError("É obrigatório enviar pelo menos um arquivo Excel (.xlsx, .xls ou .xlsb).");
      return;
    }

    setIsUploading(true);
    setProgress(0);
    setCurrentStep(0);
    setError(null);

    const toastId = toast.loading("Iniciando upload...");

    try {
      // Se tem callback, chama ele ao invés de processar no backend
      if (onFilesUploaded) {
        // Simular progresso
        for (let i = 0; i <= 100; i += 25) {
          setProgress(i);
          setCurrentStep(Math.floor(i / 25));
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        toast.success("Arquivos carregados com sucesso!", { id: toastId });
        onFilesUploaded(files);
        setIsUploading(false);
        return;
      }

      // Processo original para quando não tem callback
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('user_id', '1'); // TODO: Pegar do contexto de autenticação
        formData.append('ano', '2024'); // TODO: Permitir seleção do ano

        let endpoint = '';
        if (file.name.endsWith('.pdf')) {
          endpoint = 'process_pdf';
        } else if (file.name.endsWith('.csv')) {
          endpoint = 'upload_csv';
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.xlsb')) {
          endpoint = 'upload_xlsx';
        } else {
          throw new Error(`Formato de arquivo não suportado: ${file.name}`);
        }

        setCurrentStep(0);
        const response = await fetch(`https://hvjjcegcdivumprqviug.functions.supabase.co/${endpoint}`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2ampjZWdjZGl2dW1wcnF2aXVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2Nzg1MDAsImV4cCI6MjA2MzI1NDUwMH0.nerS1VvC5ebHOyHrtTMwrzdpCkAWpRpfvlvdlSspiG4'
        },
      });

      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
      }

        const result = await response.json();
      setProgress(100);
      setCurrentStep(3);

        toast.success(`Arquivo ${file.name} processado com sucesso!`, { id: toastId });
      }

      setTimeout(() => {
        setIsUploading(false);
        navigate('/dashboard');
      }, 1200);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao processar os arquivos.";
      setError(errorMessage);
      toast.error(errorMessage, { id: toastId });
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-4xl mx-auto space-y-8">
        <Card className="glass-effect p-8">
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-semibold text-foreground">Upload de Arquivos</h2>
              <p className="text-dark-400">
                Faça upload dos arquivos para análise
              </p>
            </div>
            <UploadArea 
              onFileUpload={handleFileUpload} 
              isUploading={isUploading}
              progress={progress}
              error={error || undefined}
            />
            {isUploading && (
              <div className="space-y-6 pt-6">
                <Progress value={progress} className="w-full h-3" />
                <div className="flex flex-col gap-2 items-center">
                  {steps.map((step, idx) => (
                    <div key={step.label} className={`flex items-center gap-3 text-base ${currentStep === idx ? 'font-bold text-golden-400' : 'text-dark-400'}`}> 
                      <span className={`inline-block w-3 h-3 rounded-full mr-2 ${currentStep >= idx ? 'bg-golden-400' : 'bg-dark-700'}`}></span>
                      <span>{step.label}</span>
                      <span className="text-xs text-dark-500 ml-2">{step.description}</span>
                    </div>
                  ))}
                </div>
                <div className="text-center text-sm text-dark-400 pt-2">
                  {progress < 100 ? `Processando arquivos... ${progress}%` : 'Análise concluída. Redirecionando para o dashboard...'}
                </div>
              </div>
            )}
            <div className="flex justify-center pt-4">
              <Button
                onClick={handleUpload}
                size="lg"
                className="bg-gradient-to-r from-golden-500 to-golden-600 hover:from-golden-600 hover:to-golden-700 text-dark-900 font-semibold px-8 py-3 rounded-xl transition-all duration-300 hover:scale-105 golden-glow"
                disabled={files.length === 0 || isUploading}
              >
                <UploadIcon className="w-5 h-5 mr-2" />
                Analisar Arquivos
              </Button>
            </div>
            {/* Arquivos Carregados */}
            {files.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Arquivos Carregados</h3>
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-dark-800/50 rounded-lg border border-dark-700">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-golden-500/20 flex items-center justify-center">
                          {(file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.xlsb')) ? (
                            <Table className="w-4 h-4 text-golden-400" />
                          ) : file.name.endsWith('.pdf') ? (
                            <FileText className="w-4 h-4 text-red-400" />
                          ) : (
                            <Database className="w-4 h-4 text-blue-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{file.name}</p>
                          <p className="text-xs text-dark-400">
                            {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type || 'Unknown'}
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-golden-400">
                        {(file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.xlsb')) ? 'Movimentações' : 
                         file.name.endsWith('.pdf') ? 'Inventário' : 'Movimentações'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DiscrepometroUpload; 