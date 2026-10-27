/** Suaviza apenas os marcadores da máscara, na exibição pública. */
export function suavizarPlaceholders(texto) {
    return String(texto ?? '').replace(/\[(?:nome|condição de saúde|telefone|e-mail|CPF)\]/g, '•••');
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
