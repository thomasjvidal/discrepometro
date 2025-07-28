# 🏆 TOP 5 PRODUTOS MAIS VENDIDOS - DISCREPÔMETRO

## 🎯 **NOVA FUNCIONALIDADE IMPLEMENTADA**

O Discrepômetro agora identifica automaticamente os **5 produtos mais vendidos** e faz uma análise prioritária desses itens, cruzando dados dos inventários físico e contábil.

## 🔍 **COMO FUNCIONA:**

### **1. Identificação dos Top 5 Mais Vendidos**
- Analisa todas as movimentações fiscais (Excel/CSV)
- Identifica CFOPs de **VENDA** (5xxx, 6xxx, 7xxx)
- Soma o volume total de vendas por produto
- Ordena por volume de vendas (maior para menor)
- Seleciona os **5 primeiros**

### **2. Busca nos Inventários**
- Para cada produto do Top 5:
  - Busca quantidade no **inventário físico** (PDF1)
  - Busca quantidade no **inventário contábil** (PDF2)
  - Prioriza dados do físico sobre o contábil

### **3. Análise de Discrepâncias**
- Calcula estoque teórico: `Estoque Inicial + Entradas - Vendas`
- Compara com estoque real dos inventários
- Identifica possíveis:
  - **Compras sem nota fiscal** (estoque excedente)
  - **Vendas sem nota fiscal** (estoque faltante)
  - **Divergências físico/contábil**

## 📊 **EXEMPLO PRÁTICO:**

### **Dados de Entrada:**
```
Planilha Fiscal:
- Mouse Gamer: 142 vendas (CFOP 5102)
- Teclado Mecânico: 95 vendas (CFOP 5102)
- Monitor 24": 52 vendas (CFOP 5102)
- Headset Gamer: 110 vendas (CFOP 5102)
- Webcam HD: 55 vendas (CFOP 5102)

Inventário Físico (PDF):
- Mouse Gamer: 58 unidades
- Teclado Mecânico: 20 unidades
- Monitor 24": 3 unidades
- Headset Gamer: 30 unidades
- Webcam HD: 12 unidades

Inventário Contábil (PDF):
- Mouse Gamer: 60 unidades
- Teclado Mecânico: 18 unidades
- Monitor 24": 5 unidades
- Headset Gamer: 32 unidades
- Webcam HD: 10 unidades
```

### **Análise Automática:**
```
🏆 TOP 5 MAIS VENDIDOS:

1. Mouse Gamer (142 vendas)
   - Estoque Teórico: 50 + 150 - 142 = 58
   - Estoque Real: 58 (físico)
   - Status: ✅ Sem Discrepância

2. Teclado Mecânico (95 vendas)
   - Estoque Teórico: 30 + 80 - 95 = 15
   - Estoque Real: 20 (físico)
   - Status: ❌ Estoque Excedente (5 unidades)

3. Monitor 24" (52 vendas)
   - Estoque Teórico: 15 + 45 - 52 = 8
   - Estoque Real: 3 (físico)
   - Status: ❌ Estoque Faltante (5 unidades)

4. Headset Gamer (110 vendas)
   - Estoque Teórico: 25 + 120 - 110 = 35
   - Estoque Real: 30 (físico)
   - Status: ❌ Estoque Faltante (5 unidades)

5. Webcam HD (55 vendas)
   - Estoque Teórico: 10 + 60 - 55 = 15
   - Estoque Real: 12 (físico)
   - Status: ❌ Estoque Faltante (3 unidades)
```

## 🎨 **INTERFACE NO DASHBOARD:**

### **Seção Especial "Top 5 Mais Vendidos":**
- Cards destacados com ranking (1º, 2º, 3º, 4º, 5º)
- Informações completas: vendas, estoque final, status
- Badges coloridos indicando tipo de discrepância
- Explicação automática da análise

### **Estatísticas Atualizadas:**
- Card "Top Vendido" mostra o produto #1
- Contador de unidades vendidas
- Ícone de coroa para destaque

## 🔧 **IMPLEMENTAÇÃO TÉCNICA:**

### **Função Principal:**
```typescript
async function analisarTop5MaisVendidos(
  movimentacoes: ExcelMovimentacao[],
  inventarioFisico: PDFInventario[],
  inventarioContabil: PDFInventario[]
): Promise<DiscrepanciaReal[]>
```

### **Fluxo de Processamento:**
1. **Filtragem por CFOPs de venda** (5xxx, 6xxx, 7xxx)
2. **Agregação por produto** (soma de vendas)
3. **Ordenação por volume** (maior para menor)
4. **Seleção dos Top 5**
5. **Cruzamento com inventários**
6. **Cálculo de discrepâncias**
7. **Priorização no resultado final**

### **Campos Adicionais:**
```typescript
interface DiscrepanciaReal {
  // ... campos existentes ...
  fonte_inventario_fisico?: number;
  fonte_inventario_contabil?: number;
  ranking_vendas?: number;
}
```

## 🎯 **BENEFÍCIOS:**

### **Para o Usuário:**
- **Foco automático** nos produtos mais importantes
- **Análise prioritária** dos itens de maior impacto
- **Detecção rápida** de problemas nos produtos mais vendidos
- **Interface intuitiva** com destaque visual

### **Para o Negócio:**
- **Controle fiscal** dos produtos mais críticos
- **Identificação de riscos** nos itens de maior volume
- **Otimização de estoque** baseada em dados reais
- **Conformidade fiscal** dos produtos principais

## 🚀 **COMO USAR:**

1. **Faça upload** dos 2 PDFs de inventário (físico e contábil)
2. **Faça upload** da planilha fiscal com CFOPs
3. **Execute a análise** - o sistema automaticamente:
   - Identifica os 5 mais vendidos
   - Cruza com os inventários
   - Calcula discrepâncias
   - Exibe no dashboard com destaque

## ✅ **STATUS: IMPLEMENTADO E FUNCIONAL**

- ✅ Identificação automática dos Top 5
- ✅ Cruzamento com inventários
- ✅ Cálculo de discrepâncias
- ✅ Interface destacada no dashboard
- ✅ Sem alterações no design UI/UX existente
- ✅ Integração completa com o sistema

**🎉 A funcionalidade está pronta e operacional!** 