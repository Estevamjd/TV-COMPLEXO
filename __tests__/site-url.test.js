import { describe, it, expect } from 'vitest';
import { getSiteUrl } from '@/lib/site-url';

describe('getSiteUrl (R1)', () => {
    it('usa NEXT_PUBLIC_SITE_URL quando definida (sem barra final)', () => {
        expect(getSiteUrl({ NEXT_PUBLIC_SITE_URL: 'https://tv-complexo.vercel.app/', VERCEL_URL: 'x.vercel.app' }))
            .toBe('https://tv-complexo.vercel.app');
    });

    it('cai para https://VERCEL_URL no Preview', () => {
        expect(getSiteUrl({ VERCEL_URL: 'tv-complexo-git-fase1.vercel.app' }))
            .toBe('https://tv-complexo-git-fase1.vercel.app');
    });

    it('cai para localhost sem env', () => {
        expect(getSiteUrl({})).toBe('http://localhost:3000');
    });

    it('ignora env vazia', () => {
        expect(getSiteUrl({ NEXT_PUBLIC_SITE_URL: '  ', VERCEL_URL: '' })).toBe('http://localhost:3000');
    });
});
