# 🚀 DISCREPÔMETRO - Análise Fiscal Inteligente

Sistema automatizado para análise de discrepâncias de estoque com base em planilhas de vendas e inventários em PDF.

## 📋 Funcionalidades

- **Leitura automática** de planilhas CSV/Excel com milhões de linhas
- **Filtragem inteligente** de operações de venda
- **Identificação automática** dos 10 produtos mais vendidos
- **Processamento de PDFs** de inventário com detecção automática de anos
- **Cálculo preciso** de discrepâncias de estoque
- **Classificação automática** em OK/ALERTA/CRÍTICO
- **Interface web moderna** para upload e análise

## 🏗️ Arquitetura

```
discrepometro/
├── frontend/           # Interface React/TypeScript
├── backend/            # Backend Python + Node.js
│   ├── core/          # Lógica principal do discrepômetro
│   ├── readers/       # Leitura de planilhas e PDFs
│   ├── server/        # Servidor Node.js para API
│   └── utils/         # Utilitários Python
├── database/          # Banco de dados e funções
└── docs/              # Documentação
```

## ⚙️ Como Funciona

### 1. **Leitura da Planilha**
- Carrega arquivos CSV/Excel
- Filtra operações de venda
- Agrupa por produto e soma quantidades
- Identifica os produtos mais vendidos

### 2. **Processamento de PDFs**
- Detecta automaticamente o ano do inventário
- Processa inventários em ordem cronológica
- Extrai tabelas de estoque
- Busca produtos nos inventários

### 3. **Cálculo de Discrepâncias**
- Compara estoques entre períodos
- Calcula diferenças baseadas nas vendas
- Classificação automática dos resultados

## 🚀 Instalação

### Pré-requisitos
- Python 3.9+
- Node.js 18+
- npm ou yarn

### Backend Python
```bash
cd backend
pip install -r requirements.txt
```

### Backend Node.js
```bash
cd backend
npm install
npm start
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📁 Estrutura de Arquivos

### Planilha de Vendas
- **Formato**: CSV ou Excel
- **Colunas obrigatórias**: `Data`, `Produto`, `Operação`, `Quantidade`, `Valor`

### PDFs de Inventário
- **Formato**: PDF com tabelas
- **Colunas**: `Produto`, `Quantidade`, `Valor Total`

## 🔧 Uso

### Via Interface Web
1. Acesse a tela "Analysis"
2. Faça upload da planilha de vendas
3. Faça upload dos 2 PDFs de inventário
4. Aguarde a análise automática
5. Visualize os resultados



## 🛠️ Tecnologias

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend Python**: Pandas, PDFPlumber, FastAPI
- **Backend Node.js**: Express, Multer, CORS
- **Banco de Dados**: PostgreSQL
- **Deploy**: Plataformas cloud modernas

## 📝 Licença

MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.





---

**Desenvolvido com ❤️ pela equipe Discrepômetro**
