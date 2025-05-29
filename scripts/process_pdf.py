import pdfplumber

def process_large_pdf(file_path):
    total_pages = 0

    with pdfplumber.open(file_path) as pdf:
        for i, page in enumerate(pdf.pages):
            text = page.extract_text()
            print(f"Página {i + 1}: {len(text or '')} caracteres")
            total_pages += 1
            # Aqui você pode salvar ou processar o texto como quiser

    print(f"Leitura finalizada. Total de páginas lidas: {total_pages}")

if __name__ == "__main__":
    process_large_pdf("documento_grande.pdf") 