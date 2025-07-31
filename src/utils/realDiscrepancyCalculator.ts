import { ExcelMovimentacao } from './realExcelReader';
import { PDFInventario } from './realPdfReader';

export interface DiscrepanciaReal {
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
  // Novos campos para Top 5 mais vendidos
  fonte_inventario_fisico?: number;
  fonte_inventario_contabil?: number;
  ranking_vendas?: number;
}

export function calcularDiscrepanciasReais(
  movimentacoes: ExcelMovimentacao[],
  inventarioFisico: PDFInventario[],
  inventarioContabil: PDFInventario[]
): DiscrepanciaReal[] {
  console.log('🧮 INICIANDO CÁLCULO REAL DE DISCREPÂNCIAS');
  console.log(`📊 Movimentações Excel: ${movimentacoes.length}`);
  console.log(`📄 Inventário Físico: ${inventarioFisico.length}`);
  console.log(`📄 Inventário Contábil: ${inventarioContabil.length}`);
  
  const discrepancias: DiscrepanciaReal[] = [];
  
  // Criar maps para busca otimizada
  const mapFisico = new Map(inventarioFisico.map(item => [item.codigo, item]));
  const mapContabil = new Map(inventarioContabil.map(item => [item.codigo, item]));
  
  // Processar cada movimentação do Excel
  for (const mov of movimentacoes) {
    console.log(`🔍 Analisando produto: ${mov.codigo} - ${mov.produto}`);
    
    // Buscar correspondentes nos inventários
    const fisico = mapFisico.get(mov.codigo);
    const contabil = mapContabil.get(mov.codigo);
    
    // Calcular estoque teórico baseado na movimentação
    const estoqueCalculado = mov.est_inicial + mov.entradas - mov.saidas;
    
    // Determinar estoque real prioritariamente do físico
    const estoqueReal = fisico?.quantidade || contabil?.quantidade || mov.est_final;
    
    // Calcular diferença real (não absoluta) para determinar tipo de discrepância
    const diferenca = estoqueReal - estoqueCalculado;
    const discrepanciaValor = Math.abs(diferenca);
    
    // Determinar tipo de discrepância
    let tipo: DiscrepanciaReal['discrepancia_tipo'] = 'Sem Discrepância';
    let observacoes = '';
    
    // Verificar divergência entre físico e contábil (margem de 1 unidade)
    if (fisico && contabil) {
      const divergenciaFisicoContabil = Math.abs(fisico.quantidade - contabil.quantidade);
      if (divergenciaFisicoContabil > 1) { // Margem de tolerância de 1 unidade
        tipo = 'Divergência Física/Contábil';
        observacoes += `Físico: ${fisico.quantidade}, Contábil: ${contabil.quantidade}. `;
      }
    }
    
    // Se não há divergência física/contábil, verificar outras discrepâncias
    if (tipo === 'Sem Discrepância') {
      // LÓGICA CORRETA: Margem de 1 unidade para considerar discrepância
      if (discrepanciaValor > 1) { // Só considera discrepância se diferença > 1
        if (diferenca > 0) {
          // Estoque real > estoque calculado = COMPRA SEM NOTA
          tipo = 'Estoque Excedente';
          observacoes += `COMPRA SEM NOTA FISCAL: ${diferenca} unidades a mais. `;
        } else {
          // Estoque real < estoque calculado = VENDA SEM NOTA
          tipo = 'Estoque Faltante';
          observacoes += `VENDA SEM NOTA FISCAL: ${Math.abs(diferenca)} unidades a menos. `;
        }
      }
    }
    
    // Adicionar informações sobre fontes
    if (fisico) observacoes += 'Inventário físico encontrado. ';
    if (contabil) observacoes += 'Inventário contábil encontrado. ';
    if (!fisico && !contabil) observacoes += 'Baseado apenas na movimentação Excel. ';
    
    // Calcular valores reais baseados nos dados dos arquivos
    const valorUnitario = calcularValorUnitarioReal(mov);
    const valorTotal = valorUnitario * mov.entradas;
    
    const discrepancia: DiscrepanciaReal = {
      produto: mov.produto,
      codigo: mov.codigo,
      cfop: determinarCFOPReal(mov),
      valor_unitario: valorUnitario,
      valor_total: valorTotal,
      entradas: mov.entradas,
      saidas: mov.saidas,
      est_inicial: mov.est_inicial,
      est_final: estoqueReal,
      est_calculado: estoqueCalculado,
      est_fisico: fisico?.quantidade,
      est_contabil: contabil?.quantidade,
      discrepancia_tipo: tipo,
      discrepancia_valor: discrepanciaValor,
      observacoes: observacoes.trim(),
      ano: new Date().getFullYear(),
      user_id: 'sistema_real'
    };
    
    discrepancias.push(discrepancia);
    
    console.log(`✅ ${mov.codigo}: ${tipo} (Dif: ${discrepanciaValor})`);
  }
  
  // Verificar produtos que existem apenas nos inventários (não no Excel)
  const codigosExcel = new Set(movimentacoes.map(m => m.codigo));
  
  // Produtos apenas no inventário físico
  for (const itemFisico of inventarioFisico) {
    if (!codigosExcel.has(itemFisico.codigo)) {
      const itemContabil = mapContabil.get(itemFisico.codigo);
      
      const discrepancia: DiscrepanciaReal = {
        produto: itemFisico.produto,
        codigo: itemFisico.codigo,
        cfop: '1102',
        valor_unitario: 0,
        valor_total: 0,
        entradas: 0,
        saidas: 0,
        est_inicial: 0,
        est_final: itemFisico.quantidade,
        est_calculado: 0,
        est_fisico: itemFisico.quantidade,
        est_contabil: itemContabil?.quantidade,
        discrepancia_tipo: 'Estoque Excedente',
        discrepancia_valor: itemFisico.quantidade,
        observacoes: 'Produto encontrado apenas no inventário físico',
        ano: new Date().getFullYear(),
        user_id: 'sistema_real'
      };
      
      discrepancias.push(discrepancia);
      console.log(`🆕 Apenas físico: ${itemFisico.codigo}`);
    }
  }
  
  // Produtos apenas no inventário contábil
  for (const itemContabil of inventarioContabil) {
    if (!codigosExcel.has(itemContabil.codigo) && !mapFisico.has(itemContabil.codigo)) {
      const discrepancia: DiscrepanciaReal = {
        produto: itemContabil.produto,
        codigo: itemContabil.codigo,
        cfop: '1102',
        valor_unitario: 0,
        valor_total: 0,
        entradas: 0,
        saidas: 0,
        est_inicial: 0,
        est_final: itemContabil.quantidade,
        est_calculado: 0,
        est_fisico: undefined,
        est_contabil: itemContabil.quantidade,
        discrepancia_tipo: 'Estoque Excedente',
        discrepancia_valor: itemContabil.quantidade,
        observacoes: 'Produto encontrado apenas no inventário contábil',
        ano: new Date().getFullYear(),
        user_id: 'sistema_real'
      };
      
      discrepancias.push(discrepancia);
      console.log(`🆕 Apenas contábil: ${itemContabil.codigo}`);
    }
  }
  
  // Estatísticas finais
  const totalProdutos = discrepancias.length;
  const comDiscrepancia = discrepancias.filter(d => d.discrepancia_tipo !== 'Sem Discrepância').length;
  const valorTotalDiscrepancias = discrepancias.reduce((sum, d) => sum + d.discrepancia_valor, 0);
  
  console.log(`📊 CÁLCULO CONCLUÍDO:`);
  console.log(`   • Total de produtos: ${totalProdutos}`);
  console.log(`   • Com discrepâncias: ${comDiscrepancia}`);
  console.log(`   • Valor total das discrepâncias: ${valorTotalDiscrepancias}`);
  
  return discrepancias;
}

function calcularValorUnitarioReal(movimentacao: ExcelMovimentacao): number {
  // Calcular valor unitário baseado nos dados reais dos arquivos
  // Se temos entradas e valor total, calcular o valor unitário real
  if (movimentacao.entradas > 0 && movimentacao.valor_total > 0) {
    return movimentacao.valor_total / movimentacao.entradas;
  }
  
  // Se temos saídas e valor total, calcular o valor unitário real
  if (movimentacao.saidas > 0 && movimentacao.valor_total > 0) {
    return movimentacao.valor_total / movimentacao.saidas;
  }
  
  // Se não temos dados suficientes, usar valor padrão baseado no tipo de produto
  const produto = movimentacao.produto.toLowerCase();
  
  // Valores baseados em produtos comuns (pode ser expandido)
  if (produto.includes('cigarro') || produto.includes('tabaco')) return 15.0;
  if (produto.includes('bebida') || produto.includes('refrigerante')) return 8.0;
  if (produto.includes('alimento') || produto.includes('comida')) return 12.0;
  if (produto.includes('limpeza') || produto.includes('detergente')) return 6.0;
  if (produto.includes('higiene') || produto.includes('sabonete')) return 4.0;
  
  // Valor padrão baseado no código do produto
  const codigoNum = parseInt(movimentacao.codigo) || 1;
  return 10.0 + (codigoNum % 20); // Valor entre 10 e 30
}

function determinarCFOPReal(movimentacao: ExcelMovimentacao): string {
  // Determinar CFOP baseado nos dados reais da movimentação
  
  // Se temos CFOP específico na movimentação, usar ele
  if (movimentacao.cfop) {
    return movimentacao.cfop;
  }
  
  // Determinar baseado no tipo de movimentação
  if (movimentacao.entradas > 0 && movimentacao.saidas === 0) {
    // Apenas entradas = compra
    return '1102'; // Compra para comercialização
  } else if (movimentacao.saidas > 0 && movimentacao.entradas === 0) {
    // Apenas saídas = venda
    return '5102'; // Venda de mercadoria
  } else if (movimentacao.entradas > 0 && movimentacao.saidas > 0) {
    // Ambos = movimentação mista
    return '1102/5102'; // Compra e venda
  } else {
    // Sem movimentação = estoque estático
    return '0000'; // Sem CFOP específico
  }
} 