#!/usr/bin/env python3
"""
Script para verificar dados na tabela analise_discrepancia
"""

from supabase import create_client
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

# Configurações do Supabase
SUPABASE_URL = "https://hvjjcegcdivumprqviug.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2ampjZWdjZGl2dW1wcnF2aXVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2Nzg1MDAsImV4cCI6MjA2MzI1NDUwMH0.nerS1VvC5ebHOyHrtTMwrzdpCkAWpRpfvlvdlSspiG4"

def verificar_dados():
    """Verificar quantos dados existem na tabela"""
    try:
        # Conectar ao Supabase
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        print("🔍 VERIFICANDO DADOS NA TABELA analise_discrepancia...")
        
        # Buscar todos os dados
        response = supabase.table('analise_discrepancia').select('*').execute()
        
        if response.data:
            print(f"✅ ENCONTRADOS {len(response.data)} REGISTROS!")
            
            # Mostrar os primeiros 3 registros como exemplo
            print("\n📋 EXEMPLOS DOS DADOS:")
            for i, registro in enumerate(response.data[:3]):
                print(f"\n{i+1}. Produto: {registro.get('produto', 'N/A')}")
                print(f"   Código: {registro.get('codigo', 'N/A')}")
                print(f"   Tipo: {registro.get('discrepancia_tipo', 'N/A')}")
                print(f"   Valor Discrepância: {registro.get('discrepancia_valor', 0)}")
                print(f"   Data: {registro.get('created_at', 'N/A')}")
                
        else:
            print("❌ NENHUM DADO ENCONTRADO!")
            print("💡 Você precisa executar o processamento Python primeiro.")
            print("🚀 Execute: python3 discrepometro_final.py")
            
    except Exception as e:
        print(f"❌ ERRO AO VERIFICAR DADOS: {e}")
        print("💡 Verifique se o Supabase está configurado corretamente.")

if __name__ == "__main__":
    verificar_dados() 