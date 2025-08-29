import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { UploadIcon, FileSpreadsheet, FileText, Database, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import UploadArea from './UploadArea';
import { processarArquivosReais } from '../services/realProcessor';

interface DiscrepometroUploadProps {
  onFilesUploaded?: (files: File[]) => void;
}

const DiscrepometroUpload = ({ onFilesUploaded }: DiscrepometroUploadProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const steps = [
    { label: 'Validando arquivos', description: 'Verificando formato e estrutura' },
    { label: 'Processando dados', description: 'Analisando CFOPs e estoques' },
    { label: 'Calculando discrepâncias', description: 'Comparando estoques esperados vs reais' },
    { label: 'Finalizando', description: 'Salvando resultados' }
  ];

  const handleFileUpload = (newFiles: File[]) => {
    setFiles(prev => [...prev, ...newFiles]);
    setError(null);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Selecione pelo menos um arquivo para upload.');
      return;
    }

    setIsUploading(true);
    setProgress(0);
    setCurrentStep(0);
    setError(null);

    const toastId = toast.loading('Iniciando processamento...');

    try {
      console.log('🚀 Iniciando processamento de arquivos...');
      console.log(`📁 Total de arquivos: ${files.length}`);
      files.forEach(file => console.log(`   - ${file.name}`));

      // Processar arquivos localmente
      const resultado = await processarArquivosReais(files, (progressInfo) => {
        console.log(`📊 Progresso: ${progressInfo.etapa} - ${progressInfo.progresso}%`);
        setProgress(progressInfo.progresso);
        
        // Mapear etapas do processamento para steps do UI
        if (progressInfo.etapa.includes('Validando')) {
          setCurrentStep(0);
        } else if (progressInfo.etapa.includes('Lendo')) {
          setCurrentStep(1);
        } else if (progressInfo.etapa.includes('Calculando')) {
          setCurrentStep(2);
        } else if (progressInfo.etapa.includes('Salvando')) {
          setCurrentStep(3);
        }
      });

      if (resultado.success) {
        toast.success(`Processamento concluído! ${resultado.discrepancias.length} discrepâncias encontradas.`, { id: toastId });
        console.log(`✅ Processamento concluído: ${resultado.discrepancias.length} discrepâncias`);
      } else {
        throw new Error(resultado.message);
      }

      setTimeout(() => {
        setIsUploading(false);
        navigate('/dashboard');
      }, 1200);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao processar os arquivos.";
      console.error('❌ Erro no processamento:', error);
      setError(errorMessage);
      toast.error(errorMessage, { id: toastId });
      setIsUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
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
                            <FileSpreadsheet className="w-4 h-4 text-golden-400" />
                          ) : file.name.endsWith('.pdf') ? (
                            <FileText className="w-4 h-4 text-red-400" />
                          ) : (
                            <Database className="w-4 h-4 text-blue-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{file.name}</p>
                          <p className="text-xs text-dark-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="text-dark-400 hover:text-red-400"
                        disabled={isUploading}
                      >
                        <X className="w-4 h-4" />
                      </Button>
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
export default DiscrepometroUpload; 