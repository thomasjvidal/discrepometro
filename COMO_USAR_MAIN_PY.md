# 🧠 DISCREPÔMETRO - Como Usar o main.py

## 📋 Visão Geral

O `main.py` é o **orquestrador principal** do sistema Discrepômetro. Ele coordena todo o fluxo de análise de discrepâncias fiscais automaticamente.

## 🚀 Como Executar

### 1. **Pré-requisitos**
```bash
# Instalar dependências
pip install -r requirements_main.txt
```

### 2. **Arquivos Necessários**
Coloque na mesma pasta do `main.py`:
- `NFe_Emitente_Itens.xlsx` (planilha com CFOPs)
- `Inventário 2023.pdf` (estoque inicial)
- `Inventario 2024.pdf` (estoque final)

### 3. **Execução**
```bash
python main.py
```

## 📊 O que o Sistema Faz

### **ETAPA 1: Validação**
- ✅ Verifica se todos os arquivos existem
- ✅ Valida formatos dos arquivos
- ✅ Cria diretórios necessários

### **ETAPA 2: Análise da Planilha**
- 📊 Lê a planilha NFe_Emitente_Itens.xlsx
- 🔍 Detecta automaticamente as colunas (CFOP, Código, Quantidade)
- 🛒 Filtra apenas vendas (CFOPs 5xxx, 6xxx, 7xxx)
- 🏆 Identifica os 10 produtos mais vendidos

### **ETAPA 3: Análise dos PDFs**
- 📄 Lê os dois PDFs de inventário
- 🔍 Extrai ano de referência automaticamente
- 📦 Busca estoque inicial e final para cada produto do top 10

### **ETAPA 4: Cálculo de Discrepâncias**
- ⚖️ Calcula estoque esperado = inicial - vendas
- 📊 Compara com estoque final real
- 🚨 Identifica discrepâncias (tolerância: 1 unidade)

### **ETAPA 5: Geração de Resultados**
- 📝 Cria JSON completo com todos os dados
- 📊 Salva em `resultados/resultados_discrepometro_YYYYMMDD_HHMMSS.json`
- 📋 Gera relatório com estatísticas e recomendações

## 📁 Estrutura de Arquivos

```
discrepometro/
├── main.py                    ← ARQUIVO PRINCIPAL
├── requirements_main.txt      ← Dependências
├── reader/
│   ├── __init__.py
│   ├── planilha_reader.py     ← Lê planilhas Excel
│   └── pdf_reader.py          ← Lê PDFs de inventário
├── core/
│   ├── __init__.py
│   ├── discrepancia.py        ← Calcula discrepâncias
│   └── utils.py               ← Funções auxiliares
├── resultados/                ← JSONs gerados
├── logs/                      ← Logs do sistema
└── backups/                   ← Backups automáticos
```

## 📊 Exemplo de Saída

### **Console (Logs)**
```
🧠 DISCREPÔMETRO - ANÁLISE FISCAL INTELIGENTE
====================================================
[2024-01-31 16:15:00] INFO: 🔍 Validando ambiente de execução...
[2024-01-31 16:15:01] INFO: ✅ Todos os arquivos necessários encontrados
[2024-01-31 16:15:02] INFO: 📊 Extraindo top 10 produtos mais vendidos...
[2024-01-31 16:15:05] INFO: ✅ Encontrados 10 produtos mais vendidos
[2024-01-31 16:15:06] INFO: 📄 Processando inventários (PDFs)...
[2024-01-31 16:15:10] INFO: ⚖️ Calculando discrepâncias...
[2024-01-31 16:15:12] INFO: 📝 Gerando JSON final...
[2024-01-31 16:15:13] INFO: 🎉 ANÁLISE COMPLETA CONCLUÍDA COM SUCESSO!
```

### **JSON Gerado**
```json
{
  "metadata": {
    "timestamp": "2024-01-31T16:15:13",
    "versao": "1.0.0",
    "total_produtos": 10,
    "produtos_ok": 7,
    "produtos_erro": 3,
    "tolerancia": 1.0
  },
  "configuracao": {
    "planilha": "NFe_Emitente_Itens.xlsx",
    "pdf_inicial": "Inventário 2023.pdf",
    "pdf_final": "Inventario 2024.pdf"
  },
  "resultados": [
    {
      "produto": "PRODUTO_001",
      "codigo": "001",
      "estoque_inicial": 1000.0,
      "vendas": 800.0,
      "estoque_final": 150.0,
      "estoque_esperado": 200.0,
      "discrepancia": -50.0,
      "status": "ERRO",
      "tipo_discrepancia": "Estoque Faltante (Venda sem Nota)"
    }
  ]
}
```

## 🔧 Configurações

### **Modificar Configurações no main.py**
```python
self.config = {
    'caminho_planilha': 'NFe_Emitente_Itens.xlsx',  # ← Nome da sua planilha
    'pdf_ano_1': 'Inventário 2023.pdf',            # ← PDF estoque inicial
    'pdf_ano_2': 'Inventario 2024.pdf',            # ← PDF estoque final
    'tolerancia_discrepancia': 1.0,                # ← Tolerância em unidades
    'max_produtos': 10                             # ← Top N produtos
}
```

## 🚨 Tratamento de Erros

### **Erros Comuns e Soluções**

1. **"Arquivo não encontrado"**
   - ✅ Verifique se os arquivos estão na mesma pasta do `main.py`
   - ✅ Confirme os nomes dos arquivos

2. **"Colunas essenciais não encontradas"**
   - ✅ Verifique se a planilha tem colunas CFOP, Código, Quantidade
   - ✅ O sistema detecta automaticamente variações de nomes

3. **"Nenhuma venda encontrada"**
   - ✅ Verifique se há CFOPs 5xxx, 6xxx, 7xxx na planilha
   - ✅ Confirme se os dados estão corretos

4. **"Produto não encontrado no PDF"**
   - ✅ Verifique se o nome do produto está igual nos arquivos
   - ✅ O sistema faz busca flexível (aceita variações)

## 📈 Interpretação dos Resultados

### **Status "OK"**
- ✅ Estoque final = estoque esperado (dentro da tolerância)
- ✅ Sistema fiscal em conformidade

### **Status "ERRO"**
- ❌ Estoque final ≠ estoque esperado
- 🚨 Possível venda sem nota ou compra sem nota

### **Tipos de Discrepância**
- **Estoque Faltante**: Vendeu mais do que declarou
- **Estoque Excedente**: Comprou mais do que declarou

## 🔄 Integração com Frontend

O JSON gerado pode ser usado pelo dashboard frontend:

```javascript
// Exemplo de uso no React
fetch('/api/resultados_discrepometro.json')
  .then(response => response.json())
  .then(data => {
    console.log('Produtos analisados:', data.resultados);
    console.log('Estatísticas:', data.metadata);
  });
```

## 🧪 Testes

### **Teste Individual dos Módulos**
```bash
# Testar leitura de planilha
python -m reader.planilha_reader

# Testar leitura de PDF
python -m reader.pdf_reader

# Testar cálculo de discrepâncias
python -m core.discrepancia
```

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs em `logs/discrepometro.log`
2. Confirme se todos os arquivos estão corretos
3. Teste cada módulo individualmente

---

**🎯 O sistema está pronto para uso! Basta executar `python main.py` e ele fará toda a análise automaticamente.** 