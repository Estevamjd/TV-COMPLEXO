import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file || typeof file === 'string') {
            return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
        }

        // Validar tipo
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: 'Tipo não permitido. Use: JPG, PNG, GIF, WEBP' },
                { status: 400 }
            );
        }

        // Validar tamanho (max 10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: 'Arquivo muito grande. Máximo: 10MB' },
                { status: 400 }
            );
        }

        // Upload para Vercel Blob
        const blob = await put(`thumbnails/${Date.now()}-${file.name}`, file, {
            access: 'public',
            addRandomSuffix: true,
        });

        return NextResponse.json({
            url: blob.url,
            name: file.name,
            type: file.type,
            size: file.size,
        });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: 'Erro interno ao fazer upload' },
            { status: 500 }
        );
    }
}
