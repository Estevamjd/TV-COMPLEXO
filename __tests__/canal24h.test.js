import { describe, it, expect } from 'vitest';
import { posicaoCanal, podeEmbutir } from '@/lib/canal24h';
import { agoraBrasilia, programaAgora } from '@/lib/grade';

const videos = [
    { youtubeId: 'aaaaaaaaaaa', titulo: 'A', duracaoSeg: 60 },
    { youtubeId: 'bbbbbbbbbbb', titulo: 'B', duracaoSeg: 120 },
];
const epoch = Date.parse('2026-01-05T00:00:00-03:00');

describe('canal 24h', () => {
    it('acha o vídeo e o segundo pelo relógio', () => {
        const p = posicaoCanal(epoch + 90_000, videos, epoch);
        expect(p.atual.titulo).toBe('B');
        expect(p.offsetSeg).toBe(30);
        expect(p.proximo.titulo).toBe('A');
        expect(p.fimMs - p.inicioMs).toBe(120_000);
    });

    it('dá a volta na playlist (mod duração total)', () => {
        const p = posicaoCanal(epoch + 180_000 * 5 + 10_000, videos, epoch);
        expect(p.atual.titulo).toBe('A');
        expect(p.offsetSeg).toBe(10);
    });

    it('funciona antes do epoch', () => {
        const p = posicaoCanal(epoch - 10_000, videos, epoch);
        expect(p.atual.titulo).toBe('B');
        expect(p.offsetSeg).toBe(110);
    });

    it('playlist vazia não quebra', () => {
        expect(posicaoCanal(epoch, [], epoch)).toBeNull();
    });

    it('placeholder nunca vira embed', () => {
        expect(podeEmbutir({ youtubeId: 'EXEMPLO0001', placeholder: true })).toBe(false);
        expect(podeEmbutir({ youtubeId: 'curto' })).toBe(false);
        expect(podeEmbutir({ youtubeId: 'aaaaaaaaaaa' })).toBe(true);
    });
});

describe('grade', () => {
    it('dia e hora em Brasília', () => {
        // 28/10/2026 é quarta; 02:30 UTC = 23:30 de terça em Brasília
        expect(agoraBrasilia(Date.parse('2026-10-28T02:30:00Z'))).toEqual({ dia: 'ter', minuto: 23 * 60 + 30 });
    });

    it('programa do horário', () => {
        const progs = [{ titulo: 'X', inicio: '19:00', fim: '20:00' }];
        expect(programaAgora(progs, 19 * 60 + 5)?.titulo).toBe('X');
        expect(programaAgora(progs, 20 * 60)).toBeNull();
    });
});
