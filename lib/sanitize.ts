import sanitizeHtml from 'sanitize-html';

/**
 * Sanitização de HTML de artigos/notícias.
 *
 * Aplicada tanto na entrada (POST/PUT) quanto na exibição (defense in depth).
 * Iframes são restritos a domínios confiáveis (YouTube/Vimeo).
 */
export function sanitizeArticleHtml(html: string): string {
    if (!html || typeof html !== 'string') return '';

    return sanitizeHtml(html, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'h3', 'iframe']),
        allowedAttributes: {
            ...sanitizeHtml.defaults.allowedAttributes,
            img: ['src', 'alt', 'width', 'height', 'style'],
            iframe: ['src', 'width', 'height', 'frameborder', 'allowfullscreen', 'allow'],
            '*': ['class', 'style'],
        },
        allowedSchemes: ['http', 'https', 'data'],
        allowedSchemesByTag: {
            img: ['http', 'https', 'data'],
            iframe: ['https'],
        },
        allowedIframeHostnames: [
            'www.youtube.com',
            'youtube.com',
            'www.youtube-nocookie.com',
            'youtube-nocookie.com',
            'player.vimeo.com',
        ],
        // Impede style com expressões/URLs maliciosas
        allowedStyles: {
            '*': {
                color: [/^#(0x)?[0-9a-f]+$/i, /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/],
                'background-color': [/^#(0x)?[0-9a-f]+$/i, /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/],
                'text-align': [/^left$|^right$|^center$|^justify$/],
                'font-weight': [/^\d+$|^bold$|^normal$/],
                'font-style': [/^italic$|^normal$/],
                'text-decoration': [/^underline$|^none$/],
                'max-width': [/^\d+(\.\d+)?(px|em|rem|%)$/],
                width: [/^\d+(\.\d+)?(px|em|rem|%)$/],
                height: [/^\d+(\.\d+)?(px|em|rem|%)$/],
            },
        },
    });
}

/**
 * Sanitização agressiva de texto simples — remove qualquer HTML.
 * Para nomes, comentários, descrições curtas, etc.
 */
export function sanitizeText(text: string): string {
    if (!text || typeof text !== 'string') return '';
    return sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} }).trim();
}
