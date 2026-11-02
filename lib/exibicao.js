/** Suaviza apenas os marcadores da máscara, na exibição pública. */
export function suavizarPlaceholders(texto) {
    return String(texto ?? '').replace(/\[(?:nome|condição de saúde|telefone|e-mail|CPF)\]/g, '•••');
}

// emoji (🎀, 🔴, bandeiras, tons de pele, sequências com ZWJ) e as partes que o montam; ©, ® e ™ ficam
const EMOJI = /(?![©®™])\p{Extended_Pictographic}|\p{Emoji_Modifier}|\p{Regional_Indicator}|[\u200D\uFE0E\uFE0F\u20E3]|[\u{E0020}-\u{E007F}]/gu;

/**
 * Título do YouTube sem emoji, só para mostrar no site (o título no YouTube e no banco não muda).
 * "🎀 OUTUBRO ROSA" vira "OUTUBRO ROSA". Se o título for só emoji, devolve o original.
 */
export function tituloSemEmoji(titulo) {
    const original = String(titulo ?? '');
    const limpo = original.replace(EMOJI, '').replace(/\s+/g, ' ').trim();
    return limpo || original.trim();
}

/** Recebe a saída já mascarada de paraSaidaPublica. */
export function paraExibicaoPublica(denuncia) {
    return {
        ...denuncia,
        comunidade: suavizarPlaceholders(denuncia.comunidade),
        local_problema: suavizarPlaceholders(denuncia.local_problema),
        descricao: suavizarPlaceholders(denuncia.descricao),
    };
}
