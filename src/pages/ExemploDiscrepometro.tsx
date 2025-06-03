import React from 'react';
import DiscrepometroVisual from '@/components/DiscrepometroVisual';

/**
 * Página de exemplo demonstrando o uso do componente DiscrepometroVisual
 * com tipagem correta e sem erros de TypeScript
 */
export default function ExemploDiscrepometro() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Discrepômetro Visual
          </h1>
          <p className="text-gray-600 text-lg">
            Componente com tipagem TypeScript correta para análise de discrepâncias
          </p>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">✅ Correções Aplicadas:</h3>
            <ul className="text-blue-800 space-y-1 text-sm">
              <li>• <strong>Tipagem Discrepancia</strong>: Tipo bem definido com campos obrigatórios e opcionais</li>
              <li>• <strong>Hook useAnaliseDiscrepancia</strong>: Totalmente tipado com interface de retorno</li>
              <li>• <strong>Verificação de tipos</strong>: Usa <code>typeof</code> antes de <code>.toLowerCase()</code></li>
              <li>• <strong>Suporte a .includes()</strong>: Funciona corretamente em <code>item.produto</code></li>
              <li>• <strong>ReactNode seguro</strong>: Todos os elementos são tipados corretamente</li>
              <li>• <strong>Build passa</strong>: Sem erros de TypeScript na compilação</li>
            </ul>
          </div>
        </div>

        <DiscrepometroVisual />
      </div>
    </div>
  );
} 