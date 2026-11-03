#!/usr/bin/env node
/**
 * Gera o hash PBKDF2-SHA256 da senha do painel (ADMIN_PASSWORD_HASH), no formato
 * pbkdf2$<iterações>$<sal>$<hash>. Funciona na Vercel e no Cloudflare Workers.
 *
 * A senha vem da entrada padrão, nunca de argumento (não fica no histórico do shell):
 *   node scripts/gerar-hash-pbkdf2.js            (digita a senha, sem eco)
 *   node scripts/gerar-hash-pbkdf2.js < arquivo  (primeira linha do arquivo)
 * Argumento opcional: número de iterações (padrão em lib/senha.js; veja scripts/medir-pbkdf2.js).
 *
 * Cole o hash como Secret no painel da hospedagem. Nunca em chat, issue ou commit.
 */
import { gerarHashPbkdf2, ITERACOES_PADRAO } from '../lib/senha.js';

function lerSenhaDoTerminal() {
    return new Promise((resolve) => {
        const entrada = process.stdin;
        process.stderr.write('Senha: ');
        entrada.setRawMode(true);
        entrada.resume();
        entrada.setEncoding('utf8');
        let senha = '';
        entrada.on('data', function aoDigitar(tecla) {
            for (const c of tecla) {
                if (c === '\r' || c === '\n' || c === '\u0004') {
                    entrada.setRawMode(false);
                    entrada.pause();
                    entrada.off('data', aoDigitar);
                    process.stderr.write('\n');
                    resolve(senha);
                    return;
                }
                if (c === '\u0003') process.exit(130); // Ctrl+C
                if (c === '\u007f' || c === '\b') senha = senha.slice(0, -1);
                else senha += c;
            }
        });
    });
}

async function lerSenhaDoPipe() {
    let dados = '';
    for await (const parte of process.stdin) dados += parte;
    return dados.split(/\r?\n/)[0];
}

const iteracoes = process.argv[2] ? Number(process.argv[2]) : ITERACOES_PADRAO;
const senha = process.stdin.isTTY ? await lerSenhaDoTerminal() : await lerSenhaDoPipe();

if (!senha || senha.length < 8) {
    console.error('ERRO: a senha deve ter no mínimo 8 caracteres.');
    process.exit(1);
}

try {
    const hash = await gerarHashPbkdf2(senha, iteracoes);
    console.log(`ADMIN_PASSWORD_HASH="${hash}"`);
} catch (erro) {
    console.error(`ERRO: ${erro.message}`);
    process.exit(1);
}
