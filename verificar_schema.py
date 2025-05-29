import os
from supabase import create_client

# Configurar variáveis de ambiente
os.environ['SUPABASE_URL'] = 'https://hvjjcegcdivumprqviug.supabase.co'
os.environ['SUPABASE_ANON_KEY'] = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2ampjZWdjZGl2dW1wcnF2aXVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2Nzg1MDAsImV4cCI6MjA2MzI1NDUwMH0.nerS1VvC5ebHOyHrtTMwrzdpCkAWpRpfvlvdlSspiG4'

def verificar_schema():
    """Verifica o schema da tabela analise_discrepancia"""
    supabase = create_client(
        os.environ['SUPABASE_URL'], 
        os.environ['SUPABASE_ANON_KEY']
    )
    
    try:
        # Buscar um registro para ver as colunas
        result = supabase.table('analise_discrepancia').select('*').limit(1).execute()
        
        if result.data and len(result.data) > 0:
            print("🔍 COLUNAS EXISTENTES NA TABELA:")
            for coluna in result.data[0].keys():
                print(f"   • {coluna}")
        else:
            print("⚠️ Tabela vazia, tentando inserir um registro de teste...")
            
            # Tentar com diferentes tipos de discrepância
            tipos_validos = [
                'Sem Discrepância',
                'Estoque Excedente', 
                'Estoque Faltante',
                'Produto Não Inventariado'
            ]
            
            for tipo in tipos_validos:
                test_data = {
                    'codigo': 'TEST001',
                    'produto': 'PRODUTO TESTE',
                    'discrepancia_valor': 10,
                    'discrepancia_tipo': tipo
                }
                
                try:
                    result = supabase.table('analise_discrepancia').insert(test_data).execute()
                    print(f"✅ Inserção bem-sucedida com tipo: {tipo}")
                    
                    # Buscar novamente para ver todas as colunas
                    result = supabase.table('analise_discrepancia').select('*').limit(1).execute()
                    if result.data:
                        print("🔍 COLUNAS EXISTENTES NA TABELA:")
                        for coluna in result.data[0].keys():
                            print(f"   • {coluna}")
                    break
                        
                except Exception as e:
                    print(f"❌ Erro com tipo '{tipo}': {e}")
                    continue
                
    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__":
    verificar_schema() 