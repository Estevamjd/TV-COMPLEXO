import { COMUNIDADES } from './comunidades';
import { NAO_NOMES, PRIMEIROS_NOMES, SOBRENOMES } from './nomes-comuns';

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
// Decisão: nome de pessoa dentro de logradouro/instituição ("Rua João Silva",
// "Escola Municipal Maria da Silva", "rua joão da silva") é tratado como nome
// do LUGAR e não é mascarado — é homenagem pública, não dado de quem denuncia.
// "São", "Santo" e "Santa" entram aqui por causa de lugares como Santa Marta e
// São João de Meriti.
export const PREFIXOS_LUGAR = [
    'São', 'Santo', 'Santa',
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
const PRIMEIROS_SET = conjunto(PRIMEIROS_NOMES);
const NOMES_CONHECIDOS_SET = new Set([...PRIMEIROS_SET, ...conjunto(SOBRENOMES)]);
const PREFIXOS_SET = conjunto(PREFIXOS_LUGAR);
const INICIO_SET = conjunto(PALAVRAS_INICIO);
const TRATAMENTOS_SET = conjunto(TRATAMENTOS);
// Nunca fazem parte de um nome (comparação sem acento).
const NAO_NOME_SET = new Set([
    ...conjunto(NAO_NOMES), ...INICIO_SET, ...PREFIXOS_SET, ...TRATAMENTOS_SET,
    ...EXCECOES_SET, ...CONECTORES,
]);

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

const RE_PALAVRA = /[\p{L}'’]+/gu;
const RE_CAPITALIZADA = /^\p{Lu}[\p{Ll}'’]+$/u;
const RE_CAIXA_ALTA = /^\p{Lu}[\p{Lu}'’]{2,}$/u;
const RE_SO_ESPACO = /^[ \t ]+$/;

/**
 * Nomes completos ancorados em listas de nomes comuns, em QUALQUER caixa
 * ("joão da silva", "JOÃO DA SILVA", "Maria Quintanilha").
 *
 * A partir de cada palavra das listas, estende para os dois lados enquanto a
 * vizinha (separada só por espaço) for: outro nome conhecido; ou palavra
 * Capitalizada / em CAIXA ALTA que não seja comum (NAO_NOME_SET); com
 * conectores (da/de/do/das/dos; "e" só antes de nome conhecido) no meio.
 * Em minúsculas, só nomes das listas contam ("joão silva" sim, "joão foi" não).
 * Texto gritado (4+ palavras e maioria em CAIXA ALTA): palavra em CAIXA ALTA
 * fora das listas só conta logo depois de um primeiro nome, para não engolir a
 * frase inteira.
 * Mascara o trecho com 2+ palavras, ou primeiro nome após tratamento
 * ("dona maria" → "dona [nome]"). Mantém logradouros/instituições (PREFIXOS_LUGAR
 * antes do trecho) e exceções.
 */
function mascararNomesConhecidos(texto) {
    const t = [...texto.matchAll(RE_PALAVRA)].map((m) => ({
        p: m[0], ini: m.index, fim: m.index + m[0].length, n: semAcento(m[0]),
    }));
    if (!t.some((x) => NOMES_CONHECIDOS_SET.has(x.n))) return texto;

    const emCaixaAlta = t.filter((x) => RE_CAIXA_ALTA.test(x.p) || /^\p{Lu}{2}$/u.test(x.p)).length;
    const gritando = emCaixaAlta >= 4 && emCaixaAlta / t.length > 0.6;

    const junto = (a, b) => a >= 0 && b < t.length && RE_SO_ESPACO.test(texto.slice(t[a].fim, t[b].ini));
    const conhecido = (i) => NOMES_CONHECIDOS_SET.has(t[i].n);
    const pareceNome = (i) => {
        if (conhecido(i)) return true;
        if (NAO_NOME_SET.has(t[i].n)) return false;
        if (RE_CAPITALIZADA.test(t[i].p)) return true;
        if (!RE_CAIXA_ALTA.test(t[i].p)) return false;
        // Gritando: CAIXA ALTA desconhecida só conta logo depois de primeiro nome
        // ("JOSÉ QUINTANILHA"). Erra para o lado seguro ("MARIA LIGOU" → "[nome]").
        return !gritando || (junto(i - 1, i) && PRIMEIROS_SET.has(t[i - 1].n));
    };
    // Vizinho de i na direção d (+1/-1), pulando um conector; -1 se não houver.
    const vizinho = (i, d) => {
        const j = i + d;
        if (!junto(Math.min(i, j), Math.max(i, j))) return -1;
        if (!CONECTORES.has(t[j].n)) return pareceNome(j) ? j : -1;
        const k = j + d;
        if (!junto(Math.min(j, k), Math.max(j, k))) return -1;
        return (t[j].n === 'e' ? conhecido(k) : pareceNome(k)) ? k : -1;
    };

    const trechos = [];
    for (let i = 0; i < t.length; i++) {
        if (!conhecido(i)) continue;
        let ini = i;
        let fim = i;
        for (let v = vizinho(ini, -1); v >= 0; v = vizinho(ini, -1)) ini = v;
        for (let v = vizinho(fim, 1); v >= 0; v = vizinho(fim, 1)) fim = v;
        i = fim;

        // Antes do trecho, pulando tratamentos/conectores: é logradouro/instituição?
        let k = ini - 1;
        while (k >= 0 && junto(k, k + 1) && (TRATAMENTOS_SET.has(t[k].n) || CONECTORES.has(t[k].n))) k--;
        if (k >= 0 && junto(k, k + 1) && PREFIXOS_SET.has(t[k].n)) continue;

        const trecho = texto.slice(t[ini].ini, t[fim].fim);
        if (EXCECOES_SET.has(semAcento(trecho))) continue;
        const palavras = t.slice(ini, fim + 1).filter((x) => !CONECTORES.has(x.n)).length;
        const aposTratamento = ini > 0 && junto(ini - 1, ini) && TRATAMENTOS_SET.has(t[ini - 1].n)
            && PRIMEIROS_SET.has(t[ini].n);
        if (palavras >= 2 || aposTratamento) trechos.push([t[ini].ini, t[fim].fim]);
    }

    let saida = texto;
    for (const [ini, fim] of trechos.reverse()) saida = `${saida.slice(0, ini)}[nome]${saida.slice(fim)}`;
    return saida;
}

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
 * - nome completo → [nome]: âncora em nomes comuns (qualquer caixa) e
 *   2+ palavras capitalizadas, fora das exceções e de logradouros
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
    saida = mascararNomesConhecidos(saida);
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
