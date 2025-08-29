
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, TrendingUp, AlertTriangle, CheckCircle, Search, Trophy, Crown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import DiscrepancyTable from '@/components/DiscrepancyTable';
import CfopTable from '@/components/CfopTable';
import StatsCard from '@/components/StatsCard';
import FilterBar from '@/components/FilterBar';
import { toast } from '@/hooks/use-toast';
import { useAnaliseDiscrepancia } from '@/hooks/useAnaliseDiscrepancia';

interface DiscrepanciaReal {
  id?: number;
  produto: string;
  codigo: string;
  cfop: string;
  valor_unitario: number;
  valor_total: number;
  entradas: number;
  saidas: number;
  est_inicial: number;
  est_final: number;
  est_calculado: number;
  est_fisico?: number;
  est_contabil?: number;
  discrepancia_tipo: 'Sem Discrepância' | 'Estoque Excedente' | 'Estoque Faltante' | 'Divergência Física/Contábil';
  discrepancia_valor: number;
  observacoes: string;
  ano?: number;
  user_id?: string;
  ranking_vendas?: number;
  created_at?: string;
}

const Dashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  
  // Usar hook melhorado para buscar dados reais
  const { discrepancias, loading, error, refetch } = useAnaliseDiscrepancia();
  const [refreshing, setRefreshing] = useState(false);
  
  // Atualizar dados manualmente
  const atualizarDados = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
    toast({
      title: "Dados atualizados",
      description: "Dashboard atualizado com sucesso!",
    });
  };
  
  // Filtrar dados baseado na busca e filtro
  const filteredData = discrepancias.filter(item => {
    const matchesSearch = item.produto.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.codigo.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedFilter === 'all') return matchesSearch;
    
    const discrepancyMap = {
      'sem-discrepancia': 'Sem Discrepância',
      'estoque-excedente': 'Estoque Excedente',
      'estoque-faltante': 'Estoque Faltante',
      'divergencia': 'Divergência Física/Contábil'
    };
    
    return matchesSearch && item.discrepancia_tipo === discrepancyMap[selectedFilter as keyof typeof discrepancyMap];
  });

  // Calcular estatísticas
  const stats = {
    total: discrepancias.length,
    semDiscrepancia: discrepancias.filter(d => d.discrepancia_tipo === 'Sem Discrepância').length,
    estoqueExcedente: discrepancias.filter(d => d.discrepancia_tipo === 'Estoque Excedente').length,
    estoqueFaltante: discrepancias.filter(d => d.discrepancia_tipo === 'Estoque Faltante').length,
    divergencia: discrepancias.filter(d => d.discrepancia_tipo === 'Divergência Física/Contábil').length
  };

  // Top 5 mais vendidos (baseado em saídas)
  const top5Vendidos = discrepancias
    .filter(d => d.saidas > 0)
    .sort((a, b) => b.saidas - a.saidas)
    .slice(0, 5);

  // Converter para formato esperado pela tabela
  const converterParaDiscrepancyItem = (item: DiscrepanciaReal) => ({
    id: item.id || Math.random(),
    produto: item.produto,
    codigo: item.codigo,
    entradas: item.entradas,
    saidas: item.saidas,
    estoqueInicial: item.est_inicial,
    estoqueFinal: item.est_final,
    estoqueFinalCalculado: item.est_calculado,
    discrepancia: item.discrepancia_tipo
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-700">Carregando análise...</h2>
              <p className="text-gray-500">Buscando dados reais de processamento</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-red-600" />
              <h2 className="text-xl font-semibold text-gray-700">Erro ao carregar dados</h2>
              <p className="text-gray-500">{error}</p>
              <Button onClick={refetch} className="mt-4">
                Tentar Novamente
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link to="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard de Discrepâncias</h1>
              <p className="text-gray-600">Análise fiscal em tempo real</p>
            </div>
          </div>
          <Button onClick={atualizarDados} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Atualizando...' : 'Atualizar'}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <StatsCard
            title="Total de Produtos"
            value={stats.total.toString()}
            icon={Trophy}
            color="blue"
          />
          <StatsCard
            title="Sem Discrepância"
            value={stats.semDiscrepancia.toString()}
            icon={CheckCircle}
            color="green"
          />
          <StatsCard
            title="Estoque Excedente"
            value={stats.estoqueExcedente.toString()}
            icon={TrendingUp}
            color="golden"
          />
          <StatsCard
            title="Estoque Faltante"
            value={stats.estoqueFaltante.toString()}
            icon={AlertTriangle}
            color="red"
          />
          <StatsCard
            title="Divergências"
            value={stats.divergencia.toString()}
            icon={Crown}
            color="golden"
          />
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <FilterBar
            selectedFilter={selectedFilter}
            onFilterChange={setSelectedFilter}
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Discrepancy Table */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Discrepâncias Encontradas</h2>
              {filteredData.length > 0 ? (
                <DiscrepancyTable data={filteredData.map(converterParaDiscrepancyItem)} />
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nenhuma discrepância encontrada</p>
                </div>
              )}
            </Card>
          </div>

          {/* CFOP Metrics */}
          <div>
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Top 5 Mais Vendidos</h2>
              <CfopTable />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
