/**
 * URL base única do site (R1).
 *
 * Ordem: NEXT_PUBLIC_SITE_URL → https://${VERCEL_URL} (Preview/Produção na Vercel)
 * → http://localhost:3000 (dev). Sem domínio fixo no código: o domínio próprio,
 * quando existir, entra só pela env.
 */
export function getSiteUrl(env = process.env) {
    const explicit = (env.NEXT_PUBLIC_SITE_URL || '').trim();
    if (explicit) return stripTrailingSlash(explicit);

    const vercel = (env.VERCEL_URL || '').trim();
    if (vercel) return stripTrailingSlash(`https://${vercel.replace(/^https?:\/\//, '')}`);

    return 'http://localhost:3000';
}

function stripTrailingSlash(url) {
    return url.replace(/\/+$/, '');
}

export const SITE_URL = getSiteUrl();
