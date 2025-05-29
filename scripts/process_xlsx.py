import pandas as pd

def process_large_excel(file_path):
    chunk_size = 10000  # número de linhas por vez
    total_rows = 0

    for chunk in pd.read_excel(file_path, sheet_name=0, chunksize=chunk_size, engine='openpyxl'):
        print(f"Lendo {len(chunk)} linhas...")
        total_rows += len(chunk)
        # Aqui você pode fazer algo com o chunk, como salvar no Supabase

    print(f"Leitura finalizada. Total de linhas lidas: {total_rows}")

if __name__ == "__main__":
    # Substitua pelo caminho real
    process_large_excel("planilha_grande.xlsx") 