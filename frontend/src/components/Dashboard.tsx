import React from 'react';
import { useAnaliseDiscrepancia } from '../hooks/useAnaliseDiscrepancia';

export default function Dashboard() {
  const { discrepancias, loading, error, refetch } = useAnaliseDiscrepancia();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando análise de discrepâncias...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Erro ao carregar dados</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={refetch}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (discrepancias.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Nenhuma análise encontrada</h2>
          <p className="text-gray-600">
            Faça upload dos arquivos para iniciar uma nova análise de discrepâncias.
          </p>
        </div>
      </div>
    );
  }

  // Calcular estatísticas
  const totalProdutos = discrepancias.length;
  const produtosComErro = discrepancias.filter(d => d.discrepancia_tipo !== 'Sem Discrepância').length;
  const produtosOK = totalProdutos - produtosComErro;
  const percentualErro = totalProdutos > 0 ? (produtosComErro / totalProdutos) * 100 : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">📊 Dashboard de Discrepâncias</h1>
        
        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="text-2xl mr-3">📦</div>
              <div>
                <p className="text-sm text-gray-600">Total de Produtos</p>
                <p className="text-2xl font-bold text-gray-800">{totalProdutos}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="text-2xl mr-3">✅</div>
              <div>
                <p className="text-sm text-gray-600">Produtos OK</p>
                <p className="text-2xl font-bold text-green-600">{produtosOK}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-red-50 p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="text-2xl mr-3">⚠️</div>
              <div>
                <p className="text-sm text-gray-600">Com Discrepância</p>
                <p className="text-2xl font-bold text-red-600">{produtosComErro}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="text-2xl mr-3">📈</div>
              <div>
                <p className="text-sm text-gray-600">Taxa de Erro</p>
                <p className="text-2xl font-bold text-blue-600">{percentualErro.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de discrepâncias */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Análise Detalhada</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estoque Inicial
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendido
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estoque Final
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Esperado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Diferença
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {discrepancias.map((discrepancia, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {discrepancia.produto}
                    </div>
                    <div className="text-sm text-gray-500">
                      Código: {discrepancia.codigo}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {discrepancia.est_inicial}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {discrepancia.saidas}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {discrepancia.est_final}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {discrepancia.est_calculado}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      discrepancia.discrepancia_valor > 1 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {discrepancia.discrepancia_valor > 0 ? `±${discrepancia.discrepancia_valor}` : '0'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      discrepancia.discrepancia_tipo === 'Sem Discrepância'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {discrepancia.discrepancia_tipo === 'Sem Discrepância' ? 'OK' : 'ERRO'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Botão para atualizar */}
      <div className="mt-6 text-center">
        <button
          onClick={refetch}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
        >
          🔄 Atualizar Dados
        </button>
      </div>
    </div>
  );
} 