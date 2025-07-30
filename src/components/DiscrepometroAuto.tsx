import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, XCircle, TrendingUp, BarChart3 } from 'lucide-react';

interface Discrepancia {
  produto: string;
  codigo: string;
  quantidade_vendida: number;
  quantidade_comprada: number;
  estoque_inicial: number;
  estoque_final: number;
  discrepancia: number;
  status: 'CRÍTICO' | 'ALERTA' | 'OK';
  valor_total_vendido: number;
  cfops_utilizados: string[];
}

interface Produto {
  nome: string;
  codigo: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  cfop: string;
  cfops_utilizados?: string[];
}

interface RelatorioFinal {
  timestamp: string;
  estatisticas: {
    total_produtos: number;
    criticos: number;
    alertas: number;
    ok: number;
    percentual_critico: number;
  };
  top10_produtos: Produto[];
  discrepancias: Discrepancia[];
}

interface DiscrepometroAutoProps {
  resultado?: RelatorioFinal;
  loading?: boolean;
  error?: string;
}

const DiscrepometroAuto = ({ resultado, loading, error }: DiscrepometroAutoProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'TODOS' | 'CRÍTICO' | 'ALERTA' | 'OK'>('TODOS');

  if (loading) {
    return (
      <Card className="p-8 bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-lg">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-gray-600 font-medium">Processando arquivos automaticamente...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8 bg-white/80 backdrop-blur-sm border border-red-200/50 shadow-lg">
        <div className="text-center space-y-4">
          <XCircle className="w-12 h-12 text-red-500 mx-auto" />
          <div className="text-red-600 text-lg font-semibold">Erro no processamento</div>
          <div className="text-gray-500">{error}</div>
        </div>
      </Card>
    );
  }

  if (!resultado) {
    return (
      <Card className="p-8 bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-lg">
        <div className="text-center space-y-4">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto" />
          <div className="text-gray-600 text-lg font-semibold">Aguardando processamento</div>
          <div className="text-gray-500">Os resultados aparecerão aqui após o processamento automático</div>
        </div>
      </Card>
    );
  }

  // Filtrar discrepâncias
  const discrepanciasFiltradas = resultado.discrepancias.filter(d => {
    const matchSearch = d.produto.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'TODOS' || d.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CRÍTICO':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'ALERTA':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'OK':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CRÍTICO':
        return <Badge variant="destructive">CRÍTICO</Badge>;
      case 'ALERTA':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">ALERTA</Badge>;
      case 'OK':
        return <Badge variant="default" className="bg-green-100 text-green-800">OK</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <Card className="p-6 bg-white/90 backdrop-blur-md border border-gray-200/50 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{resultado.estatisticas.total_produtos}</div>
            <div className="text-sm text-gray-600">Total de Produtos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{resultado.estatisticas.criticos}</div>
            <div className="text-sm text-gray-600">Críticos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{resultado.estatisticas.alertas}</div>
            <div className="text-sm text-gray-600">Alertas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{resultado.estatisticas.ok}</div>
            <div className="text-sm text-gray-600">OK</div>
          </div>
        </div>
        <div className="mt-4 text-center">
          <div className="text-sm text-gray-600">
            Percentual Crítico: <span className="font-semibold">{resultado.estatisticas.percentual_critico}%</span>
          </div>
        </div>
      </Card>

      {/* Top 10 Produtos */}
      <Card className="p-6 bg-white/90 backdrop-blur-md border border-gray-200/50 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2" />
          Top 10 Produtos Mais Vendidos
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left p-3 font-semibold text-gray-700">Produto</th>
                <th className="text-left p-3 font-semibold text-gray-700">Código</th>
                <th className="text-right p-3 font-semibold text-gray-700">Quantidade</th>
                <th className="text-right p-3 font-semibold text-gray-700">Valor Total</th>
                <th className="text-left p-3 font-semibold text-gray-700">CFOPs</th>
              </tr>
            </thead>
            <tbody>
              {resultado.top10_produtos.map((produto, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3">
                    <div className="font-medium text-gray-900">{produto.nome}</div>
                  </td>
                  <td className="p-3">
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">{produto.codigo}</code>
                  </td>
                  <td className="p-3 text-right font-medium">{produto.quantidade.toLocaleString()}</td>
                  <td className="p-3 text-right font-medium">
                    R$ {produto.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {(produto.cfops_utilizados || [produto.cfop]).map((cfop, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {cfop}
                        </Badge>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Filtros */}
      <Card className="p-6 bg-white/90 backdrop-blur-md border border-gray-200/50 shadow-xl">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            {(['TODOS', 'CRÍTICO', 'ALERTA', 'OK'] as const).map((status) => (
              <Button
                key={status}
                variant={filterStatus === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus(status)}
              >
                {status}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Tabela de Discrepâncias */}
      <Card className="overflow-hidden bg-white/90 backdrop-blur-md border border-gray-200/50 shadow-xl">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Análise de Discrepâncias ({discrepanciasFiltradas.length} resultados)
          </h3>
        </div>
        
        {discrepanciasFiltradas.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-500">Nenhuma discrepância encontrada com os filtros atuais</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left p-4 font-semibold text-gray-700">Produto</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Código</th>
                  <th className="text-right p-4 font-semibold text-gray-700">Vendido</th>
                  <th className="text-right p-4 font-semibold text-gray-700">Est. Inicial</th>
                  <th className="text-right p-4 font-semibold text-gray-700">Est. Final</th>
                  <th className="text-right p-4 font-semibold text-gray-700">Discrepância</th>
                  <th className="text-center p-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left p-4 font-semibold text-gray-700">CFOPs</th>
                </tr>
              </thead>
              <tbody>
                {discrepanciasFiltradas.map((discrepancia, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-4">
                      <div className="font-medium text-gray-900">{discrepancia.produto}</div>
                    </td>
                    <td className="p-4">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">{discrepancia.codigo}</code>
                    </td>
                    <td className="p-4 text-right font-medium">
                      {discrepancia.quantidade_vendida.toLocaleString()}
                    </td>
                    <td className="p-4 text-right">
                      {discrepancia.estoque_inicial.toLocaleString()}
                    </td>
                    <td className="p-4 text-right">
                      {discrepancia.estoque_final.toLocaleString()}
                    </td>
                    <td className="p-4 text-right font-medium">
                      <span className={discrepancia.discrepancia < 0 ? 'text-red-600' : 'text-gray-900'}>
                        {discrepancia.discrepancia.toLocaleString()}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {getStatusIcon(discrepancia.status)}
                        {getStatusBadge(discrepancia.status)}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {discrepancia.cfops_utilizados.map((cfop, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {cfop}
                          </Badge>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Legenda */}
      <Card className="p-6 bg-white/80 backdrop-blur-md border border-gray-200/50 shadow-lg">
        <div className="flex flex-wrap gap-6 items-center justify-center text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-gray-600">OK - Sem discrepâncias significativas</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            <span className="text-gray-600">ALERTA - Discrepância moderada</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-500" />
            <span className="text-gray-600">CRÍTICO - Discrepância grave</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DiscrepometroAuto; 