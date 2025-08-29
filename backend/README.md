# 🐍 Discrepômetro - Análise de Discrepâncias Fiscais

Sistema Python para análise automática de discrepâncias fiscais através de planilhas Excel e PDFs de inventário.

## 🚀 Como Usar

### 1. Instalar Dependências
```bash
cd backend
pip install -r requirements.txt
```

### 2. Testar o Sistema
```bash
python test_simple.py
```

### 3. Iniciar a API
```bash
python start_server.py
```

### 4. Acessar a API
- **Servidor**: http://localhost:8000
- **Documentação**: http://localhost:8000/docs

## 📁 Estrutura do Projeto

```
backend/
├── api/
│   └── main.py              # API FastAPI
├── core/
│   ├── discrepancia.py      # Lógica de cálculo de discrepâncias
│   └── utils.py             # Utilitários
├── readers/
│   ├── planilha_reader.py   # Leitura de planilhas Excel
│   └── pdf_reader.py        # Leitura de PDFs de inventário
├── uploads/                  # Arquivos enviados
├── resultados/               # Resultados das análises
├── start_server.py           # Script para iniciar servidor
├── test_simple.py            # Teste básico do sistema
└── requirements.txt          # Dependências Python
```

## 📊 Como Funciona

1. **Upload de Arquivos**: Planilha Excel + 2 PDFs de inventário
2. **Extração de Dados**: Top N produtos mais vendidos da planilha
3. **Processamento de PDFs**: Busca estoque inicial e final de cada produto
4. **Cálculo de Discrepâncias**: Estoque esperado vs. estoque real
5. **Relatório**: Resultados com classificação e recomendações

## 🔧 Endpoints da API

- `POST /process_files` - Processa arquivos para análise
- `GET /get_results/{filename}` - Recupera resultados
- `GET /list_results` - Lista análises disponíveis

## 📝 Exemplo de Uso

```python
import requests

# Upload de arquivos
files = [
    ('files', open('planilha.xlsx', 'rb')),
    ('files', open('inventario_inicial.pdf', 'rb')),
    ('files', open('inventario_final.pdf', 'rb'))
]

data = {
    'max_produtos': 10,
    'tolerancia': 1.0
}

response = requests.post(
    'http://localhost:8000/process_files',
    files=files,
    data=data
)

print(response.json())
```

## 🎯 Foco do Sistema

- ✅ **Simplicidade**: Apenas o essencial para análise de discrepâncias
- ✅ **Performance**: Python otimizado para processamento de dados
- ✅ **Confiabilidade**: Bibliotecas maduras para Excel e PDF
- ✅ **Integração**: API REST para frontend React

## 🔍 Para Mais Informações

- Execute `python test_simple.py` para verificar funcionamento
- Acesse http://localhost:8000/docs para documentação da API
- Consulte os logs do servidor para detalhes do processamento
