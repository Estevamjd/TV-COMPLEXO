/**
 * Colunas lidas nos caminhos públicos (páginas SSR e GET das APIs).
 * Nunca SELECT *: uma coluna nova no banco não vaza para o público sem passar
 * por aqui. Schema de referência: scripts/init-db.js + scripts/update-db.js.
 * (Denúncias têm lista própria em lib/denuncias.js.)
 */
export const COLUNAS_VIDEOS = 'id, titulo, descricao, url_video, thumbnail, plataforma, categoria, destaque, author, external_id, published_at, created_at';

export const COLUNAS_NOTICIAS = 'id, titulo, resumo, conteudo, imagem, categoria, autor, publicada, created_at';

export const COLUNAS_COMENTARIOS = 'id, noticia_id, autor, texto, created_at';
