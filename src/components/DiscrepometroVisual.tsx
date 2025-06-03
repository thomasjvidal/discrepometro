import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, FileText, TrendingUp, Search, Filter, Database } from 'lucide-react';
import { useAnaliseDiscrepancia, type Discrepancia } from '@/hooks/useAnaliseDiscrepancia';

export default function DiscrepometroVisual() {
  const { discrepancias, carregando, erro, carregarDados, carregarDadosSupabase } = useAnaliseDiscrepancia();
  
  // Estados para filtros
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroTexto, setFiltroTexto] = useState<string>('');

  // Carregar dados na inicialização
  React.useEffect(() => {
    carregarDadosSupabase(); // Tenta carregar do Supabase primeiro
  }, [carregarDadosSupabase]);

  // Filtrar dados com tipagem segura
  const dadosFiltrados = useMemo(() => {
    return discrepancias.filter((item: Discrepancia) => {
      // Verificar se produto é string antes de usar toLowerCase e includes
      const produtoValido = typeof item.produto === 'string' ? item.produto : '';
      const codigoValido = typeof item.codigo === 'string' ? item.codigo : '';
      
      const matchTipo = filtroTipo === 'todos' || 
        (item.discrepancia_tipo && item.discrepancia_tipo === filtroTipo);
      
      const matchTexto = filtroTexto === '' || 
        produtoValido.toLowerCase().includes(filtroTexto.toLowerCase()) ||
        codigoValido.toLowerCase().includes(filtroTexto.toLowerCase());
      
      return matchTipo && matchTexto;
    });
  }, [discrepancias, filtroTipo, filtroTexto]);

  // Estatísticas
  const estatisticas = useMemo(() => {
    const total = discrepancias.length;
    const comDiscrepancia = discrepancias.filter(d => 
      d.discrepancia_tipo && d.discrepancia_tipo !== 'Sem Discrepância'
    ).length;
    const valorTotal = discrepancias.reduce((sum, d) => sum + (d.valor_total || 0), 0);
    
    return {
      total,
      comDiscrepancia,
      percentualComDiscrepancia: total > 0 ? (comDiscrepancia / total) * 100 : 0,
      valorTotal
    };
  }, [discrepancias]);

  const getBadgeVariant = (tipo: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (tipo) {
      case 'Sem Discrepância': return 'outline';
      case 'Estoque Excedente': return 'default';
      case 'Estoque Faltante': return 'destructive';
      case 'Divergência Física/Contábil': return 'secondary';
      default: return 'outline';
    }
  };

  const formatarMoeda = (valor: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarData = (dataString: string): string => {
    return new Date(dataString).toLocaleDateString('pt-BR');
  };

  // Tela de carregamento
  if (carregando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando análise de discrepâncias...</p>
        </div>
      </div>
    );
  }

  // Tela de erro
  if (erro) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Erro ao carregar dados</h3>
          <p className="text-gray-600 mb-4">{erro}</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={carregarDadosSupabase}>
              <Database className="h-4 w-4 mr-2" />
              Tentar Supabase
            </Button>
            <Button onClick={carregarDados} variant="outline">
              Dados Demo
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Análise de Discrepâncias</h2>
          <p className="text-gray-600 mt-1">
            {discrepancias.length} produtos analisados • {estatisticas.comDiscrepancia} com discrepâncias
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={carregarDadosSupabase} variant="outline">
            <Database className="h-4 w-4 mr-2" />
            Supabase
          </Button>
          <Button onClick={carregarDados} variant="outline">
            <TrendingUp className="h-4 w-4 mr-2" />
            Demo
          </Button>
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.total}</div>
            <p className="text-xs text-muted-foreground">produtos analisados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Com Discrepâncias</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.comDiscrepancia}</div>
            <p className="text-xs text-muted-foreground">
              {estatisticas.percentualComDiscrepancia.toFixed(1)}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatarMoeda(estatisticas.valorTotal)}</div>
            <p className="text-xs text-muted-foreground">valor movimentado</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por produto ou código..."
                value={filtroTexto}
                onChange={(e) => setFiltroTexto(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="Sem Discrepância">Sem Discrepância</SelectItem>
                <SelectItem value="Estoque Excedente">Estoque Excedente</SelectItem>
                <SelectItem value="Estoque Faltante">Estoque Faltante</SelectItem>
                <SelectItem value="Divergência Física/Contábil">Divergência Física/Contábil</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de dados */}
      <Card>
        <CardHeader>
          <CardTitle>Resultados da Análise</CardTitle>
          <CardDescription>
            {dadosFiltrados.length} de {discrepancias.length} produtos mostrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>CFOP</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Diferença</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dadosFiltrados.map((item: Discrepancia) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {typeof item.produto === 'string' ? item.produto : 'N/A'}
                  </TableCell>
                  <TableCell>{item.codigo}</TableCell>
                  <TableCell>{item.cfop}</TableCell>
                  <TableCell>
                    <Badge variant={getBadgeVariant(item.discrepancia_tipo || '')}>
                      {item.discrepancia_tipo || 'N/A'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {item.discrepancia_valor !== undefined ? `${item.discrepancia_valor} un` : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {item.valor_total !== undefined ? formatarMoeda(item.valor_total) : 'N/A'}
                  </TableCell>
                  <TableCell>{formatarData(item.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {dadosFiltrados.length === 0 && (
            <div className="text-center py-8">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum resultado encontrado para os filtros aplicados</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 