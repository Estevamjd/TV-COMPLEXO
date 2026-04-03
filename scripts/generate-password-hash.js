#!/usr/bin/env node
/**
 * Gera um hash bcrypt para a senha admin.
 * Uso: node scripts/generate-password-hash.js "sua_senha_forte"
 *
 * Depois, defina ADMIN_PASSWORD_HASH no Vercel com o hash gerado.
 */
import bcrypt from 'bcryptjs';

const password = process.argv[2];

if (!password) {
    console.error('Uso: node scripts/generate-password-hash.js "sua_senha_forte"');
    console.error('Exemplo: node scripts/generate-password-hash.js "M1nh@S3nhaF0rt3!"');
    process.exit(1);
}

if (password.length < 8) {
    console.error('ERRO: A senha deve ter no mínimo 8 caracteres.');
    process.exit(1);
}

const hash = await bcrypt.hash(password, 12);
console.log('\n=== Hash gerado com sucesso ===');
console.log(`\nADMIN_PASSWORD_HASH="${hash}"`);
console.log('\nAdicione esta variável de ambiente no Vercel Dashboard.');
console.log('Depois, remova ADMIN_PASSWORD do .env (não é mais necessário).\n');
