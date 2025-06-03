
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw, Search } from 'lucide-react';
import { useAnaliseDiscrepancia } from '@/hooks/useAnaliseDiscrepancia';

const DiscrepometroVisual = () => {
  const { data, loading, error, refetch } = useAnaliseDiscrepancia();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = data.filter(item =>
    item.produto.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Análise de CFOPs por produto
  const analyzeProduct = (produto: string) => {
    const productCfops = data.filter(item => item.produto === produto);
    const cfops = productCfops.map(item => item.cfop);
    const uniqueCfops = [...new Set(cfops)];

    // Verifica se tem mais de 1 CFOP
    const hasMultipleCfops = uniqueCfops.length > 1;

    // Verifica se tem CFOPs de entrada E saída (ex: 1102 e 5102)
    const hasEntryAndExit = uniqueCfops.some(cfop => cfop.startsWith('1') || cfop.startsWith('2')) &&
                           uniqueCfops.some(cfop => cfop.startsWith('5') || cfop.startsWith('6'));

    return { hasMultipleCfops, hasEntryAndExit, cfopCount: uniqueCfops.length };
  };

  const getRowStyles = (produto: string) => {
    const analysis = analyzeProduct(produto);
    
    if (analysis.hasEntryAndExit) {
      return 'bg-red-50 hover:bg-red-100 border-l-4 border-red-400';
    } else if (analysis.hasMultipleCfops) {
      return 'bg-yellow-50 hover:bg-yellow-100 border-l-4 border-yellow-400';
    }
    
    return 'bg-white hover:bg-gray-50';
  };

  const getStatusIcon = (produto: string) => {
    const analysis = analyzeProduct(produto);
    
    if (analysis.hasEntryAndExit) {
      return '🔴';
    } else if (analysis.hasMultipleCfops) {
      return '🟡';
    }
    
    return '🟢';
  };

  const getStatusText = (produto: string) => {
    const analysis = analyzeProduct(produto);
    
    if (analysis.hasEntryAndExit) {
      return 'Potencial Erro';
    } else if (analysis.hasMultipleCfops) {
      return 'Atenção';
    }
    
    return 'OK';
  };

  if (loading) {
    return (
      <Card className="p-8 bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-lg">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-gray-600 font-medium">Carregando análise fiscal...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8 bg-white/80 backdrop-blur-sm border border-red-200/50 shadow-lg">
        <div className="text-center space-y-4">
          <div className="text-red-600 text-lg font-semibold">Erro ao carregar dados</div>
          <div className="text-gray-500">{error}</div>
          <Button onClick={refetch} variant="outline" size="sm" className="bg-white hover:bg-gray-50">
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar novamente
          </Button>
        </div>
      </Card>
    );
  }

  // Agrupar dados por produto para evitar duplicatas visuais
  const groupedData = filteredData.reduce((acc, item) => {
    const existing = acc.find(group => group.produto === item.produto);
    if (existing) {
      existing.cfops.push(item.cfop);
      existing.items.push(item);
    } else {
      acc.push({
        produto: item.produto,
        codigo: item.codigo,
        cfops: [item.cfop],
        items: [item],
        latestDate: item.created_at
      });
    }
    return acc;
  }, [] as { produto: string; codigo: string; cfops: string[]; items: any[]; latestDate: string }[]);

  return (
    <div className="space-y-6">
      {/* Header com busca e botão atualizar */}
      <Card className="p-6 bg-white/90 backdrop-blur-md border border-gray-200/50 shadow-xl">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Buscar produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 border-gray-300/50 focus:border-blue-500 focus:ring-blue-500/20 bg-white/70 backdrop-blur-sm text-gray-900 placeholder-gray-500 rounded-xl"
            />
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-sm text-gray-600 font-medium">
              {groupedData.length} produtos • {filteredData.length} registros
            </div>
            <Button 
              onClick={refetch} 
              variant="outline" 
              size="sm" 
              className="bg-white/80 hover:bg-white border-gray-300/50 text-gray-700 h-12 px-6 rounded-xl shadow-sm backdrop-blur-sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar dados
            </Button>
          </div>
        </div>
      </Card>

      {/* Tabela de dados */}
      <Card className="overflow-hidden bg-white/90 backdrop-blur-md border border-gray-200/50 shadow-xl rounded-2xl">
        {groupedData.length === 0 ? (
          <div className="p-16 text-center">
            <div className="text-gray-500 text-xl font-medium mb-2">
              {searchTerm ? 'Nenhum produto encontrado' : 'Nenhuma análise disponível'}
            </div>
            <div className="text-gray-400 text-sm">
              {searchTerm ? 'Tente ajustar o termo de busca' : 'Os dados aparecerão aqui após o processamento'}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200/50">
                  <th className="text-left p-6 font-semibold text-gray-800 text-sm uppercase tracking-wide">Produto</th>
                  <th className="text-left p-6 font-semibold text-gray-800 text-sm uppercase tracking-wide">Código</th>
                  <th className="text-left p-6 font-semibold text-gray-800 text-sm uppercase tracking-wide">CFOPs</th>
                  <th className="text-left p-6 font-semibold text-gray-800 text-sm uppercase tracking-wide">Última Atualização</th>
                  <th className="text-center p-6 font-semibold text-gray-800 text-sm uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody>
                {groupedData.map((group, index) => (
                  <tr
                    key={`${group.produto}-${index}`}
                    className={`
                      border-b border-gray-100/50 transition-all duration-200 hover:shadow-sm
                      ${getRowStyles(group.produto)}
                    `}
                  >
                    <td className="p-6">
                      <div className="font-semibold text-gray-900 text-base">{group.produto}</div>
                    </td>
                    <td className="p-6">
                      <div className="font-mono text-sm text-gray-600 bg-gray-100/50 px-3 py-1 rounded-lg inline-block">
                        {group.codigo}
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex flex-wrap gap-2">
                        {[...new Set(group.cfops)].map((cfop, i) => (
                          <span
                            key={i}
                            className="inline-block bg-blue-100/70 text-blue-800 text-xs font-medium px-3 py-1 rounded-full border border-blue-200/50"
                          >
                            {cfop}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="text-sm text-gray-600">
                        {formatDate(group.latestDate)}
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <span className="text-xl">{getStatusIcon(group.produto)}</span>
                        <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                          getStatusText(group.produto) === 'Potencial Erro' ? 'bg-red-100 text-red-700' :
                          getStatusText(group.produto) === 'Atenção' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {getStatusText(group.produto)}
                        </span>
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
            <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
            <span className="text-gray-600">🟢 Normal - CFOP único</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded"></div>
            <span className="text-gray-600">🟡 Atenção - Múltiplos CFOPs</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
            <span className="text-gray-600">🔴 Potencial Erro - CFOPs entrada + saída</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DiscrepometroVisual;
