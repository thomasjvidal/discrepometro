# 🎯 DISCREPÔMETRO - Sistema de Análise Fiscal

## 📖 Sobre o Projeto

O **Discrepômetro** é um sistema inteligente que detecta automaticamente **compras e vendas sem nota fiscal** através da análise de CFOPs e comparação com o estoque real.

### 🚀 Funcionalidades Principais

- **📊 Análise Automática**: Processa planilhas fiscais, inventários físicos e contábeis
- **🏆 Top 5 Mais Vendidos**: Identifica e analisa prioritariamente os produtos com maior volume de vendas
- **🔍 Detecção de Discrepâncias**: Calcula diferenças entre estoque teórico e real
- **📈 Dashboard Interativo**: Visualização em tempo real com filtros e busca
- **💾 Armazenamento Seguro**: Integração com Supabase para persistência de dados

### 🎯 Como Funciona

1. **Upload de Arquivos**: Planilhas fiscais (Excel/CSV) + Inventários (PDF)
2. **Processamento Inteligente**: Análise de CFOPs e cruzamento de dados
3. **Cálculo de Discrepâncias**: Estoque esperado vs real
4. **Resultados Prioritários**: Foco nos 5 produtos mais vendidos
5. **Visualização**: Dashboard com análise detalhada

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React + TypeScript + Vite
- **UI/UX**: shadcn/ui + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: Supabase (PostgreSQL)
- **Processamento**: PDF.js-extract + ExcelJS
- **Deploy**: Vercel/Netlify ready

## 🚀 Como Executar

### Pré-requisitos

- Node.js 18+ 
- npm ou yarn

### Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/thomasjvidal/discrepometro.git

# 2. Entre no diretório
cd discrepometro

# 3. Instale as dependências
npm install

# 4. Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais do Supabase

# 5. Execute o servidor de desenvolvimento
npm run dev
```

### Acesso

- **Local**: http://localhost:8080
- **Rede**: http://192.168.1.35:8080

## 📁 Estrutura do Projeto

```
discrepometro/
├── src/
│   ├── components/     # Componentes React
│   ├── pages/         # Páginas da aplicação
│   ├── services/      # Serviços e APIs
│   ├── utils/         # Utilitários e helpers
│   └── lib/           # Configurações e bibliotecas
├── supabase/          # Functions e configurações
├── scripts/           # Scripts Python de processamento
└── docs/              # Documentação
```

## 🎯 Funcionalidades Detalhadas

### 🏆 Top 5 Produtos Mais Vendidos

- **Identificação Automática**: CFOPs de venda (5xxx, 6xxx, 7xxx)
- **Ranking Visual**: Interface destacada no dashboard
- **Análise Prioritária**: Foco nos produtos mais críticos
- **Cruzamento de Dados**: Inventário físico + contábil

### 📊 Análise de Discrepâncias

- **Estoque Teórico**: Cálculo baseado em movimentações
- **Comparação Real**: Inventários físicos e contábeis
- **Detecção de Problemas**: Compras/vendas sem nota fiscal
- **Relatórios Detalhados**: Exportação e visualização

## 📚 Documentação

- **[Como Usar](COMO_USAR_DISCREPOMETRO.md)**: Guia completo de utilização
- **[Top 5 Mais Vendidos](TOP5_MAIS_VENDIDOS.md)**: Documentação da nova funcionalidade
- **[Sistema Real](SISTEMA_REAL_COMPLETO.md)**: Análise técnica completa
- **[Changelog](CHANGELOG.md)**: Histórico de versões

## 🔧 Desenvolvimento

### Scripts Disponíveis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção
npm run preview      # Preview do build
npm run lint         # Verificação de código
```

### Convenções de Commit

Este projeto segue [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Novas funcionalidades
- `fix:` Correções de bugs
- `docs:` Mudanças na documentação
- `style:` Mudanças de estilo
- `refactor:` Refatoração de código
- `test:` Adição ou atualização de testes
- `chore:` Tarefas de manutenção

## 📈 Roadmap

### Versão 1.3.0 (Planejada)
- [ ] Processamento de PDFs com melhor reconhecimento de padrões
- [ ] Relatórios avançados e exportação
- [ ] Colaboração em tempo real
- [ ] API REST completa

### Versão 1.4.0 (Futura)
- [ ] Machine Learning para detecção de padrões
- [ ] Integração com sistemas ERP
- [ ] Mobile app
- [ ] Análise preditiva

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

- **Issues**: [GitHub Issues](https://github.com/thomasjvidal/discrepometro/issues)
- **Documentação**: [Wiki do Projeto](https://github.com/thomasjvidal/discrepometro/wiki)
- **Email**: suporte@discrepometro.com

---

**🎉 Desenvolvido com ❤️ para facilitar o controle fiscal e a gestão de estoque!**
