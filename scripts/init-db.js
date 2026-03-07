require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function initDB() {
  console.log('Iniciando criação das tabelas...');

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS videos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        titulo TEXT NOT NULL,
        descricao TEXT,
        url_video TEXT NOT NULL,
        thumbnail TEXT,
        plataforma TEXT DEFAULT 'manual',
        categoria TEXT DEFAULT 'geral',
        destaque INTEGER DEFAULT 0,
        author TEXT,
        external_id TEXT UNIQUE,
        published_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS noticias (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        titulo TEXT NOT NULL,
        resumo TEXT,
        conteudo TEXT NOT NULL,
        imagem TEXT,
        categoria TEXT DEFAULT 'geral',
        autor TEXT DEFAULT 'TV Complexo',
        publicada INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS denuncias (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nome TEXT DEFAULT 'Anônimo',
        comunidade TEXT NOT NULL,
        local_problema TEXT NOT NULL,
        tipo TEXT NOT NULL,
        descricao TEXT NOT NULL,
        latitude REAL,
        longitude REAL,
        midia TEXT,
        status TEXT DEFAULT 'pendente',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS comentarios (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        noticia_id UUID NOT NULL,
        autor TEXT DEFAULT 'Anônimo',
        texto TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (noticia_id) REFERENCES noticias(id) ON DELETE CASCADE
      );
      
      -- Tabela para usuários administradores
      CREATE TABLE IF NOT EXISTS admins (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        nome TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Tabelas criadas com sucesso!');
  } catch (err) {
    console.error('Erro ao criar tabelas:', err);
  } finally {
    pool.end();
  }
}

initDB();
