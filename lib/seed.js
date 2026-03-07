const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'tvcomplexo.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables first
db.exec(`
  CREATE TABLE IF NOT EXISTS videos (
    id TEXT PRIMARY KEY,
    titulo TEXT NOT NULL,
    descricao TEXT,
    url_video TEXT NOT NULL,
    thumbnail TEXT,
    plataforma TEXT DEFAULT 'manual',
    categoria TEXT DEFAULT 'geral',
    destaque INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS noticias (
    id TEXT PRIMARY KEY,
    titulo TEXT NOT NULL,
    resumo TEXT,
    conteudo TEXT NOT NULL,
    imagem TEXT,
    categoria TEXT DEFAULT 'geral',
    autor TEXT DEFAULT 'TV Complexo',
    publicada INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS denuncias (
    id TEXT PRIMARY KEY,
    nome TEXT DEFAULT 'Anônimo',
    comunidade TEXT NOT NULL,
    local_problema TEXT NOT NULL,
    tipo TEXT NOT NULL,
    descricao TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    midia TEXT,
    status TEXT DEFAULT 'pendente',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS comentarios (
    id TEXT PRIMARY KEY,
    noticia_id TEXT NOT NULL,
    autor TEXT DEFAULT 'Anônimo',
    texto TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (noticia_id) REFERENCES noticias(id) ON DELETE CASCADE
  );
`);

// Clear existing data
db.exec('DELETE FROM comentarios');
db.exec('DELETE FROM denuncias');
db.exec('DELETE FROM noticias');
db.exec('DELETE FROM videos');

// Seed Videos
const insertVideo = db.prepare(`
  INSERT INTO videos (id, titulo, descricao, url_video, thumbnail, plataforma, categoria, destaque, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const videos = [
    {
        id: uuidv4(),
        titulo: 'Funk e Cultura: O Som que Nasce na Favela',
        descricao: 'Documentário sobre a cena cultural do Complexo do Alemão, mostrando como o funk e a música moldam a identidade da comunidade.',
        url_video: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        thumbnail: '',
        plataforma: 'youtube',
        categoria: 'cultura',
        destaque: 1,
        created_at: '2026-03-01 14:00:00'
    },
    {
        id: uuidv4(),
        titulo: 'Moradores Denunciam Falta de Água no Alemão',
        descricao: 'Há mais de uma semana sem água, moradores do Complexo do Alemão mostram a realidade da falta de saneamento básico.',
        url_video: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        thumbnail: '',
        plataforma: 'instagram',
        categoria: 'noticias',
        destaque: 1,
        created_at: '2026-03-02 10:30:00'
    },
    {
        id: uuidv4(),
        titulo: 'Projeto Social Transforma Vidas na Comunidade',
        descricao: 'Conheça o projeto que ensina programação para jovens da favela e está mudando a realidade de diversas famílias.',
        url_video: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        thumbnail: '',
        plataforma: 'facebook',
        categoria: 'comunidade',
        destaque: 0,
        created_at: '2026-03-03 16:00:00'
    },
    {
        id: uuidv4(),
        titulo: 'Baile Funk no Complexo do Alemão - Cultura Viva',
        descricao: 'Registro do baile que reuniu milhares de pessoas e celebrou a cultura local.',
        url_video: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        thumbnail: '',
        plataforma: 'instagram',
        categoria: 'eventos',
        destaque: 0,
        created_at: '2026-03-04 20:00:00'
    },
    {
        id: uuidv4(),
        titulo: 'Teleférico do Alemão: Abandono e Esperança',
        descricao: 'Reportagem sobre a situação atual do teleférico do Complexo do Alemão e o que os moradores pensam sobre o futuro do transporte.',
        url_video: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        thumbnail: '',
        plataforma: 'youtube',
        categoria: 'noticias',
        destaque: 1,
        created_at: '2026-03-05 08:00:00'
    },
    {
        id: uuidv4(),
        titulo: 'Gastronomia da Favela: Sabores que Você Precisa Conhecer',
        descricao: 'Tour gastronômico pela comunidade mostrando os melhores pratos e empreendedores locais.',
        url_video: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        thumbnail: '',
        plataforma: 'youtube',
        categoria: 'cultura',
        destaque: 0,
        created_at: '2026-02-28 12:00:00'
    }
];

videos.forEach(v => {
    insertVideo.run(v.id, v.titulo, v.descricao, v.url_video, v.thumbnail, v.plataforma, v.categoria, v.destaque, v.created_at);
});

// Seed Notícias
const insertNoticia = db.prepare(`
  INSERT INTO noticias (id, titulo, resumo, conteudo, imagem, categoria, autor, publicada, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const noticiaId1 = uuidv4();
const noticiaId2 = uuidv4();
const noticiaId3 = uuidv4();

const noticias = [
    {
        id: noticiaId1,
        titulo: 'Comunidade se Mobiliza Contra Falta de Saneamento',
        resumo: 'Moradores do Complexo do Alemão organizam manifestação pacífica para cobrar melhorias no saneamento básico.',
        conteudo: `<p>Mais de 500 moradores do Complexo do Alemão participaram de uma manifestação pacífica nesta terça-feira para cobrar das autoridades melhorias urgentes no sistema de saneamento básico da comunidade.</p>
<p>Segundo os organizadores, diversas ruas da comunidade sofrem com esgoto a céu aberto, falta de água e acúmulo de lixo. "Não pedimos luxo, pedimos dignidade", disse Maria da Silva, uma das líderes do movimento.</p>
<p>A Prefeitura informou que uma equipe técnica será enviada para avaliar a situação e prometeu apresentar um plano de ação em até 15 dias.</p>
<p>Os moradores afirmam que irão acompanhar de perto o cumprimento das promessas e que novas mobilizações podem ocorrer caso não haja avanços concretos.</p>`,
        imagem: '',
        categoria: 'comunidade',
        autor: 'Equipe TV Complexo',
        publicada: 1,
        created_at: '2026-03-04 09:00:00'
    },
    {
        id: noticiaId2,
        titulo: 'Escola de Música Abre Vagas Gratuitas para Jovens',
        resumo: 'Projeto oferece aulas de instrumentos e canto para crianças e adolescentes da região.',
        conteudo: `<p>A Escola de Música Comunidade Viva está com inscrições abertas para 100 novas vagas gratuitas em aulas de violão, teclado, percussão e canto.</p>
<p>O projeto, que funciona há 5 anos na comunidade, já formou mais de 300 alunos e tem como objetivo oferecer uma alternativa cultural para os jovens da região.</p>
<p>"A música transforma vidas. Muitos dos nossos alunos descobriram uma profissão através da arte", afirmou o coordenador do projeto, João Carlos.</p>
<p>As inscrições podem ser feitas presencialmente na sede do projeto ou pelo WhatsApp (21) 99999-0000.</p>`,
        imagem: '',
        categoria: 'cultura',
        autor: 'TV Complexo',
        publicada: 1,
        created_at: '2026-03-03 14:00:00'
    },
    {
        id: noticiaId3,
        titulo: 'Operação Policial Causa Tiroteio e Fecha Escolas',
        resumo: 'Moradores relatam momentos de terror durante operação policial no Complexo do Alemão.',
        conteudo: `<p>Uma operação policial realizada na manhã desta quarta-feira no Complexo do Alemão causou intenso tiroteio e obrigou o fechamento de pelo menos 8 escolas da região.</p>
<p>Moradores relataram que ficaram presos em casa durante horas, sem poder sair para trabalhar ou levar os filhos à escola. Vídeos nas redes sociais mostram o desespero de famílias que se abrigaram no chão de suas casas.</p>
<p>"Toda semana é isso. A gente não tem paz", desabafou Dona Joana, moradora há 40 anos da comunidade.</p>
<p>Segundo a PM, a operação teve como objetivo combater o tráfico de drogas na região. Duas pessoas foram presas e material apreendido.</p>`,
        imagem: '',
        categoria: 'noticias',
        autor: 'Equipe TV Complexo',
        publicada: 1,
        created_at: '2026-03-05 11:00:00'
    }
];

noticias.forEach(n => {
    insertNoticia.run(n.id, n.titulo, n.resumo, n.conteudo, n.imagem, n.categoria, n.autor, n.publicada, n.created_at);
});

// Seed Denúncias
const insertDenuncia = db.prepare(`
  INSERT INTO denuncias (id, nome, comunidade, local_problema, tipo, descricao, latitude, longitude, midia, status, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const denuncias = [
    {
        id: uuidv4(),
        nome: 'Carlos M.',
        comunidade: 'Complexo do Alemão',
        local_problema: 'Rua Principal, próximo ao mercado',
        tipo: 'falta_de_luz',
        descricao: 'Estamos há 3 dias sem energia elétrica. A Light não atende nossas ligações. Crianças e idosos passando dificuldade.',
        latitude: -22.8582,
        longitude: -43.2697,
        midia: '',
        status: 'aprovada',
        created_at: '2026-03-01 08:00:00'
    },
    {
        id: uuidv4(),
        nome: 'Anônimo',
        comunidade: 'Complexo do Alemão',
        local_problema: 'Ladeira do Baiano',
        tipo: 'lixo_acumulado',
        descricao: 'Lixo acumulado há semanas na ladeira. Mau cheiro insuportável e ratos aparecendo. Comlurb não aparece.',
        latitude: -22.8610,
        longitude: -43.2650,
        midia: '',
        status: 'aprovada',
        created_at: '2026-03-02 15:00:00'
    },
    {
        id: uuidv4(),
        nome: 'Ana Paula',
        comunidade: 'Rocinha',
        local_problema: 'Rua 4, entrada da comunidade',
        tipo: 'risco_deslizamento',
        descricao: 'Morro com rachadura grande. Na última chuva, pedras caíram. Moradores em risco. Defesa Civil precisa vir urgente.',
        latitude: -22.9873,
        longitude: -43.2478,
        midia: '',
        status: 'aprovada',
        created_at: '2026-03-03 07:30:00'
    },
    {
        id: uuidv4(),
        nome: 'Marcos',
        comunidade: 'Cidade de Deus',
        local_problema: 'Praça central',
        tipo: 'saneamento',
        descricao: 'Esgoto estourado na praça onde crianças brincam. Água suja escorrendo há dias.',
        latitude: -22.9452,
        longitude: -43.3620,
        midia: '',
        status: 'aprovada',
        created_at: '2026-03-04 12:00:00'
    },
    {
        id: uuidv4(),
        nome: 'Anônimo',
        comunidade: 'Complexo do Alemão',
        local_problema: 'Beco do João',
        tipo: 'fios_energizados',
        descricao: 'Fios de alta tensão caídos no chão após ventania. Muito perigoso, qualquer pessoa pode se eletrocutar.',
        latitude: -22.8595,
        longitude: -43.2680,
        midia: '',
        status: 'pendente',
        created_at: '2026-03-05 06:00:00'
    },
    {
        id: uuidv4(),
        nome: 'Fernanda',
        comunidade: 'Maré',
        local_problema: 'Rua Teixeira Ribeiro',
        tipo: 'poste_caido',
        descricao: 'Poste caiu durante a tempestade e está bloqueando a rua. Perigo para pedestres e veículos.',
        latitude: -22.8612,
        longitude: -43.2445,
        midia: '',
        status: 'pendente',
        created_at: '2026-03-05 09:00:00'
    }
];

denuncias.forEach(d => {
    insertDenuncia.run(d.id, d.nome, d.comunidade, d.local_problema, d.tipo, d.descricao, d.latitude, d.longitude, d.midia, d.status, d.created_at);
});

// Seed Comentários
const insertComentario = db.prepare(`
  INSERT INTO comentarios (id, noticia_id, autor, texto, created_at)
  VALUES (?, ?, ?, ?, ?)
`);

const comentarios = [
    { id: uuidv4(), noticia_id: noticiaId1, autor: 'Roberto', texto: 'Estou junto nessa luta! O saneamento aqui é uma vergonha.', created_at: '2026-03-04 10:00:00' },
    { id: uuidv4(), noticia_id: noticiaId1, autor: 'Maria', texto: 'Finalmente o povo se unindo. Força, comunidade!', created_at: '2026-03-04 11:30:00' },
    { id: uuidv4(), noticia_id: noticiaId3, autor: 'Sandra', texto: 'Meus filhos não puderam ir à escola. Até quando?', created_at: '2026-03-05 12:00:00' },
];

comentarios.forEach(c => {
    insertComentario.run(c.id, c.noticia_id, c.autor, c.texto, c.created_at);
});

console.log('✅ Banco de dados seed concluído com sucesso!');
console.log(`   - ${videos.length} vídeos`);
console.log(`   - ${noticias.length} notícias`);
console.log(`   - ${denuncias.length} denúncias`);
console.log(`   - ${comentarios.length} comentários`);

db.close();
