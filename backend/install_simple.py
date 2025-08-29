#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Instalação Simples do Discrepômetro
===================================

Instala as dependências essenciais para o sistema funcionar.
"""

import subprocess
import sys

def install_dependencies():
    """Instala as dependências do requirements.txt."""
    print("📦 Instalando dependências...")
    
    try:
        subprocess.run([
            sys.executable, "-m", "pip", "install", "-r", "requirements.txt"
        ], check=True)
        print("✅ Dependências instaladas com sucesso!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Erro ao instalar dependências: {e}")
        return False

def main():
    """Função principal."""
    print("🚀 INSTALAÇÃO SIMPLES DO DISCREPÔMETRO")
    print("=" * 40)
    
    if install_dependencies():
        print("\n🎉 Instalação concluída!")
        print("\n📋 Próximos passos:")
        print("1. Testar o sistema: python test_simple.py")
        print("2. Iniciar API: python start_server.py")
        print("3. Acessar: http://localhost:8000")
        return 0
    else:
        print("\n❌ Instalação falhou!")
        return 1

if __name__ == "__main__":
    exit(main())
