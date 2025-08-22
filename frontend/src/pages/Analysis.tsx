import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Sparkles, 
  FileText, 
  FileSpreadsheet, 
  Calculator, 
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  Database,
  TrendingUp,
  Shield
} from 'lucide-react';
import { processarArquivosReais, ProcessamentoProgress } from '@/services/realProcessor';

interface AnalysisProps {
  etapa?: string;
  progresso?: number;
  mensagem?: string;
  detalhes?: string;
}

interface ProcessamentoEtapa {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  details?: string;
}

const Analysis = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [etapa, setEtapa] = useState('Iniciando Análise');
  const [mensagem, setMensagem] = useState('Preparando arquivos...');
  const [detalhes, setDetalhes] = useState('');
  const [progresso, setProgresso] = useState(0);
  const [tempoDecorrido, setTempoDecorrido] = useState(0);
  const [etapas, setEtapas] = useState<ProcessamentoEtapa[]>([
    {
      id: 'validacao',
      label: 'Validação de Arquivos',
      description: 'Verificando formato e conteúdo',
      icon: Shield,
      status: 'pending',
      progress: 0
    },
    {
      id: 'excel',
      label: 'Processamento Excel',
      description: 'Lendo movimentações fiscais',
      icon: FileSpreadsheet,
      status: 'pending',
      progress: 0
    },
    {
      id: 'pdf-inicial',
      label: 'PDF Inicial',
      description: 'Extraindo estoque inicial',
      icon: FileText,
      status: 'pending',
      progress: 0
    },
    {
      id: 'pdf-final',
      label: 'PDF Final',
      description: 'Extraindo estoque final',
      icon: FileText,
      status: 'pending',
      progress: 0
    },
    {
      id: 'calculo',
      label: 'Cálculo Discrepâncias',
      description: 'Analisando diferenças',
      icon: Calculator,
      status: 'pending',
      progress: 0
    },
    {
      id: 'salvamento',
      label: 'Salvamento',
      description: 'Armazenando resultados',
      icon: Database,
      status: 'pending',
      progress: 0
    }
  ]);

  useEffect(() => {
    if (!location.state?.files) {
      toast({
        title: "Erro de navegação",
        description: "Nenhum arquivo encontrado. Volte para a página de upload.",
        variant: "destructive"
      });
      setTimeout(() => navigate('/'), 2000);
      return;
    }

    const processarArquivos = async () => {
      setIsProcessing(true);
      const inicio = Date.now();
      
      // Timer para mostrar tempo decorrido
      const timerInterval = setInterval(() => {
        setTempoDecorrido(Math.floor((Date.now() - inicio) / 1000));
      }, 1000);

      // Timeout de segurança (10 minutos)
      const timeoutId = setTimeout(() => {
        clearInterval(timerInterval);
        setEtapa('Timeout de Segurança');
        setMensagem('Processamento demorou mais de 10 minutos');
        setDetalhes('Verifique se os arquivos não são muito grandes');
        setIsProcessing(false);
        
        toast({
          title: "Timeout de segurança",
          description: "Processamento cancelado por segurança",
          variant: "destructive"
        });
      }, 10 * 60 * 1000);

      try {
        const files = location.state.files;
        const todosArquivos = [
          ...(files.pdfs || []),
          ...(files.excels || []),
          ...(files.csvs || [])
        ];

        console.log('🚀 INICIANDO PROCESSAMENTO REAL...');
        console.log('📁 Arquivos recebidos:', todosArquivos.map(f => f.name));

        // Atualizar etapa de validação
        setEtapas(prev => prev.map(e => 
          e.id === 'validacao' ? { ...e, status: 'processing', progress: 10 } : e
        ));

        // Processar arquivos reais com progresso granular
        const resultado = await processarArquivosReais(todosArquivos, (progress: ProcessamentoProgress) => {
          setEtapa(progress.etapa);
          setMensagem(progress.mensagem);
          setDetalhes(progress.detalhes || '');
          setProgresso(progress.progresso);
          
          // Atualizar etapas baseado no progresso
          const etapasAtualizadas = [...etapas];
          
          if (progress.progresso < 15) {
            // Validação
            etapasAtualizadas[0] = { ...etapasAtualizadas[0], status: 'processing', progress: progress.progresso * 6.67 };
          } else if (progress.progresso < 35) {
            // Excel
            etapasAtualizadas[0] = { ...etapasAtualizadas[0], status: 'completed', progress: 100 };
            etapasAtualizadas[1] = { ...etapasAtualizadas[1], status: 'processing', progress: (progress.progresso - 15) * 5 };
          } else if (progress.progresso < 55) {
            // PDF Inicial
            etapasAtualizadas[1] = { ...etapasAtualizadas[1], status: 'completed', progress: 100 };
            etapasAtualizadas[2] = { ...etapasAtualizadas[2], status: 'processing', progress: (progress.progresso - 35) * 5 };
          } else if (progress.progresso < 75) {
            // PDF Final
            etapasAtualizadas[2] = { ...etapasAtualizadas[2], status: 'completed', progress: 100 };
            etapasAtualizadas[3] = { ...etapasAtualizadas[3], status: 'processing', progress: (progress.progresso - 55) * 5 };
          } else if (progress.progresso < 90) {
            // Cálculo
            etapasAtualizadas[3] = { ...etapasAtualizadas[3], status: 'completed', progress: 100 };
            etapasAtualizadas[4] = { ...etapasAtualizadas[4], status: 'processing', progress: (progress.progresso - 75) * 6.67 };
          } else {
            // Salvamento
            etapasAtualizadas[4] = { ...etapasAtualizadas[4], status: 'completed', progress: 100 };
            etapasAtualizadas[5] = { ...etapasAtualizadas[5], status: 'processing', progress: (progress.progresso - 90) * 10 };
          }
          
          setEtapas(etapasAtualizadas);
        });

        // Limpar timeout se chegou até aqui
        clearTimeout(timeoutId);
        clearInterval(timerInterval);

        if (resultado.success) {
          // Marcar todas as etapas como completadas
          setEtapas(prev => prev.map(e => ({ ...e, status: 'completed', progress: 100 })));
          
          setEtapa('Análise Concluída!');
          setMensagem(`Processamento finalizado: ${resultado.totalProcessados} produtos analisados`);
          setProgresso(100);
          
          toast({
            title: "Análise concluída com sucesso!",
            description: `${resultado.totalProcessados} produtos processados em ${Math.round(resultado.tempoProcessamento / 1000)}s`,
          });

          // Redirecionar para dashboard após sucesso
          setTimeout(() => {
            navigate('/dashboard');
          }, 3000);
        } else {
          throw new Error(resultado.message);
        }
      } catch (error) {
        // Limpar timeout em caso de erro
        clearTimeout(timeoutId);
        clearInterval(timerInterval);
        
        console.error('❌ Erro no processamento:', error);
        
        // Marcar etapa atual como erro
        const etapaAtual = etapas.find(e => e.status === 'processing');
        if (etapaAtual) {
          setEtapas(prev => prev.map(e => 
            e.id === etapaAtual.id ? { ...e, status: 'error', progress: 0 } : e
          ));
        }
        
        setEtapa('Erro no Processamento');
        setMensagem('Ocorreu um erro durante a análise');
        setDetalhes(error instanceof Error ? error.message : 'Erro desconhecido');
        
        toast({
          title: "Erro no processamento",
          description: error instanceof Error ? error.message : "Erro desconhecido",
          variant: "destructive"
        });
      } finally {
        setIsProcessing(false);
      }
    };

    processarArquivos();
  }, [navigate, location.state, toast]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'processing':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-4xl mx-auto">
        <Card className="glass-effect p-8">
          <div className="space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-golden-400 to-golden-600 flex items-center justify-center animate-pulse-golden">
                <Sparkles className="w-10 h-10 text-dark-900" />
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-golden-400 to-golden-600 bg-clip-text text-transparent">
                {etapa}
              </h2>
              <p className="text-dark-400 text-lg">
                {mensagem}
              </p>
              {detalhes && (
                <p className="text-sm text-dark-500 bg-dark-800/50 p-3 rounded-lg">
                  {detalhes}
                </p>
              )}
            </div>

            {/* Progress Bar Principal */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-dark-300">Progresso Geral</span>
                <span className="text-sm text-dark-400">{Math.round(progresso)}%</span>
              </div>
              <Progress value={progresso} className="h-3" />
              {tempoDecorrido > 0 && (
                <p className="text-xs text-dark-500 text-center">
                  Tempo decorrido: {Math.floor(tempoDecorrido / 60)}:{(tempoDecorrido % 60).toString().padStart(2, '0')}
                </p>
              )}
            </div>

            {/* Etapas Detalhadas */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Etapas do Processamento</h3>
              <div className="grid gap-4">
                {etapas.map((etapa) => (
                  <div key={etapa.id} className="flex items-center space-x-4 p-4 rounded-lg border border-dark-700">
                    <div className="flex-shrink-0">
                      {getStatusIcon(etapa.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">{etapa.label}</p>
                          <p className="text-xs text-dark-400">{etapa.description}</p>
                        </div>
                        <Badge className={getStatusColor(etapa.status)}>
                          {etapa.status === 'completed' && 'Concluído'}
                          {etapa.status === 'processing' && 'Processando'}
                          {etapa.status === 'error' && 'Erro'}
                          {etapa.status === 'pending' && 'Pendente'}
                        </Badge>
                      </div>
                      {etapa.status === 'processing' && (
                        <Progress value={etapa.progress} className="h-2 mt-2" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ações */}
            <div className="flex justify-center space-x-4">
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                disabled={isProcessing}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar ao Upload
              </Button>
              
              {!isProcessing && (
                <Button
                  onClick={() => window.location.reload()}
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Tentar Novamente
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Analysis; 