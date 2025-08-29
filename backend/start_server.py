#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para iniciar o servidor Python do Discrepômetro
===================================================

Uso: python start_server.py
"""

import os
import sys
import subprocess

def main():
    """Inicia o servidor Python."""
    print("🚀 Iniciando servidor Python do Discrepômetro...")
    
    # Verificar se estamos no diretório correto
    if not os.path.exists('api/main.py'):
        print("❌ Erro: Execute este script do diretório 'backend'")
        print("   cd backend")
        print("   python start_server.py")
        return 1
    
    # Verificar dependências
    try:
        import fastapi
        import uvicorn
        print("✅ Dependências Python encontradas")
    except ImportError as e:
        print(f"❌ Dependência não encontrada: {e}")
        print("💡 Instale as dependências com:")
        print("   pip install -r requirements.txt")
        return 1
    
    # Iniciar servidor
    print("🌐 Servidor iniciando em http://localhost:8000")
    print("📊 Documentação da API: http://localhost:8000/docs")
    print("🔍 Para parar: Ctrl+C")
    print("-" * 50)
    
    try:
        subprocess.run([
            sys.executable, "-m", "uvicorn", 
            "api.main:app", 
            "--host", "0.0.0.0", 
            "--port", "8000", 
            "--reload"
        ])
    except KeyboardInterrupt:
        print("\n🛑 Servidor parado pelo usuário")
    except Exception as e:
        print(f"❌ Erro ao iniciar servidor: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
