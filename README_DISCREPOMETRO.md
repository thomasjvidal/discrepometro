# 🚀 Discrepômetro - Radar Fiscal Inteligente

Sistema automatizado para detectar discrepâncias entre inventário declarado e movimentações fiscais, identificando inconsistências e calculando os 10 produtos mais vendidos.

## 📋 Visão Geral

O **Discrepômetro** é um sistema inteligente que:

1. **Processa 4 arquivos** (2 PDFs de inventário + 2 planilhas de movimentação)
2. **Identifica os 10 produtos mais vendidos** baseado em CFOPs de venda
3. **Compara vendas com inventários** para detectar discrepâncias
4. **Gera relatório visual** com estatísticas e alertas

## 🎯 Objetivo

Automatizar a análise fiscal comparativa entre anos diferentes, identificando:
- ✅ Produtos vendidos sem estoque suficiente
- ✅ Discrepâncias entre inventário físico e contábil
- ✅ Top 10 produtos mais vendidos
- ✅ Alertas de conformidade fiscal

## 📁 Arquivos de Entrada

O sistema processa **4 arquivos**:

### 📄 PDFs de Inventário (2 arquivos)
- `inventario_2023.pdf` - Estoque final de 2023
- `inventario_2024.pdf` - Estoque final de 2024

### 📊 Planilhas de Movimentação (2 arquivos)
- `emitente_itens_2023.csv` - Vendas/compras emitidas
- `destinatario_itens_2023.csv` - Vendas/compras recebidas

## 🚀 Instalação

### 1. Clonar o repositório
```bash
git clone <url-do-repositorio>
cd discrepometro
```

### 2. Instalar dependências Python
```bash
pip install -r requirements.txt
```

### 3. Verificar instalação
```bash
python scripts/test_discrepometro.py --criar-teste
```

## 🧪 Teste Rápido

### 1. Criar dados de teste
```bash
python scripts/test_discrepometro.py --criar-teste
```

### 2. Executar análise
```bash
python scripts/test_discrepometro.py
```

### 3. Verificar resultado
```bash
cat relatorio_discrepometro.json
```

## 📊 Uso via CLI

### Análise com arquivos próprios
```bash
python scripts/discrepometro_completo.py /caminho/para/arquivos
```

### Criar dados de teste
```bash
python scripts/test_discrepometro.py --criar-teste --diretorio ./meus_dados
```

### Análise com saída personalizada
```bash
python scripts/test_discrepometro.py --output meu_relatorio.json
```

## 🔧 Estrutura do Projeto

```
discrepometro/
├── scripts/
│   ├── discrepometro_completo.py    # Script principal
│   ├── process_xlsx.py              # Processamento de planilhas
│   ├── process_pdf.py               # Processamento de PDFs
│   ├── discrepancy_calculator.py    # Cálculo de discrepâncias
│   └── test_discrepometro.py       # CLI para testes
├── requirements.txt                  # Dependências Python
└── README_DISCREPOMETRO.md         # Este arquivo
```

## 📈 Lógica de Funcionamento

### Etapa 1: Processamento de Planilhas
- ✅ Carrega CSV/Excel com milhões de linhas
- ✅ Filtra CFOPs de venda: `5101`, `5102`, `6101`, `6102`, `5405`, `6405`
- ✅ Agrupa por produto e soma quantidades
- ✅ Identifica top 10 produtos mais vendidos

### Etapa 2: Processamento de PDFs
- ✅ Extrai tabelas dos PDFs de inventário
- ✅ Detecta automaticamente ano (2023/2024)
- ✅ Busca produtos específicos nos inventários
- ✅ Extrai quantidade e valor final

### Etapa 3: Cálculo de Discrepâncias
- ✅ Compara quantidade vendida vs estoque final
- ✅ Calcula diferença: `Estoque_2024 - Estoque_2023 - Vendas`
- ✅ Classifica status: **OK** / **ALERTA** / **CRÍTICO**

## 📊 Formato de Saída

### JSON de Relatório
```json
{
  "timestamp": "2024-01-15T10:30:00",
  "estatisticas": {
    "total_produtos": 10,
    "criticos": 3,
    "alertas": 2,
    "ok": 5,
    "percentual_critico": 30.0,
    "valor_total_vendido": 25000.00,
    "quantidade_total_vendida": 5000
  },
  "discrepancias": [
    {
      "produto": "Caneta Azul BIC",
      "quantidade_vendida": 500,
      "quantidade_inventario": 200,
      "diferenca": -300,
      "status": "CRÍTICO",
      "codigo": "CAN001",
      "valor_total_vendido": 2500.00,
      "cfops_utilizados": ["5101", "6101"]
    }
  ]
}
```

## 🎯 Status de Discrepância

### ✅ OK
- Diferença pequena (≤ 10% da quantidade vendida)
- Produto encontrado em ambos os inventários

### ⚠️ ALERTA
- Diferença moderada (> 10% da quantidade vendida)
- Sobra muito estoque

### 🚨 CRÍTICO
- Produto não encontrado no inventário
- Vendeu mais do que tinha em estoque
- Diferença muito grande

## 🔧 Configuração Avançada

### CFOPs de Venda
Editar em `scripts/process_xlsx.py`:
```python
CFOPS_VENDA = ['5101', '5102', '6101', '6102', '5405', '6405']
```

### Limite de Discrepância
Editar em `scripts/discrepancy_calculator.py`:
```python
# Se a diferença é muito grande (mais de 10% da quantidade vendida)
if abs(diferenca_esperada) > (quantidade_vendida * 0.1):
```

## 🐛 Troubleshooting

### Erro: "Arquivos não encontrados"
- ✅ Verificar se os 4 arquivos estão no diretório
- ✅ Verificar nomes dos arquivos (deve conter ano)
- ✅ Usar `--criar-teste` para gerar dados de exemplo

### Erro: "Nenhuma tabela encontrada no PDF"
- ✅ Verificar se o PDF contém tabelas
- ✅ Verificar se o PDF não está corrompido
- ✅ Testar com PDFs de exemplo

### Erro: "Colunas não encontradas"
- ✅ Verificar se as planilhas têm as colunas necessárias
- ✅ Verificar nomes das colunas (produto, quantidade, cfop)
- ✅ Usar dados de teste como referência

## 📞 Suporte

Para dúvidas ou problemas:
1. Verificar logs em `discrepometro.log`
2. Executar com dados de teste primeiro
3. Verificar formato dos arquivos de entrada

## 🚀 Próximos Passos

- [ ] Integração com FastAPI
- [ ] Interface web completa
- [ ] Processamento em lote
- [ ] Relatórios em PDF
- [ ] Integração com bancos de dados

---

**Desenvolvido com ❤️ para automatizar análises fiscais** 