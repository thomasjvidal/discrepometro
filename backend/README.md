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

### 4. Iniciar a API
- **Servidor**: Local na porta padrão
- **Documentação**: Disponível na rota /docs

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
2. **Extração de Dados**: Produtos mais vendidos da planilha
3. **Processamento de PDFs**: Busca estoque inicial e final de cada produto
4. **Cálculo de Diferenças**: Comparação entre períodos
5. **Relatório**: Resultados com classificação automática

## 🔧 Endpoints da API

- `POST /process_files` - Processa arquivos para análise
- `GET /get_results/{filename}` - Recupera resultados
- `GET /list_results` - Lista análises disponíveis



## 🎯 Foco do Sistema

- ✅ **Simplicidade**: Interface clara e objetiva
- ✅ **Performance**: Processamento otimizado de dados
- ✅ **Confiabilidade**: Leitura precisa de arquivos
- ✅ **Integração**: API REST para frontend

## 🔍 Para Mais Informações

- Execute `python test_simple.py` para verificar funcionamento
- Acesse a rota /docs para documentação da API
- Consulte os logs do servidor para detalhes do processamento
