import { NextResponse } from 'next/server';

/**
 * GET /api/hora — hora do servidor em ms, para o relógio do canal 24h.
 * Sem banco e sem cache: a resposta tem que sair na hora para o cliente
 * medir a ida e volta e compensar a latência.
 */
export const dynamic = 'force-dynamic';

export function GET() {
    return NextResponse.json({ agora: Date.now() }, { headers: { 'Cache-Control': 'no-store' } });
}
