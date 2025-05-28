import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import * as XLSX from "https://esm.sh/xlsx@0.18.5"

console.log("Função upload_xlsx iniciada")

serve(async (req) => {
  try {
    console.log("Nova requisição recebida:", {
      method: req.method,
      contentType: req.headers.get("content-type"),
      url: req.url
    })

    // Validar método
    if (req.method !== "POST") {
      return new Response("Método não permitido", { status: 405 })
    }

    const contentType = req.headers.get("content-type") || ""
    if (!contentType.includes("multipart/form-data")) {
      return new Response("Envie arquivo multipart/form-data", { status: 400 })
    }

    // Supabase config
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // FormData
    const formData = await req.formData()
    const file = formData.get("file") as File
    const user_id = formData.get("user_id") as string

    console.log("Dados do formulário recebidos:", {
      hasFile: !!file,
      fileName: file?.name,
      userId: user_id
    })

    if (!file || !user_id) {
      return new Response("Arquivo XLSX ou user_id ausente", { status: 400 })
    }

    // XLSX -> ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: "array" })
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
    const jsonData = XLSX.utils.sheet_to_json(firstSheet)

    console.log("Dados do XLSX:", jsonData)

    // Montar dados para inserir
    const rows: { user_id: string; cfop: string; valor: number }[] = []

    for (const row of jsonData) {
      const cfop = String(row["CFOP"] || row["cfop"] || "")
      const valor = Number(row["VALOR"] || row["valor"] || 0)

      if (!cfop || isNaN(valor)) continue

      rows.push({
        user_id,
        cfop: cfop.trim(),
        valor: valor,
      })
    }

    console.log("Dados a serem inseridos (rows):", rows)

    if (rows.length === 0) {
      return new Response("Nenhum dado válido para inserir", { status: 400 })
    }

    // Inserir no banco
    console.log("Iniciando inserção no banco...")
    const { error } = await supabase.from("cfop_metrics").insert(rows)

    if (error) {
      console.error("Erro ao inserir:", error)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      })
    }

    return new Response(JSON.stringify({ status: "sucesso", rows }), {
      status: 200,
    })
  } catch (err) {
    console.error("Erro interno:", err)
    return new Response("Erro interno do servidor", { status: 500 })
  }
}) 