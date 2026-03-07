require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function updateDB() {
    console.log('Iniciando atualização das tabelas...');

    try {
        // Adiciona o campo external_id se ele não existir e garante que ele seja único
        await pool.query(`
      ALTER TABLE videos 
      ADD COLUMN IF NOT EXISTS external_id TEXT UNIQUE;
      
      -- Adiciona published_at caso precise guardar a data de criação original na rede social
      ALTER TABLE videos 
      ADD COLUMN IF NOT EXISTS published_at TIMESTAMP;
      
      -- Atualizar autor para suportar o perfil que enviou
      ALTER TABLE videos
      ADD COLUMN IF NOT EXISTS author TEXT;
    `);

        console.log('Tabelas atualizadas com sucesso! As colunas de external_id, published_at e author foram garantidas.');
    } catch (err) {
        console.error('Erro ao atualizar tabelas:', err);
    } finally {
        pool.end();
    }
}

updateDB();
