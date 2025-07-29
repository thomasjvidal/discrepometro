# Contributing to Discrepômetro

Obrigado por considerar contribuir com o Discrepômetro! Este documento fornece diretrizes para contribuições.

## 🚀 Como Contribuir

### 1. Configuração do Ambiente

```bash
# Clone o repositório
git clone https://github.com/thomasjvidal/discrepometro.git
cd discrepometro

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais

# Execute o servidor de desenvolvimento
npm run dev
```

### 2. Fluxo de Trabalho

1. **Crie uma branch** para sua feature/fix:
   ```bash
   git checkout -b feature/nova-funcionalidade
   # ou
   git checkout -b fix/correcao-bug
   ```

2. **Faça suas alterações** seguindo as convenções de código

3. **Teste suas mudanças**:
   ```bash
   npm run lint
   npm run build
   ```

4. **Commit suas mudanças** seguindo Conventional Commits:
   ```bash
   git commit -m "feat: adiciona nova funcionalidade de análise"
   ```

5. **Push para sua branch**:
   ```bash
   git push origin feature/nova-funcionalidade
   ```

6. **Abra um Pull Request** no GitHub

## 📝 Convenções de Código

### Conventional Commits

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Mudanças na documentação
- `style:` Mudanças de estilo (formatação, etc.)
- `refactor:` Refatoração de código
- `test:` Adição ou atualização de testes
- `chore:` Tarefas de manutenção

### Estrutura de Commits

```
<tipo>(<escopo>): <descrição>

[corpo opcional]

[rodapé opcional]
```

Exemplos:
```bash
feat(analysis): add Top 5 products analysis
fix(upload): resolve PDF processing error
docs(readme): update installation instructions
```

### Nomenclatura

- **Arquivos**: kebab-case (`real-processor.ts`)
- **Componentes**: PascalCase (`DiscrepancyTable.tsx`)
- **Funções**: camelCase (`analisarTop5MaisVendidos`)
- **Constantes**: UPPER_SNAKE_CASE (`SUPABASE_URL`)
- **Interfaces**: PascalCase (`DiscrepanciaReal`)

### TypeScript

- Use tipos explícitos quando possível
- Evite `any`, use `unknown` se necessário
- Documente interfaces complexas
- Use generics quando apropriado

### React

- Use functional components com hooks
- Mantenha componentes pequenos e focados
- Use TypeScript para props
- Siga as convenções do shadcn/ui

## 🧪 Testes

### Executando Testes

```bash
# Testes unitários
npm test

# Testes de integração
npm run test:integration

# Cobertura de testes
npm run test:coverage
```

### Escrevendo Testes

- Teste componentes isoladamente
- Use mocks para dependências externas
- Teste casos de sucesso e erro
- Mantenha testes simples e legíveis

## 📚 Documentação

### Atualizando Documentação

- Documente novas funcionalidades
- Atualize o README.md quando necessário
- Mantenha o CHANGELOG.md atualizado
- Adicione comentários em código complexo

### Estrutura de Documentação

```
docs/
├── api/           # Documentação da API
├── components/    # Documentação de componentes
├── guides/        # Guias de uso
└── examples/      # Exemplos de código
```

## 🔍 Code Review

### Checklist para Pull Requests

- [ ] Código segue as convenções estabelecidas
- [ ] Testes foram adicionados/atualizados
- [ ] Documentação foi atualizada
- [ ] Build passa sem erros
- [ ] Lint passa sem warnings
- [ ] Funcionalidade foi testada manualmente

### Processo de Review

1. **Auto-review**: Revise seu próprio código antes de submeter
2. **Descrição clara**: Explique o que foi feito e por quê
3. **Screenshots**: Inclua screenshots para mudanças de UI
4. **Testes**: Demonstre que a funcionalidade funciona

## 🐛 Reportando Bugs

### Template de Bug Report

```markdown
**Descrição do Bug**
Descrição clara e concisa do que aconteceu.

**Passos para Reproduzir**
1. Vá para '...'
2. Clique em '...'
3. Role até '...'
4. Veja o erro

**Comportamento Esperado**
Descrição clara do que deveria acontecer.

**Screenshots**
Se aplicável, adicione screenshots.

**Ambiente**
- OS: [ex: Windows 10]
- Browser: [ex: Chrome 120]
- Versão: [ex: 1.2.0]

**Informações Adicionais**
Qualquer outra informação relevante.
```

## 💡 Sugerindo Features

### Template de Feature Request

```markdown
**Problema que a feature resolve**
Descrição clara do problema.

**Solução proposta**
Descrição da solução desejada.

**Alternativas consideradas**
Outras soluções que foram consideradas.

**Informações adicionais**
Contexto adicional, screenshots, etc.
```

## 📋 Checklist de Contribuição

Antes de submeter sua contribuição:

- [ ] Li e segui as diretrizes de contribuição
- [ ] Meu código segue as convenções estabelecidas
- [ ] Adicionei testes para novas funcionalidades
- [ ] Atualizei a documentação conforme necessário
- [ ] Meu código não gera warnings ou erros
- [ ] Testei minha funcionalidade manualmente
- [ ] Criei um Pull Request com descrição clara

## 🤝 Comunidade

### Canais de Comunicação

- **Issues**: [GitHub Issues](https://github.com/thomasjvidal/discrepometro/issues)
- **Discussions**: [GitHub Discussions](https://github.com/thomasjvidal/discrepometro/discussions)
- **Wiki**: [GitHub Wiki](https://github.com/thomasjvidal/discrepometro/wiki)

### Código de Conduta

- Seja respeitoso e inclusivo
- Ajude outros contribuidores
- Mantenha discussões construtivas
- Reporte comportamentos inadequados

## 🎯 Áreas para Contribuição

### Prioridades Atuais

- [ ] Melhorar processamento de PDFs
- [ ] Adicionar mais testes
- [ ] Otimizar performance
- [ ] Melhorar UX/UI
- [ ] Adicionar novas funcionalidades de análise

### Boas Primeiras Issues

- [ ] Correção de bugs simples
- [ ] Melhorias na documentação
- [ ] Adição de testes
- [ ] Refatoração de código

## 📄 Licença

Ao contribuir, você concorda que suas contribuições serão licenciadas sob a mesma licença do projeto.

---

**Obrigado por contribuir com o Discrepômetro! 🎉** 