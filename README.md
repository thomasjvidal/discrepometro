# 📊 Discrepômetro – Análise Fiscal Inteligente

## 📍 Contexto

O **discrepômetro** é um módulo que cruza dados de **vendas (planilhas CSV/Excel)** com dados de **estoque (inventários em PDF)** para identificar discrepâncias entre **o que foi vendido** e **o que deveria restar em estoque**.

Ele só executa sua rotina completa na tela **`analysis`**.

---

## 🔎 Fluxo de Execução

### **1. Leitura da Planilha**

* Carrega arquivos CSV/Excel (mesmo com milhões de linhas).
* Filtra **apenas CFOPs de venda**:

  * `5101`, `5102`, `6101`, `6102`, `5405`, `6405`
* Agrupa por produto e soma as quantidades.
* Identifica automaticamente os **10 produtos mais vendidos**.

---

### **2. Identificação dos Inventários (PDFs)**

* Detecta automaticamente **quais arquivos PDF são inventários**.
* Pelo nome, identifica o ano do inventário (ex.: `2023`, `2024`).

  * Sempre começa pelo mais antigo (ex.: `2023`) e depois lê o mais recente (ex.: `2024`).
  * Deve ser tolerante a datas aleatórias e sequenciais (não só 2023 → 2024).
* Extrai tabelas de estoque dos PDFs.
* Busca apenas os produtos encontrados na etapa anterior (top 10 vendidos).
* Extrai **quantidade** e, se disponível, **valor final**.

---

### **3. Cálculo das Discrepâncias**

* Fórmula base:

  ```
  Discrepância = Estoque_AnoMaisRecente - Estoque_AnoAnterior - Vendas
  ```
* Classificação:

  * **OK** → quando a discrepância é nula ou dentro da margem.
  * **ALERTA** → quando existe diferença significativa.
  * **CRÍTICO** → discrepância grave, estoque não bate.

---

## ✅ Resumo de Lógica (Checklist)

* [x] Lê planilha (CSV/Excel).
* [x] Filtra CFOPs de venda.
* [x] Agrupa e encontra top 10 produtos mais vendidos.
* [x] Detecta e processa inventários (PDFs).
* [x] Extrai quantidade/valor dos produtos nos inventários.
* [x] Compara estoque e vendas.
* [x] Classifica status final (**OK/ALERTA/CRÍTICO**).

---

## 🚦 Observação Importante

* O software **só executa toda essa rotina na tela `analysis`**.
* Esta é a **lógica oficial de pensamento do discrepômetro**.

---

## 🏗️ Estrutura do Projeto (Organizada)

```
discrepometro/
├── 📁 frontend/              # Interface React/TypeScript
│   ├── src/                  # Código fonte React
│   ├── public/               # Arquivos estáticos
│   ├── package.json          # Dependências frontend
│   └── vite.config.ts        # Configuração Vite
├── 📁 backend/               # Lógica Python + Servidor Node.js
│   ├── core/                 # Lógica principal Python
│   │   ├── discrepancia.py   # Cálculo de discrepâncias
│   │   └── utils.py          # Utilitários
│   ├── readers/              # Leitores de arquivos Python
│   │   ├── pdf_reader.py     # Leitor de PDFs
│   │   └── planilha_reader.py # Leitor de planilhas
│   ├── main.py               # Script Python principal
│   ├── server.cjs            # Servidor Express.js
│   ├── requirements.txt      # Dependências Python
│   ├── package.json          # Dependências Node.js
│   ├── resultados/           # Pasta de resultados
│   └── venv/                 # Ambiente virtual Python
├── 📁 supabase/              # Configurações do banco
├── package.json               # Gerenciador principal
└── README.md                  # Este arquivo
```

---

## 🚀 Como Executar

### **Instalação Completa (Recomendado)**
```bash
npm run install:all
```

### **Executar Tudo (Frontend + Backend)**
```bash
npm run dev
```

### **Executar Apenas Backend**
```bash
npm run backend:dev
```

### **Executar Apenas Frontend**
```bash
npm run frontend:dev
```

---

## 📋 Dependências

### **Backend (Python)**
- `pandas` - Processamento de dados
- `pdfplumber` - Leitura de PDFs
- `openpyxl` - Leitura de Excel

### **Backend (Node.js)**
- `express` - Servidor web
- `multer` - Upload de arquivos
- `cors` - Cross-origin requests
- `pdf-parse` - Processamento de PDFs
- `xlsx` - Processamento de Excel

### **Frontend (React)**
- `react` - Framework principal
- `react-router-dom` - Roteamento
- `tailwindcss` - Estilização

---

## 🔧 Configuração

1. **Instalar dependências:** `npm run install:all`
2. **Configurar ambiente Python** (se necessário)
3. **Executar:** `npm run dev`
4. **Acessar:** Frontend na porta 5173, Backend na porta 3001

---

## 📊 Funcionalidades

- **Upload de arquivos** (Excel/CSV + PDFs)
- **Processamento automático** de dados fiscais
- **Identificação inteligente** de inventários
- **Cálculo automático** de discrepâncias
- **Interface visual** para resultados
- **Exportação** de relatórios

---

## 🎯 Casos de Uso

- **Auditoria fiscal** de empresas
- **Controle de estoque** automatizado
- **Identificação** de inconsistências contábeis
- **Relatórios** para órgãos fiscais
- **Análise** de movimentações comerciais

---

## 🚀 Desenvolvimento

### **Estrutura Modular**
- **Frontend:** Interface React independente
- **Backend:** API Node.js + Lógica Python
- **Separação clara** de responsabilidades

### **Scripts Disponíveis**
- `npm run dev` - Desenvolvimento completo
- `npm run backend:dev` - Apenas backend
- `npm run frontend:dev` - Apenas frontend
- `npm run install:all` - Instalação completa
