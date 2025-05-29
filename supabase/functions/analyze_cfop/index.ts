import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Variáveis de ambiente são necessárias")
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey)

interface CFOPAnalysis {
  cfop: string;
  descricao: string;
  total_produtos: number;
  total_discrepancias: number;
  valor_total_discrepancias: number;
  percentual_discrepancias: number;
  produtos_com_problema: number;
}

// Descrições dos CFOPs mais comuns
const CFOP_DESCRIPTIONS = {
  '1102': 'Compra para comercialização',
  '1949': 'Outra entrada de mercadoria ou prestação de serviço não especificada',
  '5102': 'Venda de mercadoria adquirida ou recebida de terceiros',
  '5405': 'Venda de mercadoria adquirida ou recebida de terceiros',
  '5949': 'Outra saída de mercadoria ou prestação de serviço não especificada',
  '6102': 'Venda de mercadoria adquirida ou recebida de terceiros',
  '6949': 'Outra saída de mercadoria ou prestação de serviço não especificada'
};

function getCFOPDescription(cfop: string): string {
  return CFOP_DESCRIPTIONS[cfop as keyof typeof CFOP_DESCRIPTIONS] || 'CFOP não identificado';
}

async function analyzeCFOPData(): Promise<CFOPAnalysis[]> {
  try {
    console.log('🔥 Analisando dados por CFOP...');
    
    // Buscar todos os dados com CFOP
    const { data: allData, error } = await supabaseAdmin
      .from('analise_discrepancia')
      .select('*')
      .neq('cfop', '')
      .order('cfop');

    if (error) {
      console.error('🔥 Erro ao buscar dados:', error);
      throw error;
    }

    if (!allData || allData.length === 0) {
      return [];
    }

    console.log(`🔥 Processando ${allData.length} registros com CFOP`);

    // Agrupar por CFOP
    const cfopGroups: { [key: string]: any[] } = {};
    
    allData.forEach(item => {
      const cfop = item.cfop.trim();
      if (cfop) {
        if (!cfopGroups[cfop]) {
          cfopGroups[cfop] = [];
        }
        cfopGroups[cfop].push(item);
      }
    });

    // Analisar cada grupo CFOP
    const analysis: CFOPAnalysis[] = [];
    
    for (const [cfop, items] of Object.entries(cfopGroups)) {
      const totalProdutos = items.length;
      const produtosComDiscrepancia = items.filter(item => 
        item.discrepancia_tipo !== 'Sem Discrepância'
      );
      
      const totalDiscrepancias = produtosComDiscrepancia.length;
      const valorTotalDiscrepancias = produtosComDiscrepancia.reduce((total, item) => 
        total + (item.discrepancia_valor || 0), 0
      );
      
      const percentualDiscrepancias = totalProdutos > 0 
        ? (totalDiscrepancias / totalProdutos) * 100 
        : 0;

      analysis.push({
        cfop,
        descricao: getCFOPDescription(cfop),
        total_produtos: totalProdutos,
        total_discrepancias: totalDiscrepancias,
        valor_total_discrepancias: valorTotalDiscrepancias,
        percentual_discrepancias: Math.round(percentualDiscrepancias * 100) / 100,
        produtos_com_problema: totalDiscrepancias
      });
    }

    // Ordenar por valor de discrepâncias (maiores primeiro)
    analysis.sort((a, b) => b.valor_total_discrepancias - a.valor_total_discrepancias);
    
    console.log(`🔥 Análise CFOP concluída: ${analysis.length} CFOPs processados`);
    return analysis;
    
  } catch (error) {
    console.error('🔥 Erro na análise CFOP:', error);
    throw error;
  }
}

async function saveCFOPMetrics(analysis: CFOPAnalysis[]): Promise<void> {
  try {
    console.log('🔥 Salvando métricas CFOP...');
    
    // Limpar métricas anteriores
    const { error: deleteError } = await supabaseAdmin
      .from('cfop_metrics')
      .delete()
      .neq('id', -1); // Delete all

    if (deleteError) {
      console.log('🔥 Nota: Erro ao limpar métricas anteriores (normal se primeira vez)');
    }

    // Inserir novas métricas
    for (const cfopAnalysis of analysis) {
      const metrics = [
        {
          cfop: cfopAnalysis.cfop,
          valor: cfopAnalysis.total_produtos,
          user_id: 'anonymous'
        },
        {
          cfop: `${cfopAnalysis.cfop}_discrepancias`,
          valor: cfopAnalysis.valor_total_discrepancias,
          user_id: 'anonymous'
        }
      ];

      for (const metric of metrics) {
        const { error: insertError } = await supabaseAdmin
          .from('cfop_metrics')
          .insert(metric);

        if (insertError) {
          console.error(`🔥 Erro ao inserir métrica ${metric.cfop}:`, insertError);
        }
      }
    }
    
    console.log('🔥 Métricas CFOP salvas com sucesso');
    
  } catch (error) {
    console.error('🔥 Erro ao salvar métricas:', error);
    throw error;
  }
}

Deno.serve(async (req) => {
  console.log('🔥 analyze_cfop: Função iniciada');
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    if (req.method !== "POST" && req.method !== "GET") {
      return new Response("Use GET ou POST", { status: 405, headers: corsHeaders })
    }

    // Realizar análise CFOP
    const analysis = await analyzeCFOPData();
    
    if (analysis.length === 0) {
      return new Response(JSON.stringify({
        message: 'Nenhum dado com CFOP encontrado',
        dica: 'Faça upload de arquivos Excel com coluna CFOP primeiro'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Salvar métricas no banco
    await saveCFOPMetrics(analysis);

    // Calcular totais gerais
    const totals = {
      total_cfops: analysis.length,
      total_produtos: analysis.reduce((sum, a) => sum + a.total_produtos, 0),
      total_discrepancias: analysis.reduce((sum, a) => sum + a.total_discrepancias, 0),
      valor_total_discrepancias: analysis.reduce((sum, a) => sum + a.valor_total_discrepancias, 0)
    };

    console.log('🔥 Análise CFOP concluída com sucesso');

    return new Response(JSON.stringify({ 
      message: 'Análise CFOP realizada com sucesso',
      totals,
      analysis: analysis.slice(0, 10), // Top 10 CFOPs com mais problemas
      observacao: analysis.length > 10 ? `... e mais ${analysis.length - 10} CFOPs analisados` : ''
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    })
    
  } catch (error) {
    console.error('🔥 Erro na análise CFOP:', error)
    return new Response(JSON.stringify({
      error: 'Erro na análise CFOP',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
}) 