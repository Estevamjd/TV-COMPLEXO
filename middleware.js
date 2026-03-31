import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request) {
    const { pathname } = request.nextUrl;

    // Proteger rotas /admin (exceto /admin/login)
    if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
        const token = request.cookies.get('admin_token')?.value;

        if (!token) {
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }

        try {
            const secret = process.env.JWT_SECRET;
            if (!secret) {
                return NextResponse.redirect(new URL('/admin/login', request.url));
            }
            const secretKey = new TextEncoder().encode(secret);
            await jwtVerify(token, secretKey);
        } catch {
            // Token inválido ou expirado
            const response = NextResponse.redirect(new URL('/admin/login', request.url));
            response.cookies.delete('admin_token');
            return response;
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*'],
};
