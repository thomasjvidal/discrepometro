#!/usr/bin/env node

/**
 * Security Audit Script for Discrepômetro Frontend
 * Run with: node scripts/security-audit.js
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔒 Iniciando auditoria de segurança...\n');

// Check if npm audit is available
try {
  console.log('📋 Verificando dependências vulneráveis...');
  const auditResult = execSync('npm audit --audit-level=moderate', { 
    cwd: join(__dirname, '..'),
    encoding: 'utf8',
    stdio: 'pipe'
  });
  console.log('✅ Nenhuma vulnerabilidade crítica encontrada');
} catch (error) {
  if (error.status === 1) {
    console.log('⚠️  Vulnerabilidades encontradas:');
    console.log(error.stdout);
    console.log('🔧 Execute: npm audit fix');
  }
}

// Check environment files
console.log('\n🔐 Verificando arquivos de ambiente...');
const envFiles = ['.env', '.env.local', '.env.production'];
envFiles.forEach(file => {
  const filePath = join(__dirname, '..', file);
  if (existsSync(filePath)) {
    const content = readFileSync(filePath, 'utf8');
    if (content.includes('SUA_CHAVE') || content.includes('SUA_NOVA_CHAVE')) {
      console.log(`⚠️  ${file}: Chaves não configuradas`);
    } else if (content.includes('eyJ')) {
      console.log(`✅ ${file}: Configurado`);
    } else {
      console.log(`❓ ${file}: Status desconhecido`);
    }
  } else {
    console.log(`❌ ${file}: Não encontrado`);
  }
});

// Check security headers
console.log('\n🛡️  Verificando configurações de segurança...');
const viteConfig = readFileSync(join(__dirname, '..', 'vite.config.ts'), 'utf8');
if (viteConfig.includes('X-Content-Type-Options')) {
  console.log('✅ Headers de segurança configurados');
} else {
  console.log('❌ Headers de segurança não configurados');
}

// Check .gitignore
console.log('\n📁 Verificando .gitignore...');
const gitignore = readFileSync(join(__dirname, '..', '.gitignore'), 'utf8');
if (gitignore.includes('.env')) {
  console.log('✅ Arquivos .env protegidos no .gitignore');
} else {
  console.log('❌ Arquivos .env não protegidos');
}

console.log('\n🎯 Auditoria concluída!');
console.log('\n📚 Recomendações de segurança:');
console.log('1. Execute npm audit fix regularmente');
console.log('2. Mantenha dependências atualizadas');
console.log('3. Use HTTPS em produção');
console.log('4. Monitore logs de acesso');
console.log('5. Implemente rate limiting');
console.log('6. Configure backup automático');
console.log('7. Use autenticação 2FA quando possível');
