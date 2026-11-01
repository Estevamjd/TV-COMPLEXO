/**
 * Hash da senha do painel: PBKDF2-SHA256 pelo WebCrypto (nativo no Node e no Cloudflare Workers).
 *
 * Formato: pbkdf2$<iterações>$<sal em base64>$<hash em base64>
 * Hashes bcrypt antigos ($2a$/$2b$/$2y$) continuam aceitos, mas o bcrypt custo 12 em JS puro
 * passa do limite de 10 ms de CPU do plano grátis do Workers. Gere um hash novo com
 * scripts/gerar-hash-pbkdf2.js. As iterações saem de scripts/medir-pbkdf2.js.
 */
import bcrypt from 'bcryptjs';

/**
 * Padrão dos hashes novos. scripts/medir-pbkdf2.js (01/11/2026, máquina de dev): ~0,135 ms de CPU
 * a cada mil iterações, então 30 mil ≈ 4 ms, perto da metade dos 10 ms do Workers grátis.
 * As iterações ficam gravadas no hash: dá para subir depois sem quebrar os hashes antigos.
 */
export const ITERACOES_PADRAO = 30000;
/** O Workers recusa PBKDF2 acima de 100 mil iterações. */
export const ITERACOES_MAX = 100000;
const ITERACOES_MIN = 1000;
const BYTES_SAL = 16;
const BYTES_HASH = 32;

const base64 = (bytes) => btoa(String.fromCharCode(...bytes));

function deBase64(texto) {
    const bin = atob(texto);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
}

async function derivar(senha, sal, iteracoes, bytes) {
    const chave = await crypto.subtle.importKey('raw', new TextEncoder().encode(senha), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: sal, iterations: iteracoes }, chave, bytes * 8);
    return new Uint8Array(bits);
}

/** Comparação em tempo constante (não para no primeiro byte diferente). */
export function iguaisTempoConstante(a, b) {
    let diferenca = a.length ^ b.length;
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
        diferenca |= (a[i] ?? 0) ^ (b[i] ?? 0);
    }
    return diferenca === 0;
}

export async function gerarHashPbkdf2(senha, iteracoes = ITERACOES_PADRAO) {
    if (!Number.isInteger(iteracoes) || iteracoes < ITERACOES_MIN || iteracoes > ITERACOES_MAX) {
        throw new Error(`Iterações devem ficar entre ${ITERACOES_MIN} e ${ITERACOES_MAX}`);
    }
    const sal = crypto.getRandomValues(new Uint8Array(BYTES_SAL));
    const hash = await derivar(senha, sal, iteracoes, BYTES_HASH);
    return `pbkdf2$${iteracoes}$${base64(sal)}$${base64(hash)}`;
}

/** Lê pbkdf2$<iter>$<sal>$<hash>. Devolve null se o formato não bater. */
export function lerHashPbkdf2(hash) {
    const partes = String(hash).split('$');
    if (partes.length !== 4 || partes[0] !== 'pbkdf2' || !/^\d+$/.test(partes[1])) return null;
    const iteracoes = Number(partes[1]);
    if (iteracoes < ITERACOES_MIN || iteracoes > ITERACOES_MAX) return null;
    try {
        const sal = deBase64(partes[2]);
        const esperado = deBase64(partes[3]);
        if (sal.length < 8 || esperado.length < 16) return null;
        return { iteracoes, sal, esperado };
    } catch {
        return null;
    }
}

/** Confere a senha contra um hash PBKDF2 (pbkdf2$…) ou bcrypt ($2…). Formato desconhecido: false. */
export async function verificarSenha(senha, hash) {
    if (typeof senha !== 'string' || typeof hash !== 'string') return false;
    if (hash.startsWith('$2')) return bcrypt.compare(senha, hash);
    const lido = lerHashPbkdf2(hash);
    if (!lido) return false;
    const calculado = await derivar(senha, lido.sal, lido.iteracoes, lido.esperado.length);
    return iguaisTempoConstante(calculado, lido.esperado);
}
