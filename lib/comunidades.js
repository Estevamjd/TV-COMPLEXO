/**
 * Lista extensível de comunidades (R3).
 *
 * Para incluir uma comunidade, basta acrescentar um item aqui: o formulário,
 * o fallback de coordenadas da API e a lista de exceções da máscara de nomes
 * leem deste arquivo. Coordenadas são opcionais (sem elas, o ponto no mapa
 * depende da geolocalização enviada pelo formulário).
 * Comunidades fora da lista entram pelo campo "Outra" (texto livre).
 */
export const COMUNIDADES = [
    { nome: 'Complexo do Alemão', lat: -22.8575, lng: -43.2650 },
    { nome: 'Rocinha', lat: -22.9880, lng: -43.2480 },
    { nome: 'Cidade de Deus', lat: -22.9480, lng: -43.3620 },
    { nome: 'Maré', lat: -22.8620, lng: -43.2430 },
    { nome: 'Vidigal', lat: -22.9940, lng: -43.2330 },
    { nome: 'Jacarezinho', lat: -22.8880, lng: -43.2620 },
    { nome: 'Manguinhos', lat: -22.8820, lng: -43.2500 },
    { nome: 'Penha', lat: -22.8410, lng: -43.2710 },
];

export const COMUNIDADE_OUTRA = 'Outra';

export const COMUNIDADE_MAX_LENGTH = 120;

export function coordenadasDaComunidade(nome) {
    const c = COMUNIDADES.find((item) => item.nome === nome);
    return c && typeof c.lat === 'number' && typeof c.lng === 'number' ? { lat: c.lat, lng: c.lng } : null;
}
