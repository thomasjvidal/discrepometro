// Função de comparação inteligente entre PDFs e planilha .xlsx
import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";

serve(async (req) => {
  try {
    const formData = await req.formData();
    const filePDF2021 = formData.get("pdf_2021") as File;
    const filePDF2022 = formData.get("pdf_2022") as File;
    const filePlanilha = formData.get("planilha") as File;

    if (!filePDF2021 || !filePDF2022 || !filePlanilha) {
      return new Response("Arquivos ausentes", { status: 400 });
    }

    // Leitura dos PDFs (simulado por enquanto)
    const produtosPDF = {
      "MGR001": { nome: "Mouse Gamer RGB", estoque2021: 50, estoque2022: 58 },
      "TM002": { nome: "Teclado Mecânico", estoque2021: 30, estoque2022: 20 },
      "MON24": { nome: "Monitor 24\"", estoque2021: 15, estoque2022: 3 }
    };

    // Leitura da planilha
    const buffer = await filePlanilha.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    const resultado: any[] = [];

    for (const row of rows) {
      const codigo = String(row["código"] || row["Código"] || "").trim();
      const produto = String(row["produto"] || row["Produto"] || "").trim();
      const entrada = parseInt(String(row["entrada"] || row["Entradas"] || "0"));
      const saida = parseInt(String(row["saida"] || row["Saídas"] || "0"));

      if (!codigo || isNaN(entrada) || isNaN(saida)) continue;

      const dadosPDF = produtosPDF[codigo];
      const estoque_calculado = (dadosPDF?.estoque2021 || 0) + entrada - saida;
      const estoque_final = dadosPDF?.estoque2022 || 0;

      let discrepancia = "Sem Discrepância";
      if (estoque_calculado > estoque_final) discrepancia = "Venda sem Nota";
      else if (estoque_calculado < estoque_final) discrepancia = "Compra sem Nota";

      resultado.push({
        produto: dadosPDF?.nome || produto,
        codigo,
        entrada,
        saida,
        estoque_inicial: dadosPDF?.estoque2021 || 0,
        estoque_final,
        estoque_calculado,
        discrepancia
      });
    }

    return new Response(JSON.stringify(resultado), {
      headers: { "Content-Type": "application/json" },
      status: 200
    });

  } catch (err) {
    console.error("Erro:", err);
    return new Response("Erro interno", { status: 500 });
  }
}); 