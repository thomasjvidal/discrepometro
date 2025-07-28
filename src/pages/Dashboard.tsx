
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, TrendingUp, AlertTriangle, CheckCircle, Search, Trophy, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import DiscrepancyTable from '@/components/DiscrepancyTable';
import CfopTable from '@/components/CfopTable';
import StatsCard from '@/components/StatsCard';
import FilterBar from '@/components/FilterBar';

// Mock data for demonstration
const mockData = [
  {
    id: 1,
    produto: "Mouse Gamer RGB",
    codigo: "MGR001",
    entradas: 150,
    saidas: 142,
    estoqueInicial: 50,
    estoqueFinal: 58,
    estoqueFinalCalculado: 58,
    discrepancia: "Sem Discrepância",
    ranking_vendas: 1
  },
  {
    id: 2,
    produto: "Teclado Mecânico",
    codigo: "TM002",
    entradas: 80,
    saidas: 95,
    estoqueInicial: 30,
    estoqueFinalCalculado: 15,
    estoqueFinal: 20,
    discrepancia: "Compra sem Nota",
    ranking_vendas: 2
  },
  {
    id: 3,
    produto: "Monitor 24\"",
    codigo: "MON24",
    entradas: 45,
    saidas: 52,
    estoqueInicial: 15,
    estoqueFinalCalculado: 8,
    estoqueFinal: 3,
    discrepancia: "Venda sem Nota",
    ranking_vendas: 3
  },
  {
    id: 4,
    produto: "Headset Gamer",
    codigo: "HG004",
    entradas: 120,
    saidas: 110,
    estoqueInicial: 25,
    estoqueFinalCalculado: 35,
    estoqueFinal: 30,
    discrepancia: "Sem Discrepância",
    ranking_vendas: 4
  },
  {
    id: 5,
    produto: "Webcam HD",
    codigo: "WH005",
    entradas: 60,
    saidas: 55,
    estoqueInicial: 10,
    estoqueFinalCalculado: 15,
    estoqueFinal: 12,
    discrepancia: "Estoque Faltante",
    ranking_vendas: 5
  }
];

const Dashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  
  const filteredData = mockData.filter(item => {
    const matchesSearch = item.produto.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.codigo.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedFilter === 'all') return matchesSearch;
    
    const discrepancyMap = {
      'sem-discrepancia': 'Sem Discrepância',
      'compra-sem-nota': 'Compra sem Nota',
      'venda-sem-nota': 'Venda sem Nota'
    };
    
    return matchesSearch && item.discrepancia === discrepancyMap[selectedFilter];
  });

  // Filtrar Top 5 mais vendidos
  const top5Vendidos = mockData
    .filter(item => item.ranking_vendas && item.ranking_vendas <= 5)
    .sort((a, b) => (a.ranking_vendas || 0) - (b.ranking_vendas || 0));

  const stats = {
    totalProdutos: mockData.length,
    comDiscrepancia: mockData.filter(item => item.discrepancia !== 'Sem Discrepância').length,
    conformidade: Math.round((mockData.filter(item => item.discrepancia === 'Sem Discrepância').length / mockData.length) * 100),
    topVendido: top5Vendidos[0]?.produto || 'N/A'
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="text-dark-400 hover:text-foreground">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-golden-400 to-golden-600 bg-clip-text text-transparent">
                Dashboard de Análise Fiscal
              </h1>
              <p className="text-dark-400 mt-1">Resultado da análise das discrepâncias encontradas</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatsCard
            title="Produtos Analisados"
            value={stats.totalProdutos.toString()}
            icon={TrendingUp}
            color="blue"
          />
          <StatsCard
            title="Com Discrepância"
            value={stats.comDiscrepancia.toString()}
            icon={AlertTriangle}
            color="red"
          />
          <StatsCard
            title="Conformidade"
            value={`${stats.conformidade}%`}
            icon={CheckCircle}
            color="green"
          />
          <StatsCard
            title="Top Vendido"
            value={stats.topVendido}
            subtitle={`${top5Vendidos[0]?.saidas || 0} unidades`}
            icon={Crown}
            color="golden"
          />
        </div>

        {/* Top 5 Mais Vendidos Section */}
        {top5Vendidos.length > 0 && (
          <Card className="glass-effect p-6">
            <div className="flex items-center gap-3 mb-6">
              <Trophy className="w-6 h-6 text-golden-400" />
              <h2 className="text-xl font-semibold text-foreground">🏆 Top 5 Produtos Mais Vendidos</h2>
              <Badge variant="secondary" className="bg-golden-500/20 text-golden-400 border-golden-500/30">
                Análise Prioritária
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {top5Vendidos.map((item, index) => (
                <Card key={item.id} className="p-4 bg-dark-800/50 border-dark-700 hover:border-golden-500/30 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-golden-500 text-dark-900' :
                        index === 1 ? 'bg-gray-400 text-dark-900' :
                        index === 2 ? 'bg-amber-600 text-white' :
                        'bg-dark-600 text-dark-300'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">{item.produto}</h3>
                        <p className="text-sm text-dark-400">{item.codigo}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-dark-400">Vendas:</span>
                      <span className="font-medium text-golden-400">{item.saidas} un</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-dark-400">Estoque Final:</span>
                      <span className="font-medium">{item.estoqueFinal} un</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-dark-400">Status:</span>
                      <Badge variant={
                        item.discrepancia === 'Sem Discrepância' ? 'default' :
                        item.discrepancia === 'Compra sem Nota' ? 'destructive' :
                        'secondary'
                      } className="text-xs">
                        {item.discrepancia}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-dark-800/30 rounded-lg border border-dark-700">
              <p className="text-sm text-dark-400">
                <strong>💡 Análise Automática:</strong> Estes são os 5 produtos com maior volume de vendas identificados 
                através dos CFOPs de venda (5xxx, 6xxx, 7xxx). As quantidades foram cruzadas com os inventários físico e contábil.
              </p>
            </div>
          </Card>
        )}

        {/* CFOP Metrics Table */}
        <CfopTable />

        {/* Filters and Search */}
        <Card className="glass-effect p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-500 w-4 h-4" />
                <Input
                  placeholder="Buscar produto ou código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-dark-800/50 border-dark-700"
                />
              </div>
              <FilterBar selectedFilter={selectedFilter} onFilterChange={setSelectedFilter} />
            </div>
            
            <div className="text-sm text-dark-400">
              {filteredData.length} de {mockData.length} produtos
            </div>
          </div>
        </Card>

        {/* Results Table */}
        <Card className="glass-effect">
          <DiscrepancyTable data={filteredData} />
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
