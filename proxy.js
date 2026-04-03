import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET;
const secretKey = JWT_SECRET ? new TextEncoder().encode(JWT_SECRET) : null;

export default async function proxy(request) {
    const path = request.nextUrl.pathname;

    // Proteger as rotas do painel /admin (exceto o login)
    const isAdminRoute = path.startsWith('/admin') && path !== '/admin/login';

    // Proteger rotas de API que modificam dados (POST, PUT, DELETE), exceto login e webhooks
    const isProtectedApiRoute = path.startsWith('/api/')
        && !path.startsWith('/api/auth')
        && !path.startsWith('/api/webhook')
        && !path.startsWith('/api/cron')
        && !path.startsWith('/api/comentarios')
        && request.method !== 'GET';

    // Upload é sempre protegido (mesmo GET, se existisse)
    const isUploadRoute = path === '/api/upload';

    // Liberar POST para denúncias (público envia)
    if (path.startsWith('/api/denuncias') && request.method === 'POST') {
        return NextResponse.next();
    }
    // Liberar POST para comentários
    if (path.startsWith('/api/comentarios') && request.method === 'POST') {
        return NextResponse.next();
    }

    if (isAdminRoute || isProtectedApiRoute || isUploadRoute) {
        if (!secretKey) {
            if (isAdminRoute) {
                return NextResponse.redirect(new URL('/admin/login', request.url));
            }
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const token = request.cookies.get('admin_token')?.value;

        if (!token) {
            if (isAdminRoute) {
                return NextResponse.redirect(new URL('/admin/login', request.url));
            }
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        try {
            await jwtVerify(token, secretKey);
            return NextResponse.next();
        } catch {
            if (isAdminRoute) {
                return NextResponse.redirect(new URL('/admin/login', request.url));
            }
            return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 401 });
        }
    }

    // Se o usuário já está logado e tenta acessar o login, manda para o /admin
    if (path === '/admin/login') {
        const token = request.cookies.get('admin_token')?.value;
        if (token && secretKey) {
            try {
                await jwtVerify(token, secretKey);
                return NextResponse.redirect(new URL('/admin', request.url));
            } catch {
                // Token inválido, segue pro login
            }
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*', '/api/:path*'],
};
