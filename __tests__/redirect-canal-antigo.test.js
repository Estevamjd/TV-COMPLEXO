import { describe, it, expect } from 'vitest';
import nextConfig from '../next.config.mjs';

// O Canal 24h saiu do site: os endereços antigos levam para a Início (sem 404).
describe('endereços do canal antigo', () => {
    it.each(['/canal24h', '/canal-24h', '/24h'])('%s redireciona para a Início (permanente)', async source => {
        const regras = await nextConfig.redirects();
        expect(regras.filter(r => r.source === source)).toEqual([{ source, destination: '/', permanent: true }]);
    });
});
