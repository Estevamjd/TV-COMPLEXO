import { afterEach, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

// Executa o efeito real de polling com estados e relógio controlados, sem DOM ou rede.
const hooks = vi.hoisted(() => ({ estados: [], efeitos: [], cursor: 0 }));
vi.mock('react', async importOriginal => ({
    ...await importOriginal(),
    useState(inicial) {
        const i = hooks.cursor++;
        if (i >= hooks.estados.length) hooks.estados.push(typeof inicial === 'function' ? inicial() : inicial);
        return [hooks.estados[i], valor => { hooks.estados[i] = typeof valor === 'function' ? valor(hooks.estados[i]) : valor; }];
    },
    useRef: valor => ({ current: valor }),
    useEffect: efeito => hooks.efeitos.push(efeito),
}));
vi.mock('next/image', () => ({ default: () => null }));
vi.mock('next/link', () => ({ default: () => null }));
import CanalTopo from '@/components/home-urbano/CanalTopo';

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); hooks.estados = []; hooks.efeitos = []; hooks.cursor = 0; });

it.each([true, false, undefined])('nunca mostra o aviso de demonstração da detecção (demo=%s)', async demo => {
    vi.useFakeTimers();
    vi.stubGlobal('document', { visibilityState: 'visible', addEventListener: vi.fn(), removeEventListener: vi.fn() });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ live: false, demo }))));
    const props = { agoraInicial: Date.now() };
    CanalTopo(props);
    const limpar = hooks.efeitos[2]();
    await vi.advanceTimersByTimeAsync(0);
    hooks.cursor = 0;
    const html = renderToStaticMarkup(CanalTopo(props));
    expect(html).not.toContain('Demonstração: detecção automática de live desligada');
    expect(html).not.toMatch(/detecção automática/i);
    limpar();
});

it.each(['http', 'exceção', 'resposta inválida'])('preserva live e player em %s e tenta novamente no próximo ciclo', async erro => {
    vi.useFakeTimers();
    vi.stubGlobal('document', { visibilityState: 'visible', addEventListener: vi.fn(), removeEventListener: vi.fn() });
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ live: true, videoId: 'live-id', titulo: 'Live atual', inicio: null })));
    if (erro === 'http') fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ live: false }), { status: 503 }));
    else if (erro === 'exceção') fetchMock.mockRejectedValueOnce(new Error('offline'));
    else fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ error: 'indisponível' })));
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ live: false })));
    vi.stubGlobal('fetch', fetchMock);
    CanalTopo({ agoraInicial: Date.now() });
    const limpar = hooks.efeitos[2]();
    await vi.advanceTimersByTimeAsync(0);
    expect(hooks.estados[2]?.videoId).toBe('live-id');
    // Simula o espectador já assistindo à transmissão encontrada.
    const player = { live: true, id: 'live-id', start: 0 };
    hooks.estados[3] = player;
    await vi.advanceTimersByTimeAsync(120_000);
    expect(hooks.estados[2]?.videoId).toBe('live-id');
    expect(hooks.estados[3]).toBe(player);
    expect(hooks.estados[4]).not.toContain('acabou');
    await vi.advanceTimersByTimeAsync(120_000);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock).toHaveBeenCalledWith('/api/live', { cache: 'no-store' });
    expect(hooks.estados[2]).toBeNull();
    expect(hooks.estados[3]).not.toBe(player);
    expect(hooks.estados[4]).toContain('A live acabou');
    limpar();
});
