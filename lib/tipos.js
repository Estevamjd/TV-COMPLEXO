/**
 * Tipos de denúncia aceitos (lista permitida).
 *
 * O POST/PUT só aceita estes valores e a saída pública troca qualquer valor
 * fora da lista (linhas antigas, edição manual no banco) por 'outros'.
 * Para incluir um tipo, acrescente aqui e os rótulos nos componentes.
 */
export const TIPOS_DENUNCIA = [
    { value: 'falta_de_luz', label: 'Falta de Luz' },
    { value: 'lixo_acumulado', label: 'Lixo Acumulado' },
    { value: 'risco_deslizamento', label: 'Risco de Deslizamento' },
    { value: 'saneamento', label: 'Saneamento' },
    { value: 'fios_energizados', label: 'Fios Energizados' },
    { value: 'poste_caido', label: 'Poste Caído' },
    { value: 'violencia', label: 'Violência' },
    { value: 'outros', label: 'Outros' },
];

export const TIPO_PADRAO = 'outros';

const VALORES = new Set(TIPOS_DENUNCIA.map((t) => t.value));

export function tipoValido(tipo) {
    return typeof tipo === 'string' && VALORES.has(tipo);
}

/** Valor seguro para a saída pública. */
export function tipoPublico(tipo) {
    return tipoValido(tipo) ? tipo : TIPO_PADRAO;
}
