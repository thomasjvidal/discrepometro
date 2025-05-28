# Discrepômetro 📊🐍

Sistema inteligente para leitura e análise de planilhas e PDFs fiscais com grande volume de dados. Projetado para identificar discrepâncias contábeis de forma automatizada e visual. Ideal para aplicações fiscais, auditorias e controle de dados.

## 🚀 Tecnologias utilizadas

- **Frontend**: React, TypeScript, Vite, TailwindCSS, Shadcn, React Router
- **Backend**: Supabase (Functions + Postgres), Node.js (Express)
- **Visualização**: Recharts
- **Uploads**: CSV, XLSX, PDF (usando Papaparse, xlsx, pdf-lib)
- **Formulários**: React Hook Form + Zod
- **Infraestrutura**: Projeto iniciado via Lovable + Supabase CLI + GitHub

## 📂 Como rodar localmente

```bash
git clone https://github.com/thomasjvidal/discrepometro.git
cd discrepometro
npm install
supabase start
npm run dev
```

⚠️ Crie um arquivo .env com as chaves do Supabase se for usar em produção

## 📁 Estrutura do Projeto

- `src/`: Código React (components, lib, pages)
- `supabase/`: Funções de upload (CSV, PDF, XLSX)
- `scripts/`: Scripts em Python para testes com arquivos grandes
- `.env`: Variáveis de ambiente (excluído do repositório)

## Project info

**URL**: https://lovable.dev/projects/ae14e326-2166-43b3-92e7-7e3dc67df467

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/ae14e326-2166-43b3-92e7-7e3dc67df467) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/ae14e326-2166-43b3-92e7-7e3dc67df467) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
