import { describe, it, expect } from 'vitest';
import nextConfig from '../next.config.mjs';

describe('/mapa', () => {
    it('redireciona para /denuncias (permanente)', async () => {
        const regras = await nextConfig.redirects();
        const mapa = regras.filter(r => r.source === '/mapa');
        expect(mapa).toEqual([{ source: '/mapa', destination: '/denuncias', permanent: true }]);
    });
});
