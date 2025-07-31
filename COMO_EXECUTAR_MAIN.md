# 🚀 COMO EXECUTAR O DISCREPÔMETRO

## 📋 PRÉ-REQUISITOS

1. **Python 3.8+** instalado
2. **Arquivos necessários** na mesma pasta do script:
   - `inventario_2023.pdf` (estoque inicial)
   - `inventario_2024.pdf` (estoque final)
   - `cfop_emitente_2024.xlsb` (movimentações fiscais)

## 🔧 INSTALAÇÃO

```bash
# Instalar dependências
pip install -r requirements_main.txt
```

## 🎯 EXECUÇÃO

```bash
# Executar análise completa
python main.py
```

## 📊 RESULTADOS

O script irá gerar:
- `resultados_discrepometro_YYYYMMDD_HHMMSS.json` (dados completos)
- `resultados_discrepometro_YYYYMMDD_HHMMSS.csv` (visualização em Excel)

## 🔍 LOGS ESPERADOS

```
🚀 INICIANDO ANÁLISE COMPLETA DO DISCREPÔMETRO
============================================================

📊 ETAPA 1: Identificando produtos mais vendidos
📊 Lendo planilha CFOP: cfop_emitente_2024.xlsb
✅ Planilha carregada: 15000 linhas
📋 Colunas encontradas: ['NFE', 'CNPJ - Emitente', 'CNPJ - Destinatário', 'Docto - Modelo', 'Docto - Série', 'Docto - Número', 'Data Emissão', 'CFOP', 'Número Item', 'Mercadoria - Código', 'Mercadoria - Descrição', 'Mercadoria - Qtde', 'Mercadoria - Unidade', 'Mercadoria - Valor', 'Valor Desconto', 'Valor Outras Despesas Acessórias', 'Mercadoria - BC ICMS', 'Mercadoria - Alíquota', 'Mercadoria - ICMS', 'Mercadoria - BC ICMS-ST', 'Mercadoria - IPI', 'Chave Acesso NFe']
🛒 Vendas encontradas: 8500 linhas
🏆 TOP 10 PRODUTOS MAIS VENDIDOS:
  1. CAFE XYZ - 8950 unidades
  2. ARROZ T1 - 8100 unidades
  3. FEIJAO CARIOCA - 7200 unidades
  ...

📄 ETAPA 2: Lendo inventários
📄 Lendo PDF de inventário inicial: inventario_2023.pdf
  📄 Processando página 1
    ✅ CAFE XYZ: 3000 unidades
    ✅ ARROZ T1: 2500 unidades
  ...
✅ Inventário inicial processado: 1500 produtos encontrados

📄 Lendo PDF de inventário final: inventario_2024.pdf
  📄 Processando página 1
    ✅ CAFE XYZ: 200 unidades
    ✅ ARROZ T1: 150 unidades
  ...
✅ Inventário final processado: 1500 produtos encontrados

⚖️ ETAPA 3: Calculando discrepâncias
⚖️ Calculando discrepâncias...
  📊 CAFE XYZ:
    Inicial: 3000, Vendido: 8950
    Esperado: -5950, Real: 200
    Diferença: 6150, Status: ERRO
  📊 ARROZ T1:
    Inicial: 2500, Vendido: 8100
    Esperado: -5600, Real: 150
    Diferença: 5750, Status: ERRO
  ...

💾 ETAPA 4: Salvando resultados
💾 Salvando resultados no Supabase...
✅ Resultados salvos em: resultados_discrepometro_20241215_143022.json
✅ Resultados CSV salvos em: resultados_discrepometro_20241215_143022.csv

✅ ANÁLISE COMPLETA FINALIZADA!
📊 Total de produtos analisados: 10
🟢 Produtos OK: 2
🔴 Produtos com ERRO: 8
```

## ⚠️ TROUBLESHOOTING

### Erro: "Arquivo não encontrado"
- Verifique se os 3 arquivos estão na mesma pasta do `main.py`
- Verifique se os nomes dos arquivos estão corretos

### Erro: "Colunas essenciais não encontradas"
- Verifique se a planilha tem as colunas:
  - "Descrição do Produto"
  - "Quantidade" 
  - "CFOP"

### Erro: "Nenhuma movimentação de venda válida encontrada"
- Verifique se há CFOPs de venda (5xxx, 6xxx, 7xxx) na planilha
- Verifique se as quantidades são maiores que zero

## 📈 FORMATO DOS RESULTADOS

Cada produto terá:
```json
{
  "produto": "CAFE XYZ",
  "estoque_inicial": 3000,
  "vendido": 8950,
  "estoque_esperado": -5950,
  "estoque_real": 200,
  "diferenca": 6150,
  "status": "ERRO"
}
```

## 🎯 PRÓXIMOS PASSOS

1. **Testar** com seus arquivos reais
2. **Ajustar** padrões de PDF se necessário
3. **Implementar** conexão real com Supabase
4. **Integrar** com o frontend React 