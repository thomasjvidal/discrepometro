import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

Deno.serve(async (req) => {
  console.log('📊 upload_csv: Iniciando análise fiscal completa');
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    if (req.method !== "POST") {
      return new Response("Use POST", { status: 405, headers: corsHeaders })
    }

    // Inicializar Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new Response(JSON.stringify({ error: 'Nenhum arquivo fornecido' }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`📋 Processando arquivo CSV: ${file.name} (${file.size} bytes)`);

    // Verificar tamanho do arquivo (máx 100MB)
    if (file.size > 100 * 1024 * 1024) {
      return new Response(JSON.stringify({ 
        error: 'Arquivo muito grande', 
        message: 'Tamanho máximo: 100MB' 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Ler conteúdo do arquivo
    const buffer = await file.arrayBuffer();
    const content = new TextDecoder().decode(buffer);
    
    console.log('📝 Processando dados CSV...');
    
    // Processar CSV linha por linha
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      throw new Error('Arquivo CSV vazio');
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/['"]/g, ''));
    console.log('📊 Headers encontrados:', headers);

    // Mapear índices das colunas importantes
    const colIndexes = {
      dataEmissao: headers.findIndex(h => h.includes('Data Emissão') || h.includes('data_emissao')),
      cfop: headers.findIndex(h => h.includes('CFOP') || h.includes('cfop')),
      numeroItem: headers.findIndex(h => h.includes('Número Item') || h.includes('numero_item')),
      codigoProduto: headers.findIndex(h => h.includes('Código') || h.includes('codigo')),
      descricaoProduto: headers.findIndex(h => h.includes('Descrição') || h.includes('descricao')),
      quantidade: headers.findIndex(h => h.includes('Qtde') || h.includes('quantidade')),
      valor: headers.findIndex(h => h.includes('Valor') || h.includes('valor')),
      estoqueInicial: headers.findIndex(h => h.includes('Estoque Inicial') || h.includes('estoque_inicial'))
    };

    console.log('🗺️ Mapeamento de colunas:', colIndexes);

    // Processar dados em lotes
    const batchSize = 500;
    const produtos = new Map();
    
    // Primeira passada: agrupar dados por produto
    console.log('📈 Agrupando dados por produto...');
    for (let i = 1; i < Math.min(lines.length, 10000); i++) { // Limitar para evitar timeout
      const cells = lines[i].split(',').map(c => c.trim().replace(/['"]/g, ''));
      
      if (cells.length < headers.length) continue;

      try {
        const codigoProduto = cells[colIndexes.codigoProduto] || '';
        const descricaoProduto = cells[colIndexes.descricaoProduto] || '';
        const cfop = cells[colIndexes.cfop] || '';
        const quantidade = parseFloat(cells[colIndexes.quantidade]?.replace(',', '.') || '0');
        const valor = parseFloat(cells[colIndexes.valor]?.replace(',', '.') || '0');
        const estoqueInicial = parseFloat(cells[colIndexes.estoqueInicial]?.replace(',', '.') || '0');

        if (!codigoProduto || !descricaoProduto) continue;

        if (!produtos.has(codigoProduto)) {
          produtos.set(codigoProduto, {
            codigo: codigoProduto,
            produto: descricaoProduto,
            estoqueInicial: estoqueInicial,
            totalEntradas: 0,
            totalSaidas: 0,
            valorTotal: 0,
            cfops: new Set()
          });
        }

        const produto = produtos.get(codigoProduto);
        produto.cfops.add(cfop);
        produto.valorTotal += valor;

        // Classificar CFOP como entrada ou saída
        // CFOPs de entrada: 1102, 2102, 1202, 1411, 1551, 1910
        // CFOPs de saída: 5102, 5405, 5910, 5927
        const cfopNum = parseInt(cfop);
        if ([1102, 2102, 1202, 1411, 1551, 1910].includes(cfopNum)) {
          produto.totalEntradas += quantidade;
        } else if ([5102, 5405, 5910, 5927].includes(cfopNum)) {
          produto.totalSaidas += quantidade;
        }

      } catch (error) {
        console.warn(`⚠️ Erro na linha ${i}:`, error);
        continue;
      }
    }

    console.log(`🔢 Total de produtos únicos: ${produtos.size}`);

    // Segunda passada: calcular discrepâncias e inserir no banco
    const registros = [];
    let contador = 0;

    for (const [codigo, dadosProduto] of produtos) {
      contador++;
      
      // Calcular estoque final
      const estoqueCalculado = dadosProduto.estoqueInicial + dadosProduto.totalEntradas - dadosProduto.totalSaidas;
      
      // Determinar tipo de discrepância
      let discrepanciaTipo = 'Sem Discrepância';
      let discrepanciaValor = 0;
      let observacoes = '';

      if (estoqueCalculado > dadosProduto.estoqueInicial + dadosProduto.totalEntradas) {
        discrepanciaTipo = 'Estoque Excedente';
        discrepanciaValor = estoqueCalculado - (dadosProduto.estoqueInicial + dadosProduto.totalEntradas);
        observacoes = 'Possível compra sem nota fiscal';
      } else if (estoqueCalculado < dadosProduto.estoqueInicial) {
        discrepanciaTipo = 'Estoque Faltante';
        discrepanciaValor = dadosProduto.estoqueInicial - estoqueCalculado;
        observacoes = 'Possível venda sem nota fiscal';
      }

      const registro = {
        produto: dadosProduto.produto,
        codigo: codigo,
        cfop: Array.from(dadosProduto.cfops).join(', '),
        valor_unitario: dadosProduto.valorTotal / Math.max(dadosProduto.totalEntradas + dadosProduto.totalSaidas, 1),
        valor_total: dadosProduto.valorTotal,
        entradas: Math.round(dadosProduto.totalEntradas),
        saidas: Math.round(dadosProduto.totalSaidas),
        est_inicial: Math.round(dadosProduto.estoqueInicial),
        est_final: Math.round(estoqueCalculado),
        est_calculado: Math.round(estoqueCalculado),
        discrepancia_tipo: discrepanciaTipo,
        discrepancia_valor: Math.round(discrepanciaValor),
        observacoes: observacoes,
        ano: new Date().getFullYear(),
        user_id: 'system'
      };

      registros.push(registro);

      // Inserir em lotes
      if (registros.length >= batchSize || contador === produtos.size) {
        console.log(`💾 Inserindo lote ${Math.ceil(contador / batchSize)} (${registros.length} registros)...`);
        
        const { error } = await supabase
          .from('analise_discrepancia')
          .insert(registros);

        if (error) {
          console.error('❌ Erro ao inserir lote:', error);
          throw new Error(`Erro na inserção: ${error.message}`);
        }

        registros.length = 0; // Limpar array
      }
    }

    console.log('✅ Análise fiscal CSV completa!');

    // Buscar estatísticas finais
    const { data: stats } = await supabase
      .from('analise_discrepancia')
      .select('discrepancia_tipo, discrepancia_valor')
      .neq('discrepancia_tipo', 'Sem Discrepância');

    const totalDiscrepancias = stats?.length || 0;
    const valorTotalDiscrepancias = stats?.reduce((sum, item) => sum + (item.discrepancia_valor || 0), 0) || 0;

    return new Response(JSON.stringify({ 
      message: '✅ Análise fiscal CSV realizada com sucesso!',
      status: 'success',
      dados: {
        produtosAnalisados: produtos.size,
        totalDiscrepancias: totalDiscrepancias,
        valorTotalDiscrepancias: valorTotalDiscrepancias,
        linhasProcessadas: Math.min(lines.length - 1, 10000)
      },
      observacao: 'Dados salvos na tabela analise_discrepancia'
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
    
  } catch (error) {
    console.error('❌ Erro na análise fiscal CSV:', error);
    return new Response(JSON.stringify({
      error: 'Erro na análise fiscal',
      message: error.message,
      dica: 'Verifique se o arquivo CSV está no formato correto'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
})
