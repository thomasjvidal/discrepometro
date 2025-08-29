# 🚀 DISCREPÔMETRO - Análise Fiscal Inteligente

Sistema automatizado para análise de discrepâncias de estoque com base em planilhas de vendas e inventários em PDF.

## 📋 Funcionalidades

- **Leitura automática** de planilhas CSV/Excel com milhões de linhas
- **Filtragem inteligente** de CFOPs de venda (5101, 5102, 6101, 6102, 5405, 6405)
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
├── supabase/          # Banco de dados e funções
└── docs/              # Documentação
```

## ⚙️ Como Funciona

### 1. **Leitura da Planilha**
- Carrega arquivos CSV/Excel
- Filtra apenas CFOPs de venda
- Agrupa por produto e soma quantidades
- Identifica os 10 produtos mais vendidos

### 2. **Processamento de PDFs**
- Detecta automaticamente o ano do inventário
- Lê primeiro o PDF mais antigo, depois o mais recente
- Extrai tabelas de estoque
- Busca produtos específicos nos inventários

### 3. **Cálculo de Discrepâncias**
- Fórmula: `Discrepância = Estoque_2024 - Estoque_2023 - Vendas`
- Classificação:
  - **OK** → Discrepância nula ou dentro da margem
  - **ALERTA** → Diferença significativa
  - **CRÍTICO** → Discrepância grave

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
- **Colunas obrigatórias**: `Data`, `Produto`, `CFOP`, `Quantidade`, `Valor`
- **CFOPs válidos**: 5101, 5102, 6101, 6102, 5405, 6405

### PDFs de Inventário
- **Formato**: PDF com tabelas
- **Nomenclatura**: `inventario_2023.pdf`, `estoque_final_2024.pdf`
- **Colunas**: `Produto`, `Quantidade`, `Valor Total`

## 🔧 Uso

### Via Interface Web
1. Acesse a tela "Analysis"
2. Faça upload da planilha de vendas
3. Faça upload dos 2 PDFs de inventário
4. Aguarde a análise automática
5. Visualize os resultados

### Via Python
```python
from backend.discrepometro import DiscrepometroOrchestrator

discrepometro = DiscrepometroOrchestrator()
resultado = discrepometro.executar_analise_completa()
```

## 📊 Exemplo de Resultado

| Produto     | Qtd 2023 | Qtd 2024 | Vendido | Discrepância | Status     |
| ----------- | -------- | -------- | ------- | ------------ | ---------- |
| Pneu Aro 14 | 10       | 0        | 8       | -2           | ⚠️ ALERTA  |
| Bateria 60A | 5        | 20       | 15      | 0            | ✅ OK       |
| Óleo 20W50  | 30       | 45       | 5       | +10          | 🔥 CRÍTICO |

## 🛠️ Tecnologias

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend Python**: Pandas, PDFPlumber, FastAPI
- **Backend Node.js**: Express, Multer, CORS
- **Banco de Dados**: Supabase (PostgreSQL)
- **Deploy**: Vercel, Railway, Heroku

## 📝 Licença

MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📞 Suporte

- **Email**: suporte@discrepometro.com
- **Documentação**: [docs.discrepometro.com](https://docs.discrepometro.com)
- **Issues**: [GitHub Issues](https://github.com/discrepometro/issues)

---

**Desenvolvido com ❤️ pela equipe Discrepômetro**
