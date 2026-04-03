/**
 * Rate limiter para Vercel Serverless.
 */

interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    retryAfter: number | null;
}

interface RateLimitOptions {
    windowMs?: number;
    maxRequests?: number;
    namespace?: string;
}

interface RequestLike {
    headers: {
        get(key: string): string | null;
    };
}

const stores = new Map<string, Map<string, number[]>>();

function getStore(namespace: string): Map<string, number[]> {
    if (!stores.has(namespace)) {
        stores.set(namespace, new Map());
    }
    return stores.get(namespace)!;
}

export function rateLimit(request: RequestLike, options: RateLimitOptions = {}): RateLimitResult {
    const {
        windowMs = 60 * 1000,
        maxRequests = 5,
        namespace = 'default',
    } = options;

    const ip = request.headers.get('x-real-ip')
        || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || 'unknown';

    const now = Date.now();
    const windowStart = now - windowMs;
    const store = getStore(namespace);

    if (store.size > 500) {
        for (const [key, times] of store) {
            const valid = times.filter(t => t > windowStart);
            if (valid.length === 0) {
                store.delete(key);
            } else {
                store.set(key, valid);
            }
        }
    }

    const timestamps = (store.get(ip) || []).filter(t => t > windowStart);

    if (timestamps.length >= maxRequests) {
        const oldestInWindow = timestamps[0];
        const retryAfter = Math.ceil((oldestInWindow + windowMs - now) / 1000);
        return { allowed: false, remaining: 0, retryAfter };
    }

    timestamps.push(now);
    store.set(ip, timestamps);

    return {
        allowed: true,
        remaining: maxRequests - timestamps.length,
        retryAfter: null,
    };
}

export function rateLimitResponse(request: RequestLike, options: RateLimitOptions = {}): Response | null {
    const result = rateLimit(request, options);

    if (!result.allowed) {
        return new Response(
            JSON.stringify({ error: 'Muitas tentativas. Aguarde um momento.' }),
            {
                status: 429,
                headers: {
                    'Content-Type': 'application/json',
                    'Retry-After': String(result.retryAfter || 60),
                    'X-RateLimit-Limit': String(options.maxRequests || 5),
                    'X-RateLimit-Remaining': '0',
                },
            }
        );
    }

    return null;
}
