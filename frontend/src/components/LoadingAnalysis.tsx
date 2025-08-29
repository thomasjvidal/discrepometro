
import { useState, useEffect } from 'react';
import { Sparkles, Database, FileText, CheckCircle, FileSpreadsheet, Calculator } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface LoadingAnalysisProps {
  etapa: string;
  progresso: number;
  mensagem: string;
  detalhes?: string;
  subProgresso?: {
    pdf1?: {
      paginaAtual: number;
      totalPaginas: number;
      linhasProcessadas: number;
      produtosEncontrados: number;
    };
    pdf2?: {
      paginaAtual: number;
      totalPaginas: number;
      linhasProcessadas: number;
      produtosEncontrados: number;
    };
    excel1?: {
      planilhaAtual: number;
      totalPlanilhas: number;
      linhasProcessadas: number;
      movimentacoesEncontradas: number;
    };
    excel2?: {
      planilhaAtual: number;
      totalPlanilhas: number;
      linhasProcessadas: number;
      movimentacoesEncontradas: number;
    };
  };
}

const LoadingAnalysis = ({ etapa, progresso, mensagem, detalhes, subProgresso }: LoadingAnalysisProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  // Mapear etapas para steps
  const getStepFromEtapa = (etapa: string) => {
    if (etapa.includes('PDF')) return 0;
    if (etapa.includes('Excel')) return 1;
    if (etapa.includes('Calculando')) return 2;
    if (etapa.includes('Salvando') || etapa.includes('Concluído')) return 3;
    return 0;
  };

  useEffect(() => {
    setCurrentStep(getStepFromEtapa(etapa));
  }, [etapa]);

  const steps = [
    { 
      label: 'Lendo PDFs', 
      description: 'Extraindo dados dos inventários físico e contábil', 
      icon: FileText 
    },
    { 
      label: 'Processando Excel', 
      description: 'Lendo movimentações fiscais e CFOPs', 
      icon: FileSpreadsheet 
    },
    { 
      label: 'Calculando Discrepâncias', 
      description: 'Cruzando dados e identificando diferenças', 
      icon: Calculator 
    },
    { 
      label: 'Finalizando', 
      description: 'Salvando resultados no banco de dados', 
      icon: CheckCircle 
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-2xl mx-auto">
        <Card className="glass-effect p-8 text-center">
          <div className="space-y-8">
            {/* Header */}
            <div className="space-y-4">
              <div className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-golden-400 to-golden-600 flex items-center justify-center animate-pulse-golden">
                <Sparkles className="w-10 h-10 text-dark-900" />
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-golden-400 to-golden-600 bg-clip-text text-transparent">
                {etapa}
              </h2>
              <p className="text-dark-400">
                {mensagem}
              </p>
              {detalhes && (
                <p className="text-sm text-dark-500">
                  {detalhes}
                </p>
              )}
            </div>

            {/* Progress */}
            <div className="space-y-4">
              <Progress value={progresso} className="h-3 bg-dark-800" />
              <div className="text-2xl font-bold text-golden-400">
                {progresso}%
              </div>
            </div>

            {/* Sub Progress Details */}
            {subProgresso && (
              <div className="space-y-3 text-left">
                {subProgresso.pdf1 && (
                  <div className="bg-dark-800/30 p-3 rounded-lg">
                    <div className="text-sm font-medium text-golden-400">PDF Físico</div>
                    <div className="text-xs text-dark-400">
                      Página {subProgresso.pdf1.paginaAtual}/{subProgresso.pdf1.totalPaginas} • 
                      {subProgresso.pdf1.produtosEncontrados} produtos encontrados
                    </div>
                  </div>
                )}
                {subProgresso.pdf2 && (
                  <div className="bg-dark-800/30 p-3 rounded-lg">
                    <div className="text-sm font-medium text-golden-400">PDF Contábil</div>
                    <div className="text-xs text-dark-400">
                      Página {subProgresso.pdf2.paginaAtual}/{subProgresso.pdf2.totalPaginas} • 
                      {subProgresso.pdf2.produtosEncontrados} produtos encontrados
                    </div>
                  </div>
                )}
                {subProgresso.excel1 && (
                  <div className="bg-dark-800/30 p-3 rounded-lg">
                    <div className="text-sm font-medium text-golden-400">Excel 1</div>
                    <div className="text-xs text-dark-400">
                      Planilha {subProgresso.excel1.planilhaAtual}/{subProgresso.excel1.totalPlanilhas} • 
                      {subProgresso.excel1.movimentacoesEncontradas} movimentações encontradas
                    </div>
                  </div>
                )}
                {subProgresso.excel2 && (
                  <div className="bg-dark-800/30 p-3 rounded-lg">
                    <div className="text-sm font-medium text-golden-400">Excel 2</div>
                    <div className="text-xs text-dark-400">
                      Planilha {subProgresso.excel2.planilhaAtual}/{subProgresso.excel2.totalPlanilhas} • 
                      {subProgresso.excel2.movimentacoesEncontradas} movimentações encontradas
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Steps */}
            <div className="space-y-4">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
                
                return (
                  <div
                    key={index}
                    className={`
                      flex items-center gap-4 p-4 rounded-xl transition-all duration-500
                      ${isActive 
                        ? 'bg-golden-500/20 border border-golden-500/30' 
                        : isCompleted 
                        ? 'bg-green-500/10 border border-green-500/20' 
                        : 'bg-dark-800/30 border border-dark-700/50'
                      }
                    `}
                  >
                    <div className={`
                      w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500
                      ${isActive 
                        ? 'bg-golden-500 text-dark-900 golden-glow' 
                        : isCompleted 
                        ? 'bg-green-500 text-white' 
                        : 'bg-dark-700 text-dark-400'
                      }
                    `}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <h3 className={`
                        font-semibold transition-colors duration-500
                        ${isActive || isCompleted ? 'text-foreground' : 'text-dark-500'}
                      `}>
                        {step.label}
                      </h3>
                      <p className={`
                        text-sm transition-colors duration-500
                        ${isActive || isCompleted ? 'text-dark-400' : 'text-dark-600'}
                      `}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LoadingAnalysis;
