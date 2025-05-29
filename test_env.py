import os
from supabase import create_client

# Configurar variáveis de ambiente para teste
os.environ['SUPABASE_URL'] = 'https://hvjjcegcdivumprqviug.supabase.co'
os.environ['SUPABASE_ANON_KEY'] = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2ampjZWdjZGl2dW1wcnF2aXVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2Nzg1MDAsImV4cCI6MjA2MzI1NDUwMH0.nerS1VvC5ebHOyHrtTMwrzdpCkAWpRpfvlvdlSspiG4'

def testar_conexao_supabase():
    """Testa a conexão com o Supabase"""
    print("🔗 Testando conexão com Supabase...")
    
    try:
        supabase = create_client(
            os.environ['SUPABASE_URL'], 
            os.environ['SUPABASE_ANON_KEY']
        )
        
        # Testar busca na tabela
        result = supabase.table('analise_discrepancia').select('*').limit(1).execute()
        
        print("✅ Conexão com Supabase estabelecida!")
        print(f"📊 Tabela 'analise_discrepancia' acessível")
        print(f"📋 Registros na tabela: {len(result.data) if result.data else 0}")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro na conexão: {e}")
        return False

if __name__ == "__main__":
    testar_conexao_supabase() 