
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, TrendingUp, AlertTriangle, CheckCircle, Search } from 'lucide-react';
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
    discrepancia: "Sem Discrepância"
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
    discrepancia: "Compra sem Nota"
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
    discrepancia: "Venda sem Nota"
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

  const stats = {
    totalProdutos: mockData.length,
    comDiscrepancia: mockData.filter(item => item.discrepancia !== 'Sem Discrepância').length,
    conformidade: Math.round((mockData.filter(item => item.discrepancia === 'Sem Discrepância').length / mockData.length) * 100)
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
            value="Mouse Gamer"
            subtitle="142 unidades"
            icon={TrendingUp}
            color="golden"
          />
        </div>

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
