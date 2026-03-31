require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function fetchThumbnail(url) {
    try {
        // noembed.com — serviço gratuito que suporta Instagram, TikTok, etc.
        const noembedUrl = `https://noembed.com/embed?url=${encodeURIComponent(url)}`;
        const res = await fetch(noembedUrl, { signal: AbortSignal.timeout(8000) });
        if (res.ok) {
            const data = await res.json();
            if (data.thumbnail_url) return data.thumbnail_url;
        }
    } catch (err) {
        console.log(`  Erro ao buscar thumbnail: ${err.message}`);
    }
    return null;
}

async function fix() {
    const { rows } = await pool.query(
        "SELECT id, titulo, url_video, plataforma, thumbnail FROM videos WHERE (thumbnail IS NULL OR thumbnail = '' OR thumbnail NOT LIKE 'http%') ORDER BY created_at DESC"
    );

    console.log(`Encontrados ${rows.length} vídeos sem thumbnail válida\n`);

    let updated = 0;
    for (const v of rows) {
        console.log(`  Buscando: ${v.titulo?.slice(0, 50)}... (${v.plataforma})`);

        const thumb = await fetchThumbnail(v.url_video);
        if (thumb) {
            await pool.query('UPDATE videos SET thumbnail = $1 WHERE id = $2', [thumb, v.id]);
            console.log(`    ✅ Thumbnail encontrada: ${thumb.slice(0, 80)}...`);
            updated++;
        } else {
            console.log(`    ❌ Sem thumbnail disponível`);
        }

        // Rate limit — esperar 500ms entre requests
        await new Promise(r => setTimeout(r, 500));
    }

    console.log(`\nConcluído: ${updated}/${rows.length} thumbnails atualizadas`);
    pool.end();
}

fix();
