import React from 'react';

interface LoadingAnalysisProps {
  etapa: string;
  progresso: number;
  mensagem: string;
  detalhes?: string;
}

export default function LoadingAnalysis({ etapa, progresso, mensagem, detalhes }: LoadingAnalysisProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-6">
      <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full shadow-2xl">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
          </div>
          
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Processando Análise</h2>
            <p className="text-gray-300 text-sm">{mensagem}</p>
            {detalhes && (
              <p className="text-gray-400 text-xs mt-1">{detalhes}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-300">
              <span>{etapa}</span>
              <span>{progresso}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progresso}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
