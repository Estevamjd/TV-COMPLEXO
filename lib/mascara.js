import { COMUNIDADES } from './comunidades';

/**
 * Máscara automática do texto público das denúncias (R3).
 *
 * É um APOIO à revisão humana no admin, não substitui a revisão: o original
 * continua no banco e só o admin vê. Aplicada no servidor, na saída pública.
 *
 * As listas abaixo são editáveis.
 */

// Termos de saúde → [condição de saúde]. Variantes com qualificador vêm
// antes das curtas (a busca usa a ordem por tamanho), para que
// "AVC hemorrágico" vire um único marcador.
export const TERMOS_SAUDE = [
    'AVC hemorrágico', 'AVC isquêmico', 'AVC', 'derrame cerebral', 'derrame',
    'tumor maligno', 'tumor benigno', 'tumor',
    'câncer', 'cancer', 'leucemia', 'metástase', 'quimioterapia', 'radioterapia',
    'HIV', 'AIDS', 'soropositivo', 'soropositiva',
    'gravidez', 'grávida', 'gravida', 'gestante', 'aborto',
    'diabetes', 'diabético', 'diabética', 'diabetico', 'diabetica',
    'depressão', 'depressao', 'depressivo', 'depressiva', 'ansiedade',
    'esquizofrenia', 'esquizofrênico', 'esquizofrênica', 'bipolar', 'autismo', 'autista',
    'epilepsia', 'epilético', 'epilética', 'tuberculose', 'hepatite', 'sífilis', 'sifilis',
    'internado', 'internada', 'internados', 'internadas', 'internação', 'internacao',
    'cirurgia', 'operado', 'operada', 'hemodiálise', 'hemodialise',
    'acamado', 'acamada', 'deficiente', 'cadeirante',
];

// Sequências capitalizadas que NÃO são nomes de pessoa (comunidades, órgãos,
// lugares). Comparação sem acento e sem diferenciar maiúsculas.
export const EXCECOES_NOMES = [
    ...COMUNIDADES.map((c) => c.nome),
    'Rio de Janeiro', 'Zona Norte', 'Zona Sul', 'Zona Oeste', 'Baixada Fluminense',
    'Defesa Civil', 'Corpo de Bombeiros', 'Polícia Militar', 'Polícia Civil', 'Guarda Municipal',
    'Clínica da Família', 'Light', 'Comlurb', 'Cedae', 'Águas do Rio', 'Rio Águas',
    'Prefeitura do Rio', 'Governo do Estado', 'Ministério Público', 'Defensoria Pública',
    'Vila Cruzeiro', 'Morro do Alemão', 'Nova Brasília', 'Fazendinha', 'Grota',
    'TV Complexo', 'Bom Sucesso', 'Ramos', 'Olaria', 'Bonsucesso',
];

// Primeira palavra que indica lugar/instituição: a sequência inteira é mantida.
export const PREFIXOS_LUGAR = [
    'Rua', 'Avenida', 'Av', 'Travessa', 'Beco', 'Ladeira', 'Praça', 'Estrada', 'Largo',
    'Morro', 'Comunidade', 'Complexo', 'Vila', 'Parque', 'Jardim', 'Conjunto', 'Escola',
    'Colégio', 'Creche', 'Hospital', 'Clínica', 'Posto', 'Igreja', 'Associação', 'Estação',
    'Linha', 'Viaduto', 'Ponte', 'Campo', 'Quadra', 'Rodovia', 'Secretaria', 'Prefeitura',
    'Ciep', 'Centro', 'Mercado', 'Supermercado', 'Teleférico', 'Avenida Brasil',
];

// Palavras capitalizadas comuns em início de frase: são descartadas do começo
// da sequência antes de decidir se o resto é um nome.
export const PALAVRAS_INICIO = [
    'Ontem', 'Hoje', 'Amanhã', 'Aqui', 'Ali', 'Lá', 'Agora', 'Quando', 'Depois', 'Antes', 'Desde',
    'Segundo', 'Moradores', 'Morador', 'Moradora', 'Vizinhos', 'Vizinho', 'Vizinha', 'Estamos',
    'Na', 'No', 'Nas', 'Nos', 'Em', 'Da', 'Do', 'De', 'Pela', 'Pelo', 'Para', 'Com', 'Sem',
    'Meu', 'Minha', 'Nosso', 'Nossa', 'Esse', 'Essa', 'Este', 'Esta', 'Isso', 'Isto', 'Uma', 'Um',
    'Os', 'As', 'Mas', 'Porque', 'Já', 'Também', 'Faz', 'Há', 'Tem', 'Ninguém', 'Toda', 'Todo',
    'Até', 'Ele', 'Ela', 'Eles', 'Elas', 'Eu', 'Nós', 'Você', 'Vocês',
];

// Tratamentos mantidos antes do marcador: "Dona Fulana" → "Dona [nome]".
export const TRATAMENTOS = ['Dona', 'Seu', 'Sr', 'Sra', 'Senhor', 'Senhora', 'Tia', 'Tio', 'Vó', 'Vô', 'Dr', 'Dra'];

const CONECTORES = new Set(['da', 'de', 'do', 'das', 'dos', 'e']);

const LETRA = '\\p{L}\\p{N}';

const semAcento = (s) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const conjunto = (lista) => new Set(lista.map(semAcento));

const EXCECOES_SET = conjunto(EXCECOES_NOMES);
const PREFIXOS_SET = conjunto(PREFIXOS_LUGAR);
const INICIO_SET = conjunto(PALAVRAS_INICIO);
const TRATAMENTOS_SET = conjunto(TRATAMENTOS);

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function regexTermos(termos) {
    const ordenados = [...termos].sort((a, b) => b.length - a.length).map(escapeRegex);
    return new RegExp(`(?<![${LETRA}])(?:${ordenados.join('|')})(?![${LETRA}])`, 'giu');
}

const RE_SAUDE = regexTermos(TERMOS_SAUDE);
const RE_EMAIL = /[\p{L}\p{N}._%+-]+@[\p{L}\p{N}-]+(?:\.[\p{L}\p{N}-]+)+/gu;
const RE_CPF_FORMATADO = /(?<!\d)\d{3}\.\d{3}\.\d{3}-?\d{2}(?!\d)/g;
// 11 dígitos seguidos que não foram reconhecidos como celular.
const RE_CPF_NU = /(?<!\d)\d{11}(?!\d)/g;
// Telefone BR: (+55) (DDD) 9XXXX-XXXX / XXXX-XXXX, com ou sem separadores.
const RE_TELEFONE = /(?<![\d])(?:\+?55[\s.-]?)?(?:\(?\d{2}\)?[\s.-]?)?9?\d{4}[\s.-]?\d{4}(?!\d)/g;
// Sequência de 2+ palavras capitalizadas, com conectores (da/de/do/dos/das/e) no meio.
const RE_NOME = /(?<![\p{L}\p{N}])\p{Lu}[\p{Ll}'’]+(?:\s+(?:(?:da|de|do|das|dos|e)\s+)?\p{Lu}[\p{Ll}'’]+)+(?![\p{L}\p{N}])/gu;

function mascararNomes(texto) {
    return texto.replace(RE_NOME, (trecho) => {
        const palavras = trecho.split(/\s+/);

        // Descarta palavras de início de frase ("Ontem Fulano Tal" → "Fulano Tal").
        const mantidas = [];
        while (palavras.length && INICIO_SET.has(semAcento(palavras[0]))) {
            mantidas.push(palavras.shift());
        }
        // Mantém tratamento ("Dona", "Seu"…) e mascara o que vem depois.
        let tratamento = null;
        if (palavras.length >= 2 && TRATAMENTOS_SET.has(semAcento(palavras[0]))) {
            tratamento = palavras.shift();
        }
        while (palavras.length && CONECTORES.has(palavras[0])) {
            mantidas.push(palavras.shift());
        }

        const resto = palavras.join(' ');
        const significativas = palavras.filter((p) => !CONECTORES.has(p));
        const prefixo = [...mantidas, tratamento].filter(Boolean).join(' ');
        const junta = (miolo) => (prefixo ? `${prefixo} ${miolo}` : miolo).trim();

        if (!significativas.length) return trecho;
        if (PREFIXOS_SET.has(semAcento(palavras[0])) || EXCECOES_SET.has(semAcento(resto))) {
            return trecho;
        }
        // Nome completo (2+ palavras) ou nome precedido de tratamento.
        if (significativas.length >= 2 || tratamento) return junta('[nome]');
        return trecho;
    });
}

/**
 * Mascara dados pessoais de um texto que vai ao público.
 * - e-mail → [e-mail]; CPF → [CPF]; telefone → [telefone]
 * - nome completo (2+ palavras capitalizadas, fora das exceções) → [nome]
 * - termos de saúde → [condição de saúde]
 */
export function mascararTextoPublico(texto) {
    if (texto === null || texto === undefined) return '';
    let saida = String(texto);
    saida = saida.replace(RE_EMAIL, '[e-mail]');
    saida = saida.replace(RE_CPF_FORMATADO, '[CPF]');
    saida = saida.replace(RE_TELEFONE, '[telefone]');
    saida = saida.replace(RE_CPF_NU, '[CPF]');
    saida = saida.replace(RE_SAUDE, '[condição de saúde]');
    saida = mascararNomes(saida);
    return saida;
}

/**
 * Nome exibido ao público: primeiro nome (se a pessoa consentiu) ou "Anônimo".
 */
export function autorPublico(nome, publicarNome) {
    if (!publicarNome) return 'Anônimo';
    const primeiro = String(nome || '').trim().split(/\s+/)[0] || '';
    // Só aceita algo com cara de nome (letras, hífen, apóstrofo).
    if (!primeiro || semAcento(primeiro) === 'anonimo' || !/^[\p{L}'’-]{2,40}$/u.test(primeiro)) {
        return 'Anônimo';
    }
    return primeiro;
}
