require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const coords = {
    'Complexo do Alemão': { lat: -22.8575, lng: -43.2650 },
    'Rocinha': { lat: -22.9880, lng: -43.2480 },
    'Cidade de Deus': { lat: -22.9480, lng: -43.3620 },
    'Maré': { lat: -22.8620, lng: -43.2430 },
    'Vidigal': { lat: -22.9940, lng: -43.2330 },
    'Jacarezinho': { lat: -22.8880, lng: -43.2620 },
    'Manguinhos': { lat: -22.8820, lng: -43.2500 },
    'Penha': { lat: -22.8410, lng: -43.2710 },
};

async function fix() {
    const { rows } = await pool.query('SELECT id, comunidade FROM denuncias WHERE latitude IS NULL OR longitude IS NULL');
    console.log(`Encontradas ${rows.length} denúncias sem coordenadas`);

    for (const d of rows) {
        const c = coords[d.comunidade];
        if (!c) { console.log(`  Sem coords para: ${d.comunidade}`); continue; }
        // Pequena variação para não sobrepor marcadores
        const lat = c.lat + (Math.random() - 0.5) * 0.006;
        const lng = c.lng + (Math.random() - 0.5) * 0.006;
        await pool.query('UPDATE denuncias SET latitude = $1, longitude = $2 WHERE id = $3', [lat, lng, d.id]);
        console.log(`  Atualizada: ${d.id.slice(0,8)} (${d.comunidade}) -> ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }

    console.log('Concluído!');
    pool.end();
}

fix();
