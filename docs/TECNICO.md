# 📚 DOCUMENTAÇÃO TÉCNICA - DISCREPÔMETRO

## 🏗️ ARQUITETURA DO SISTEMA

### Visão Geral
O Discrepômetro é um sistema híbrido que combina:
- **Frontend React/TypeScript** para interface de usuário
- **Backend Python** para processamento de dados e cálculos
- **Backend Node.js** para API REST e upload de arquivos
- **Supabase** para persistência de dados

### Estrutura de Pastas
```
discrepometro/
├── frontend/                 # Interface React/TypeScript
│   ├── src/
│   │   ├── components/      # Componentes React reutilizáveis
│   │   ├── pages/          # Páginas da aplicação
│   │   ├── hooks/          # Hooks customizados
│   │   ├── services/       # Serviços de comunicação com API
│   │   └── utils/          # Utilitários e helpers
│   ├── package.json        # Dependências do frontend
│   └── vite.config.ts      # Configuração do Vite
├── backend/                 # Backend Python + Node.js
│   ├── core/               # Lógica principal do discrepômetro
│   │   ├── discrepancia.py # Cálculos de discrepância
│   │   ├── utils.py        # Utilitários Python
│   │   └── main.py         # Arquivo principal consolidado
│   ├── readers/            # Leitura de arquivos
│   │   ├── pdf_reader.py   # Processamento de PDFs
│   │   └── planilha_reader.py # Leitura de planilhas
│   ├── server/             # Servidor Node.js
│   │   └── server.js       # API REST
│   └── requirements.txt    # Dependências Python
├── supabase/               # Configurações do banco de dados
└── docs/                   # Documentação
```

## 🔄 FLUXO DE PROCESSAMENTO

### 1. Upload de Arquivos
```
Usuário → Frontend → Node.js API → Armazenamento temporário
```

### 2. Processamento Python
```
Arquivos → Python Core → Análise → Resultados
```

### 3. Exibição de Resultados
```
Resultados → Frontend → Interface do usuário
```

## 📊 LÓGICA DE CÁLCULO

### Fórmula Principal
```
Discrepância = Estoque_Final - Estoque_Inicial - Vendas
```

### Classificação de Status
- **OK**: |Discrepância| ≤ Tolerância
- **ALERTA**: Tolerância < |Discrepância| ≤ 10% das vendas
- **CRÍTICO**: |Discrepância| > 10% das vendas

### CFOPs de Venda Válidos
- 5101: Venda de produção própria
- 5102: Venda de mercadoria adquirida
- 6101: Venda de produção própria
- 6102: Venda de mercadoria adquirida
- 5405: Venda de mercadoria adquirida
- 6405: Venda de mercadoria adquirida

## 🔧 CONFIGURAÇÕES TÉCNICAS

### Frontend (React/TypeScript)
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: React Hooks
- **Routing**: React Router DOM

### Backend Python
- **Versão**: Python 3.9+
- **Dependências principais**:
  - pandas: Processamento de dados
  - pdfplumber: Leitura de PDFs
  - openpyxl: Leitura de Excel
  - fastapi: API (opcional)

### Backend Node.js
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Upload**: Multer
- **CORS**: Habilitado para desenvolvimento

### Banco de Dados
- **Supabase**: PostgreSQL como serviço
- **Tabelas principais**:
  - `analise_discrepancia`: Resultados das análises
  - `cfop_metrics`: Métricas por CFOP
  - `uploads`: Registro de uploads

## 🚀 DEPLOYMENT

### Frontend
- **Plataforma**: Vercel, Netlify, ou similar
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### Backend Python
- **Plataforma**: Railway, Heroku, ou similar
- **Requirements**: `requirements.txt`
- **Entry Point**: `backend/discrepometro.py`

### Backend Node.js
- **Plataforma**: Railway, Heroku, ou similar
- **Entry Point**: `backend/server/server.js`
- **Port**: Configurável via `PORT` environment variable

## 🔍 MONITORAMENTO E LOGS

### Logs Python
- Timestamp automático
- Níveis: INFO, WARNING, ERROR
- Saída para console e arquivo

### Logs Node.js
- Console logging
- Error tracking
- Request/response logging

## 🧪 TESTES

### Testes Python
- Framework: pytest
- Cobertura: Módulos core e readers
- Mock: PDFs e planilhas de teste

### Testes Frontend
- Framework: Vitest + Testing Library
- Componentes isolados
- Integração com API

## 📈 PERFORMANCE

### Otimizações Python
- Processamento em lotes para grandes arquivos
- Uso de pandas para operações vetorizadas
- Cache de resultados intermediários

### Otimizações Frontend
- Lazy loading de componentes
- Virtualização de tabelas grandes
- Debounce em inputs de busca

## 🔒 SEGURANÇA

### Validação de Arquivos
- Verificação de extensões permitidas
- Validação de tamanho máximo
- Sanitização de nomes de arquivo

### API Security
- Rate limiting
- CORS configurado
- Validação de entrada

## 🐛 TROUBLESHOOTING

### Problemas Comuns

#### Erro: "Arquivo não encontrado"
- Verificar se arquivos estão no diretório correto
- Verificar permissões de leitura
- Verificar nomes dos arquivos

#### Erro: "PDF não contém tabelas"
- Verificar se PDF não está corrompido
- Verificar se contém tabelas legíveis
- Testar com PDFs de exemplo

#### Erro: "Colunas não encontradas"
- Verificar estrutura da planilha
- Verificar nomes das colunas
- Verificar encoding do arquivo

### Logs de Debug
- Habilitar logging detalhado
- Verificar console do navegador
- Verificar logs do servidor

## 📚 REFERÊNCIAS

### Documentação Oficial
- [React Documentation](https://react.dev/)
- [Python Documentation](https://docs.python.org/)
- [Node.js Documentation](https://nodejs.org/docs/)
- [Supabase Documentation](https://supabase.com/docs)

### Bibliotecas Utilizadas
- [Pandas](https://pandas.pydata.org/docs/)
- [PDFPlumber](https://github.com/jsvine/pdfplumber)
- [Express.js](https://expressjs.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

**Última atualização**: Agosto 2024
**Versão**: 1.0.0
