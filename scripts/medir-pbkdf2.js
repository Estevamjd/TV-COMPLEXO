#!/usr/bin/env node
/**
 * Mede o custo de CPU do PBKDF2-SHA256 (WebCrypto) e sugere as iterações que cabem no orçamento.
 *
 * Uso: node scripts/medir-pbkdf2.js [orçamento_ms=10] [fração_para_o_hash=0.5]
 *
 * O plano grátis do Workers dá 10 ms de CPU por requisição. O login ainda faz parse do JSON,
 * assina o JWT e grava o cookie, então por padrão o hash fica com metade (5 ms).
 * A CPU da Cloudflare não é a desta máquina: confira no preview (Metrics → CPU time) antes de fechar.
 * Usa só uma senha fictícia; nenhuma senha real é lida.
 */
import { ITERACOES_MAX } from '../lib/senha.js';

const orcamentoMs = Number(process.argv[2] ?? 10);
const fracao = Number(process.argv[3] ?? 0.5);
const SENHA_FICTICIA = 'senha-ficticia-de-medicao';
const sal = crypto.getRandomValues(new Uint8Array(16));

async function cpuMs(iteracoes) {
    const chave = await crypto.subtle.importKey('raw', new TextEncoder().encode(SENHA_FICTICIA), 'PBKDF2', false, ['deriveBits']);
    // cpuUsage soma todas as threads do processo, inclusive a do WebCrypto.
    const antes = process.cpuUsage();
    await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: sal, iterations: iteracoes }, chave, 256);
    const uso = process.cpuUsage(antes);
    return (uso.user + uso.system) / 1000;
}

async function mediana(iteracoes, rodadas = 7) {
    const tempos = [];
    for (let i = 0; i < rodadas; i++) tempos.push(await cpuMs(iteracoes));
    tempos.sort((a, b) => a - b);
    return tempos[Math.floor(rodadas / 2)];
}

await mediana(10000, 3); // aquecimento

console.log('iterações   CPU (ms, mediana)');
let porMil = Infinity;
for (const n of [10000, 20000, 50000, 100000]) {
    const ms = await mediana(n);
    porMil = Math.min(porMil, (ms / n) * 1000 || Infinity);
    console.log(`${String(n).padStart(9)}   ${ms.toFixed(2)}`);
}

const alvoMs = orcamentoMs * fracao;
// porMil = ms de CPU a cada mil iterações (o menor medido, sem o custo fixo pesando).
const sugerido = Math.min(ITERACOES_MAX, Math.max(1000, Math.floor(alvoMs / porMil) * 1000));
console.log(`\nOrçamento: ${orcamentoMs} ms de CPU; para o hash: ${alvoMs.toFixed(1)} ms.`);
console.log(`Sugestão para esta máquina: ${sugerido} iterações (máximo aceito pelo Workers: ${ITERACOES_MAX}).`);
console.log('Gere o hash com: node scripts/gerar-hash-pbkdf2.js [iterações]  (a senha vem pela entrada padrão)');
