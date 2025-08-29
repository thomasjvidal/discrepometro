#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
API FastAPI para o Discrepômetro
================================

API simples e focada para análise de discrepâncias fiscais.
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil
from typing import List
from datetime import datetime
import json

# Importar módulos do sistema
from core.discrepancia import calcular_discrepancias, gerar_relatorio_discrepancias
from readers.planilha_reader import get_top10_produtos
from readers.pdf_reader import extrair_estoque_por_produto

# Configurar FastAPI
app = FastAPI(
    title="Discrepômetro API",
    description="API para análise de discrepâncias fiscais",
    version="1.0.0"
)

# Configurar CORS para permitir frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configurações
UPLOAD_DIR = "uploads"
RESULTADOS_DIR = "resultados"
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

# Criar diretórios necessários
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(RESULTADOS_DIR, exist_ok=True)

@app.get("/")
async def root():
    """Endpoint raiz com informações da API."""
    return {
        "message": "Discrepômetro API - Análise de Discrepâncias Fiscais",
        "version": "1.0.0",
        "status": "online"
    }

@app.get("/status")
async def status():
    """Verifica status do servidor."""
    return {
        "status": "online",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }

@app.post("/process_files")
async def process_files(
    files: List[UploadFile] = File(...),
    max_produtos: int = Form(10),
    tolerancia: float = Form(1.0)
):
    """
    Processa arquivos para análise de discrepâncias.
    
    Args:
        files: Lista de arquivos (planilha Excel + 2 PDFs de inventário)
        max_produtos: Número máximo de produtos para analisar
        tolerancia: Tolerância para discrepâncias
    
    Returns:
        Resultado da análise com discrepâncias calculadas
    """
    try:
        print(f"🐍 Processando {len(files)} arquivos...")
        
        # Salvar arquivos temporariamente
        arquivos_salvos = []
        planilha_path = None
        pdf_inicial_path = None
        pdf_final_path = None
        
        for file in files:
            if file.size > MAX_FILE_SIZE:
                raise HTTPException(status_code=400, detail=f"Arquivo {file.filename} muito grande")
            
            # Salvar arquivo
            file_path = os.path.join(UPLOAD_DIR, file.filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            arquivos_salvos.append(file_path)
            
            # Identificar tipo de arquivo
            if file.filename.lower().endswith(('.xlsx', '.xls')):
                planilha_path = file_path
            elif file.filename.lower().endswith('.pdf'):
                if '2023' in file.filename or 'inicial' in file.filename.lower():
                    pdf_inicial_path = file_path
                elif '2024' in file.filename or 'final' in file.filename.lower():
                    pdf_final_path = file_path
        
        # Validar arquivos necessários
        if not planilha_path:
            raise HTTPException(status_code=400, detail="Planilha de CFOPs não encontrada")
        
        if not pdf_inicial_path or not pdf_final_path:
            raise HTTPException(status_code=400, detail="PDFs de inventário inicial e final necessários")
        
        print(f"📊 Planilha: {planilha_path}")
        print(f"📄 PDF Inicial: {pdf_inicial_path}")
        print(f"📄 PDF Final: {pdf_final_path}")
        
        # 1. Extrair top produtos da planilha
        print("🔍 Extraindo produtos mais vendidos...")
        produtos_top = get_top10_produtos(planilha_path, max_produtos=max_produtos)
        print(f"✅ Encontrados {len(produtos_top)} produtos")
        
        # 2. Processar inventários para cada produto
        print("📄 Processando inventários...")
        produtos_processados = []
        
        for i, produto in enumerate(produtos_top, 1):
            descricao = produto['descricao']
            print(f"🔍 Produto {i}/{len(produtos_top)}: {descricao}")
            
            try:
                # Buscar estoque inicial
                estoque_inicial = extrair_estoque_por_produto(pdf_inicial_path, descricao)
                
                # Buscar estoque final
                estoque_final = extrair_estoque_por_produto(pdf_final_path, descricao)
                
                produto_processado = {
                    **produto,
                    'estoque_inicial': estoque_inicial,
                    'estoque_final': estoque_final
                }
                
                produtos_processados.append(produto_processado)
                print(f"   ✅ Estoque inicial: {estoque_inicial}, Final: {estoque_final}")
                
            except Exception as e:
                print(f"   ⚠️ Erro ao processar {descricao}: {str(e)}")
                produto_processado = {
                    **produto,
                    'estoque_inicial': 0,
                    'estoque_final': 0
                }
                produtos_processados.append(produto_processado)
        
        # 3. Calcular discrepâncias
        print("⚖️ Calculando discrepâncias...")
        resultados = calcular_discrepancias(produtos_processados, tolerancia=tolerancia)
        
        # 4. Gerar relatório
        relatorio = gerar_relatorio_discrepancias(resultados)
        
        # 5. Salvar resultados
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        nome_arquivo = f'analise_discrepometro_{timestamp}.json'
        caminho_resultado = os.path.join(RESULTADOS_DIR, nome_arquivo)
        
        resultado_completo = {
            'metadata': {
                'timestamp': datetime.now().isoformat(),
                'versao': '1.0.0',
                'total_produtos': len(resultados),
                'produtos_ok': len([r for r in resultados if r['status'] == 'OK']),
                'produtos_erro': len([r for r in resultados if r['status'] == 'ERRO']),
                'tolerancia': tolerancia,
                'max_produtos': max_produtos
            },
            'arquivos_processados': {
                'planilha': os.path.basename(planilha_path),
                'pdf_inicial': os.path.basename(pdf_inicial_path),
                'pdf_final': os.path.basename(pdf_final_path)
            },
            'relatorio': relatorio,
            'resultados': resultados
        }
        
        with open(caminho_resultado, 'w', encoding='utf-8') as f:
            json.dump(resultado_completo, f, ensure_ascii=False, indent=2)
        
        print(f"✅ Resultado salvo em: {caminho_resultado}")
        
        # Limpar arquivos temporários
        for arquivo in arquivos_salvos:
            try:
                os.remove(arquivo)
            except:
                pass
        
        return {
            "success": True,
            "message": "Análise concluída com sucesso",
            "data": resultado_completo,
            "arquivo_resultado": nome_arquivo,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"❌ Erro no processamento: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

@app.get("/get_results/{filename}")
async def get_results(filename: str):
    """Recupera resultados de uma análise específica."""
    try:
        file_path = os.path.join(RESULTADOS_DIR, filename)
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Arquivo de resultados não encontrado")
        
        with open(file_path, 'r', encoding='utf-8') as f:
            resultados = json.load(f)
        
        return {
            "success": True,
            "data": resultados,
            "filename": filename
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao ler resultados: {str(e)}")

@app.get("/list_results")
async def list_results():
    """Lista todos os resultados disponíveis."""
    try:
        arquivos = []
        for filename in os.listdir(RESULTADOS_DIR):
            if filename.endswith('.json'):
                file_path = os.path.join(RESULTADOS_DIR, filename)
                stat = os.stat(file_path)
                arquivos.append({
                    "filename": filename,
                    "size": stat.st_size,
                    "created": datetime.fromtimestamp(stat.st_ctime).isoformat(),
                    "modified": datetime.fromtimestamp(stat.st_mtime).isoformat()
                })
        
        # Ordenar por data de modificação (mais recente primeiro)
        arquivos.sort(key=lambda x: x['modified'], reverse=True)
        
        return {
            "success": True,
            "total_files": len(arquivos),
            "files": arquivos
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao listar resultados: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    print("🚀 Iniciando API Discrepômetro...")
    print("📊 Endpoints disponíveis:")
    print("   - GET  / - Informações da API")
    print("   - GET  /status - Status do servidor")
    print("   - POST /process_files - Processar arquivos")
    print("   - GET  /get_results/{filename} - Recuperar resultados")
    print("   - GET  /list_results - Listar todos os resultados")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
