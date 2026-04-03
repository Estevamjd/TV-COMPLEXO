import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { isAuthenticated } from '@/lib/auth';

// Magic bytes para validação real do tipo de arquivo
const MAGIC_BYTES = {
    'image/jpeg': [
        [0xFF, 0xD8, 0xFF],
    ],
    'image/png': [
        [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
    ],
    'image/gif': [
        [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
        [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a
    ],
    'image/webp': [
        // RIFF....WEBP (bytes 0-3 = RIFF, bytes 8-11 = WEBP)
        [0x52, 0x49, 0x46, 0x46],
    ],
};

function detectFileType(buffer) {
    const bytes = new Uint8Array(buffer);

    for (const [mimeType, signatures] of Object.entries(MAGIC_BYTES)) {
        for (const signature of signatures) {
            if (signature.every((byte, i) => bytes[i] === byte)) {
                // Verificação extra para WebP: bytes 8-11 devem ser "WEBP"
                if (mimeType === 'image/webp') {
                    if (bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
                        return mimeType;
                    }
                    continue;
                }
                return mimeType;
            }
        }
    }
    return null;
}

// Sanitizar nome do arquivo (remover caracteres perigosos)
function sanitizeFilename(name) {
    return name
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/\.{2,}/g, '.')
        .slice(0, 100);
}

export async function POST(request) {
    try {
        if (!(await isAuthenticated())) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file');

        if (!file || typeof file === 'string') {
            return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
        }

        // Validar tamanho (max 10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: 'Arquivo muito grande. Máximo: 10MB' },
                { status: 400 }
            );
        }

        // Validar tipo por magic bytes (não confiar no MIME type do cliente)
        const arrayBuffer = await file.arrayBuffer();
        const detectedType = detectFileType(arrayBuffer);

        if (!detectedType) {
            return NextResponse.json(
                { error: 'Tipo de arquivo não permitido. Use: JPG, PNG, GIF, WEBP' },
                { status: 400 }
            );
        }

        const safeName = sanitizeFilename(file.name);

        // Upload para Vercel Blob
        const blob = await put(`thumbnails/${Date.now()}-${safeName}`, new Blob([arrayBuffer], { type: detectedType }), {
            access: 'public',
            addRandomSuffix: true,
        });

        return NextResponse.json({
            url: blob.url,
            name: safeName,
            type: detectedType,
            size: file.size,
        });
    } catch (error) {
        console.error('[upload]', error);
        return NextResponse.json(
            { error: 'Erro interno ao fazer upload' },
            { status: 500 }
        );
    }
}
