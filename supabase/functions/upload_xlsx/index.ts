import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"
import * as XLSX from "https://esm.sh/xlsx@0.18.5";

Deno.serve(async (req) => {
  console.log('📊 upload_xlsx: Iniciando processamento Excel');
  
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
    const user_id = formData.get('user_id') as string;
    
    if (!file || !user_id) {
      return new Response(JSON.stringify({ error: 'Arquivo ou user_id ausente' }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`📊 Processando arquivo Excel: ${file.name} (${file.size} bytes)`);

    // Verificar se é realmente um arquivo Excel
    if (!file.name.toLowerCase().includes('.xlsx') && 
        !file.name.toLowerCase().includes('.xls') && 
        !file.name.toLowerCase().includes('.xlsb')) {
      return new Response(JSON.stringify({ 
        error: 'Arquivo deve ser Excel (.xlsx, .xls, .xlsb)' 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

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

    // Ler e processar o arquivo Excel
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(firstSheet);

    console.log(`📊 Dados extraídos: ${data.length} linhas`);

    const rows = [];
    for (const row of data) {
      const cfop = String(row["cfop"] || row["CFOP"] || "").trim();
      const valor = parseFloat(String(row["valor"] || row["Valor"] || "0").replace(',', '.'));
      
      if (!cfop || isNaN(valor)) continue;

      rows.push({ user_id, cfop, valor });
    }

    console.log(`📊 Dados válidos processados: ${rows.length} registros`);

    if (rows.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'Nenhum dado válido encontrado no arquivo Excel' 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Inserir no banco de dados
    const { error: dbError } = await supabase.from("cfop_metrics").insert(rows);
    if (dbError) {
      console.error("Erro ao inserir no banco:", dbError);
      return new Response(JSON.stringify({ error: dbError.message }), { 
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`✅ Excel processado com sucesso: ${rows.length} registros inseridos`);

    return new Response(JSON.stringify({ 
      status: "ok", 
      dados_processados: rows.length,
      message: "Excel processado com sucesso!"
    }), { 
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (err) {
    console.error("❌ Erro interno:", err);
    return new Response(JSON.stringify({ 
      error: 'Erro interno no servidor',
      details: err instanceof Error ? err.message : 'Erro desconhecido'
    }), { 
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
