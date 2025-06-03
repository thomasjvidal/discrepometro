// /supabase/functions/upload_xlsx/index.ts

import { serve } from "https://deno.land/std@0.170.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const user_id = formData.get("user_id") as string;

    if (!file || !user_id) {
      return new Response("Arquivo ou user_id ausente", { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(firstSheet);

    const rows = [];
    for (const row of data) {
      const cfop = String(row["cfop"]).trim();
      const valor = parseFloat(String(row["valor"]).trim());
      if (!cfop || isNaN(valor)) continue;

      rows.push({ user_id, cfop, valor });
    }

    if (rows.length === 0) {
      return new Response("Nenhum dado válido encontrado.", { status: 400 });
    }

    const { error } = await supabase.from("cfop_metrics").insert(rows);
    if (error) {
      console.error("Erro ao inserir no banco:", error);
      return new Response(JSON.stringify({ error }), { status: 500 });
    }

    return new Response(JSON.stringify({ status: "ok", dados_processados: rows }), { status: 200 });

  } catch (err) {
    console.error("Erro interno:", err);
    return new Response("Erro interno no servidor", { status: 500 });
  }
});
