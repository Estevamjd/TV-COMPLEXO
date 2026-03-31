// Rate limiter em memória (funciona em serverless com cold starts)
const requests = new Map();

const WINDOW_MS = 60 * 1000; // 1 minuto
const MAX_REQUESTS = 5; // máximo 5 requests por minuto por IP

export function rateLimit(request) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || request.headers.get('x-real-ip')
        || 'unknown';

    const now = Date.now();
    const windowStart = now - WINDOW_MS;

    // Limpar entradas antigas
    const timestamps = (requests.get(ip) || []).filter(t => t > windowStart);

    if (timestamps.length >= MAX_REQUESTS) {
        return { allowed: false, remaining: 0 };
    }

    timestamps.push(now);
    requests.set(ip, timestamps);

    // Limpeza periódica do map (evitar memory leak)
    if (requests.size > 1000) {
        for (const [key, times] of requests) {
            if (times.every(t => t < windowStart)) {
                requests.delete(key);
            }
        }
    }

    return { allowed: true, remaining: MAX_REQUESTS - timestamps.length };
}
