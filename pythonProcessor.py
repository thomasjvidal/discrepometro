from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import tempfile
import os
import subprocess
import json
from typing import List
import shutil

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
    
    # Criar diretório temporário
    with tempfile.TemporaryDirectory() as temp_dir:
        try:
            # Salvar arquivo temporariamente
            temp_file_path = os.path.join(temp_dir, file.filename)
            with open(temp_file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            # Executar script Python no diretório temporário
            script_path = os.path.join(os.getcwd(), "scripts", "discrepometro_completo.py")
            
            # Mudar para o diretório temporário e executar
            old_cwd = os.getcwd()
            os.chdir(temp_dir)
            
            try:
                # Executar o script
                result = subprocess.run(
                    ["python", script_path],
                    capture_output=True,
                    text=True,
                    timeout=300  # 5 minutos
                )
                
                # Voltar ao diretório original
                os.chdir(old_cwd)
                
                if result.returncode == 0:
                    return {
                        "success": True,
                        "message": "Arquivo processado com sucesso",
                        "output": result.stdout,
                        "errors": result.stderr if result.stderr else None,
                        "timestamp": "2024-01-20T10:00:00Z"
                    }
                else:
                    raise HTTPException(
                        status_code=500,
                        detail=f"Erro no processamento: {result.stderr}"
                    )
                    
            except subprocess.TimeoutExpired:
                os.chdir(old_cwd)
                raise HTTPException(status_code=500, detail="Timeout no processamento")
                
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

@app.post("/process_files")
async def process_files(files: List[UploadFile] = File(...)):
    """Processa múltiplos arquivos"""
    
    if not files:
        raise HTTPException(status_code=400, detail="Nenhum arquivo enviado")
    
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
    
    # Criar diretório temporário
    with tempfile.TemporaryDirectory() as temp_dir:
        try:
            # Salvar todos os arquivos
            saved_files = []
            for file in files:
                temp_file_path = os.path.join(temp_dir, file.filename)
                with open(temp_file_path, "wb") as buffer:
                    shutil.copyfileobj(file.file, buffer)
                saved_files.append(file.filename)
            
            # Executar script Python
            script_path = os.path.join(os.getcwd(), "scripts", "discrepometro_completo.py")
            old_cwd = os.getcwd()
            os.chdir(temp_dir)
            
            try:
                result = subprocess.run(
                    ["python", script_path],
                    capture_output=True,
                    text=True,
                    timeout=300
                )
                
                os.chdir(old_cwd)
                
                if result.returncode == 0:
                    return {
                        "success": True,
                        "message": f"Processados {len(files)} arquivos com sucesso",
                        "files": saved_files,
                        "output": result.stdout,
                        "errors": result.stderr if result.stderr else None,
                        "timestamp": "2024-01-20T10:00:00Z"
                    }
                else:
                    raise HTTPException(
                        status_code=500,
                        detail=f"Erro no processamento: {result.stderr}"
                    )
                    
            except subprocess.TimeoutExpired:
                os.chdir(old_cwd)
                raise HTTPException(status_code=500, detail="Timeout no processamento")
                
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True) 