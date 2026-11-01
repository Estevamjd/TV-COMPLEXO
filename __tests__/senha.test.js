import { describe, it, expect } from 'vitest';
import bcrypt from 'bcryptjs';
import { gerarHashPbkdf2, verificarSenha, lerHashPbkdf2, iguaisTempoConstante, ITERACOES_PADRAO, ITERACOES_MAX } from '@/lib/senha';

// Só senhas fictícias. Iterações baixas nos testes para rodar rápido (o mínimo aceito é 1000).
const SENHA = 'senha-ficticia-de-teste';

describe('PBKDF2-SHA256 (WebCrypto)', () => {
    it('gera pbkdf2$<iter>$<sal b64>$<hash b64> e confere a senha certa', async () => {
        const hash = await gerarHashPbkdf2(SENHA, 1000);
        expect(hash).toMatch(/^pbkdf2\$1000\$[A-Za-z0-9+/]+=*\$[A-Za-z0-9+/]+=*$/);
        const lido = lerHashPbkdf2(hash);
        expect(lido.sal).toHaveLength(16);
        expect(lido.esperado).toHaveLength(32);
        expect(await verificarSenha(SENHA, hash)).toBe(true);
    });

    it('recusa senha errada, vazia ou com diferença de maiúscula', async () => {
        const hash = await gerarHashPbkdf2(SENHA, 1000);
        for (const errada of ['senha-errada', '', SENHA.toUpperCase(), `${SENHA} `]) {
            expect(await verificarSenha(errada, hash)).toBe(false);
        }
    });

    it('sal aleatório: a mesma senha dá hashes diferentes', async () => {
        expect(await gerarHashPbkdf2(SENHA, 1000)).not.toBe(await gerarHashPbkdf2(SENHA, 1000));
    });

    it('confere um hash montado à parte (sal fixo) e usa as iterações gravadas no hash', async () => {
        // Hash montado à mão com sal fixo, para garantir que a verificação não depende do gerador.
        const sal = new TextEncoder().encode('sal-fixo-de-teste');
        const chave = await crypto.subtle.importKey('raw', new TextEncoder().encode(SENHA), 'PBKDF2', false, ['deriveBits']);
        const bits = new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: sal, iterations: 1000 }, chave, 256));
        const b64 = (b) => Buffer.from(b).toString('base64');
        expect(await verificarSenha(SENHA, `pbkdf2$1000$${b64(sal)}$${b64(bits)}`)).toBe(true);
        expect(await verificarSenha(SENHA, `pbkdf2$1001$${b64(sal)}$${b64(bits)}`)).toBe(false);
    });

    it.each([
        'pbkdf2$abc$AAAA$BBBB',
        'pbkdf2$1000$sal',
        `pbkdf2$${ITERACOES_MAX + 1}$c2FsLWZpeG8tZGUtdGVzdGU=$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=`,
        'pbkdf2$999$c2FsLWZpeG8tZGUtdGVzdGU=$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
        'pbkdf2$1000$!!!$???',
        'sha1$1000$abc$def',
        '',
    ])('formato inválido (%j): false, sem lançar erro', async (hash) => {
        await expect(verificarSenha(SENHA, hash)).resolves.toBe(false);
    });

    it('gerador recusa iterações fora da faixa aceita pelo Workers', async () => {
        await expect(gerarHashPbkdf2(SENHA, ITERACOES_MAX + 1)).rejects.toThrow();
        await expect(gerarHashPbkdf2(SENHA, 10)).rejects.toThrow();
        expect(ITERACOES_PADRAO).toBeLessThanOrEqual(ITERACOES_MAX);
    });

    it('comparação em tempo constante', () => {
        const a = new Uint8Array([1, 2, 3]);
        expect(iguaisTempoConstante(a, new Uint8Array([1, 2, 3]))).toBe(true);
        expect(iguaisTempoConstante(a, new Uint8Array([1, 2, 4]))).toBe(false);
        expect(iguaisTempoConstante(a, new Uint8Array([1, 2]))).toBe(false);
        expect(iguaisTempoConstante(a, new Uint8Array([1, 2, 3, 0]))).toBe(false);
    });
});

describe('bcrypt legado ($2...)', () => {
    it('hashes bcrypt continuam aceitos', async () => {
        const hash = await bcrypt.hash(SENHA, 4);
        expect(await verificarSenha(SENHA, hash)).toBe(true);
        expect(await verificarSenha('senha-errada', hash)).toBe(false);
    });
});
