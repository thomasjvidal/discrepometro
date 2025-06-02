from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import tempfile
import os
import subprocess
import json
from typing import List
import shutil
import asyncio
import signal

app = FastAPI(title="Discrepômetro API", version="1.0.0")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"status": "online", "message": "Discrepômetro API funcionando"}

@app.get("/status")
async def status():
    return {"status": "online"}

@app.post("/process_file")
async def process_file(file: UploadFile = File(...)):
    """Processa um único arquivo usando o script discrepometro_completo.py"""
    
    if not file.filename:
        raise HTTPException(status_code=400, detail="Nome do arquivo é obrigatório")
    
    # Verificar extensão do arquivo
    allowed_extensions = ['.pdf', '.xlsx', '.xls', '.xlsb', '.csv']
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400, 
            detail=f"Formato não suportado: {file_ext}. Use: {', '.join(allowed_extensions)}"
        )
    
    # Verificar tamanho do arquivo (limite aumentado)
    file_size = 0
    content = await file.read()
    file_size = len(content)
    await file.seek(0)  # Reset file pointer
    
    # Limite de 500MB para arquivos únicos
    if file_size > 500 * 1024 * 1024:  
        raise HTTPException(
            status_code=413, 
            detail=f"Arquivo muito grande: {file_size / 1024 / 1024:.1f}MB. Limite: 500MB"
        )
    
    # Criar diretório temporário
    with tempfile.TemporaryDirectory() as temp_dir:
        try:
            # Salvar arquivo temporariamente
            temp_file_path = os.path.join(temp_dir, file.filename)
            with open(temp_file_path, "wb") as buffer:
                buffer.write(content)
            
            # Executar script Python no diretório temporário
            script_path = os.path.join(os.getcwd(), "scripts", "discrepometro_completo.py")
            
            # Mudar para o diretório temporário e executar
            old_cwd = os.getcwd()
            os.chdir(temp_dir)
            
            try:
                print(f"🔄 Processando arquivo: {file.filename} ({file_size / 1024 / 1024:.1f}MB)")
                
                # Timeout aumentado para arquivos grandes (15 minutos)
                timeout = 900 if file_size > 100 * 1024 * 1024 else 300
                
                # Executar o script
                result = subprocess.run(
                    ["python", script_path],
                    capture_output=True,
                    text=True,
                    timeout=timeout,
                    cwd=temp_dir
                )
                
                # Voltar ao diretório original
                os.chdir(old_cwd)
                
                if result.returncode == 0:
                    print(f"✅ Processamento concluído: {file.filename}")
                    return {
                        "success": True,
                        "message": f"Arquivo {file.filename} processado com sucesso",
                        "output": result.stdout,
                        "errors": result.stderr if result.stderr else None,
                        "file_size_mb": round(file_size / 1024 / 1024, 2),
                        "timestamp": "2024-01-20T10:00:00Z"
                    }
                else:
                    print(f"❌ Erro no processamento: {file.filename}")
                    print(f"Stderr: {result.stderr}")
                    raise HTTPException(
                        status_code=500,
                        detail=f"Erro no processamento: {result.stderr}"
                    )
                    
            except subprocess.TimeoutExpired:
                os.chdir(old_cwd)
                print(f"⏰ Timeout no processamento: {file.filename}")
                raise HTTPException(
                    status_code=504, 
                    detail=f"Timeout no processamento após {timeout}s. Arquivo muito grande ou complexo."
                )
                
        except Exception as e:
            print(f"💥 Erro interno: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

@app.post("/process_files")
async def process_files(files: List[UploadFile] = File(...)):
    """Processa múltiplos arquivos"""
    
    if not files:
        raise HTTPException(status_code=400, detail="Nenhum arquivo enviado")
    
    total_size = 0
    
    # Verificar todos os arquivos primeiro
    for file in files:
        if not file.filename:
            raise HTTPException(status_code=400, detail="Nome do arquivo é obrigatório")
        
        file_ext = os.path.splitext(file.filename)[1].lower()
        allowed_extensions = ['.pdf', '.xlsx', '.xls', '.xlsb', '.csv']
        
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Formato não suportado: {file.filename}. Use: {', '.join(allowed_extensions)}"
            )
        
        # Ler conteúdo para verificar tamanho
        content = await file.read()
        await file.seek(0)
        total_size += len(content)
    
    # Limite total de 1GB para múltiplos arquivos
    if total_size > 1024 * 1024 * 1024:  
        raise HTTPException(
            status_code=413, 
            detail=f"Total muito grande: {total_size / 1024 / 1024:.1f}MB. Limite: 1GB"
        )
    
    # Criar diretório temporário
    with tempfile.TemporaryDirectory() as temp_dir:
        try:
            # Salvar todos os arquivos
            saved_files = []
            for file in files:
                content = await file.read()
                await file.seek(0)
                
                temp_file_path = os.path.join(temp_dir, file.filename)
                with open(temp_file_path, "wb") as buffer:
                    buffer.write(content)
                saved_files.append({
                    "name": file.filename,
                    "size_mb": round(len(content) / 1024 / 1024, 2)
                })
            
            # Executar script Python
            script_path = os.path.join(os.getcwd(), "scripts", "discrepometro_completo.py")
            old_cwd = os.getcwd()
            os.chdir(temp_dir)
            
            try:
                print(f"🔄 Processando {len(files)} arquivos (Total: {total_size / 1024 / 1024:.1f}MB)")
                
                # Timeout baseado no tamanho total
                timeout = 1800 if total_size > 500 * 1024 * 1024 else 900  # 30min para > 500MB
                
                result = subprocess.run(
                    ["python", script_path],
                    capture_output=True,
                    text=True,
                    timeout=timeout,
                    cwd=temp_dir
                )
                
                os.chdir(old_cwd)
                
                if result.returncode == 0:
                    print(f"✅ Processamento concluído: {len(files)} arquivos")
                    return {
                        "success": True,
                        "message": f"Processados {len(files)} arquivos com sucesso",
                        "files": saved_files,
                        "total_size_mb": round(total_size / 1024 / 1024, 2),
                        "output": result.stdout,
                        "errors": result.stderr if result.stderr else None,
                        "timestamp": "2024-01-20T10:00:00Z"
                    }
                else:
                    print(f"❌ Erro no processamento de múltiplos arquivos")
                    print(f"Stderr: {result.stderr}")
                    raise HTTPException(
                        status_code=500,
                        detail=f"Erro no processamento: {result.stderr}"
                    )
                    
            except subprocess.TimeoutExpired:
                os.chdir(old_cwd)
                print(f"⏰ Timeout no processamento de múltiplos arquivos")
                raise HTTPException(
                    status_code=504, 
                    detail=f"Timeout no processamento após {timeout}s. Arquivos muito grandes."
                )
                
        except Exception as e:
            print(f"💥 Erro interno no processamento múltiplo: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True) 