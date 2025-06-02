# 🎯 DISCREPÔMETRO - GUIA COMPLETO DE USO

## 📖 O QUE É O DISCREPÔMETRO?

O Discrepômetro é um sistema que **detecta compras e vendas sem nota fiscal** através da análise de CFOPs e comparação com o estoque real.

### 🧠 COMO FUNCIONA?

1. **Lê sua planilha fiscal** e classifica cada CFOP:
   - CFOPs 1xxx, 2xxx, 3xxx = **COMPRAS COM NOTA** (entradas)
   - CFOPs 5xxx, 6xxx, 7xxx = **VENDAS COM NOTA** (saídas)

2. **Lê seus inventários** (inicial e final)

3. **Aplica a fórmula**:
   ```
   ESTOQUE ESPERADO = Estoque Inicial + Entradas - Saídas
   ```

4. **Compara com o estoque real**:
   - Se diferença > 1 unidade = **DISCREPÂNCIA DETECTADA**
   - Se estoque real > esperado = Possível **COMPRA SEM NOTA**
   - Se estoque real < esperado = Possível **VENDA SEM NOTA**

## 🚀 COMO EXECUTAR

### Passo 1: Preparar seus arquivos

Coloque na pasta do projeto:

1. **Planilhas fiscais** (.xlsx, .csv) com colunas:
   - CFOP
   - Código do produto
   - Descrição do produto  
   - Quantidade

2. **PDFs de inventário** ou **CSVs** com:
   - Código do produto
   - Nome do produto
   - Quantidade

### Passo 2: Executar o sistema

```bash
# Ativar ambiente virtual
source venv_discrepometro/bin/activate

# Executar a análise
python3 discrepometro_final.py

# OU para testar com dados de exemplo:
python3 discrepometro_demo.py
```

### Passo 3: Ver resultados

Os resultados são salvos automaticamente no **Supabase** na tabela `analise_discrepancia`.

## 📊 EXEMPLO PRÁTICO

### Dados de entrada:
- **Estoque inicial**: 50 unidades
- **Compras com nota** (CFOP 1102): 100 unidades  
- **Vendas com nota** (CFOP 5102): 80 unidades
- **Estoque final real**: 45 unidades

### Cálculo:
```
Esperado = 50 + 100 - 80 = 70 unidades
Real = 45 unidades
Diferença = 70 - 45 = 25 unidades
```

### Resultado:
**❌ DISCREPÂNCIA DETECTADA:** Possível **VENDA SEM NOTA** de 25 unidades

## 📁 ARQUIVOS DO PROJETO

### Scripts principais:
- `discrepometro_final.py` - **Script completo** (para usar com seus dados reais)
- `discrepometro_demo.py` - **Demonstração** (para testar o sistema)

### Arquivos de exemplo:
- `inventario_completo.csv` - Dados de inventário de exemplo
- `dados_exemplo_fiscal.csv` - Transações fiscais de exemplo
- `test_fiscal.csv` - Mais dados fiscais de teste

### Configuração:
- `requirements.txt` - Dependências Python
- `venv_discrepometro/` - Ambiente virtual

## 🔧 DEPENDÊNCIAS

O sistema precisa dessas bibliotecas Python:
- `pandas` - Para ler planilhas
- `pdfplumber` - Para ler PDFs
- `supabase` - Para salvar resultados

Todas já estão instaladas no ambiente virtual `venv_discrepometro`.

## 🎯 CLASSIFICAÇÃO DE CFOPs

### Entradas (Compras com nota):
- **1xxx** - Compras dentro do estado
- **2xxx** - Compras de outros estados  
- **3xxx** - Compras do exterior

### Saídas (Vendas com nota):
- **5xxx** - Vendas dentro do estado
- **6xxx** - Vendas para outros estados
- **7xxx** - Vendas para o exterior

## 📋 COLUNAS DA TABELA DE RESULTADOS

Os resultados no Supabase têm estas colunas:

- `produto` - Nome do produto
- `codigo` - Código do produto
- `cfop` - CFOPs usados nas transações
- `entradas` - Total de compras com nota
- `saidas` - Total de vendas com nota
- `est_inicial` - Estoque inicial
- `est_final` - Estoque final real
- `est_calculado` - Estoque esperado (calculado)
- `discrepancia_tipo` - Tipo da discrepância:
  - "Sem Discrepância" = OK
  - "Estoque Excedente" = Possível compra sem nota
  - "Estoque Faltante" = Possível venda sem nota
- `discrepancia_valor` - Diferença em unidades
- `observacoes` - Detalhes do cálculo

## ❗ IMPORTANT NOTES

### Para seus dados reais:

1. **Formate suas planilhas** com as colunas certas
2. **Use o script `discrepometro_final.py`** para dados completos
3. **Coloque os arquivos na mesma pasta** que o script
4. **Execute apenas uma vez** por análise (dados anteriores são limpos)

### Para testar:

1. **Use o script `discrepometro_demo.py`**
2. **Arquivos de exemplo já estão prontos**
3. **Mostra o processo passo a passo**

## 🔍 INTERPRETAÇÃO DOS RESULTADOS

### ✅ "Sem Discrepância"
Está tudo OK! A diferença é ≤ 1 unidade (dentro da margem de erro).

### ❌ "Estoque Excedente" 
Você tem mais estoque do que deveria. Possíveis causas:
- Compra sem nota fiscal
- Erro de inventário
- Produto não baixado do sistema

### ❌ "Estoque Faltante"
Você tem menos estoque do que deveria. Possíveis causas:
- Venda sem nota fiscal  
- Furto/perda
- Erro de inventário

## 🎉 PRONTO!

Agora você tem um sistema completo para detectar movimentações sem nota fiscal. Os resultados ficam salvos no Supabase e você pode analisar através do seu dashboard ou exportar para Excel.

**💡 Dica:** Execute a análise mensalmente para monitorar discrepâncias e manter seu controle fiscal em dia! 