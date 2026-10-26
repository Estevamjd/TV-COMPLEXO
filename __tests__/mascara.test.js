import { describe, it, expect } from 'vitest';
import { mascararTextoPublico, autorPublico } from '@/lib/mascara';

// Todos os exemplos são fictícios.
describe('mascararTextoPublico (R3)', () => {
    it('mascara termos de saúde, inclusive "AVC hemorrágico e tumor"', () => {
        expect(mascararTextoPublico('Minha vizinha teve AVC hemorrágico e tumor'))
            .toBe('Minha vizinha teve [condição de saúde] e [condição de saúde]');
    });

    it('mascara saúde sem diferenciar maiúsculas e com/sem acento', () => {
        const out = mascararTextoPublico('Ele tem Câncer, cancer, HIV e diabetes; está internado após cirurgia. Ela está grávida.');
        expect(out).not.toMatch(/câncer|cancer|HIV|diabetes|internado|cirurgia|grávida/i);
        expect(out.match(/\[condição de saúde\]/g)).toHaveLength(7);
    });

    it('mascara depressão e gravidez', () => {
        expect(mascararTextoPublico('Depressão e gravidez')).toBe('[condição de saúde] e [condição de saúde]');
    });

    it('não mascara palavras que só contêm o termo', () => {
        expect(mascararTextoPublico('A avcxyz e o tumorado')).toBe('A avcxyz e o tumorado');
    });

    it('mascara telefone em vários formatos', () => {
        for (const tel of ['(21) 99999-0000', '21 99999 0000', '+55 21 99999-0000', '99999-0000', '3333-4444', '21999990000']) {
            expect(mascararTextoPublico(`Liga ${tel} agora`)).toBe('Liga [telefone] agora');
        }
    });

    it('mascara e-mail e CPF', () => {
        expect(mascararTextoPublico('Mande para fulano.teste@exemplo.com.br')).toBe('Mande para [e-mail]');
        expect(mascararTextoPublico('CPF 123.456.789-00 e 12345678900')).toBe('CPF [CPF] e [CPF]');
    });

    it('mascara nome completo (2+ palavras capitalizadas)', () => {
        expect(mascararTextoPublico('O lixo foi jogado por Fulano Ciclano da Silva ontem'))
            .toBe('O lixo foi jogado por [nome] ontem');
        expect(mascararTextoPublico('Ontem Beltrana Souza reclamou')).toBe('Ontem [nome] reclamou');
    });

    it.each(['-', '\u2010', '\u2011', '\u00AD'])('mascara sobrenomes com hífen %s por inteiro (R3-1)', (hifen) => {
        for (const nome of [
            `Tiago Nóbrega${hifen}Assunção`,
            `tiago nóbrega${hifen}assunção`,
            `TIAGO NÓBREGA${hifen}ASSUNÇÃO`,
            `Fulano Nóbrega${hifen}Assunção`,
        ]) {
            const out = mascararTextoPublico(`falar com ${nome} amanhã`);
            expect(out).toBe('falar com [nome] amanhã');
            expect(out).not.toMatch(/Assunção/i);
        }
    });

    it.each(['ana-paula souza', 'JOÃO-PEDRO SANTOS', 'joão-pedro santos', 'MARIA-CLARA OLIVEIRA'])(
        'mascara primeiro nome hifenizado: %s', (nome) => {
            expect(mascararTextoPublico(nome)).toBe('[nome]');
        },
    );

    it('processa uma cadeia longa de hífens em menos de um segundo', () => {
        const texto = 'Ab-'.repeat(50000);
        const inicio = performance.now();
        const out = mascararTextoPublico(texto);
        const duracao = performance.now() - inicio;
        expect(out).toBe(texto);
        expect(duracao).toBeLessThan(1000);
    });

    it('processa uma cadeia longa com nome conhecido em menos de um segundo', () => {
        const texto = 'Maria-'.repeat(20000);
        const inicio = performance.now();
        const out = mascararTextoPublico(texto);
        const duracao = performance.now() - inicio;
        expect(out).toBe(texto);
        expect(duracao).toBeLessThan(1000);
    });

    it.each(['Maria Segunda-Feira', 'Ligou Maria Terça-feira'])(
        'preserva dia da semana hifenizado: %s', (texto) => {
            expect(mascararTextoPublico(texto)).toBe(texto);
        },
    );

    it('mascara sobrenome com mais de três segmentos sem deixar sufixos', () => {
        expect(mascararTextoPublico('Tiago Ab-cd-ef-gh-ij')).toBe('[nome]');
    });

    it.each(['-', '\u2010', '\u2011', '\u00AD'])(
        'mascara cadeia longa com primeiro nome desconhecido e hífen %s', (hifen) => {
            expect(mascararTextoPublico(`Beltrana Souza${hifen}a${hifen}b${hifen}c${hifen}d`))
                .toBe('[nome]');
        },
    );

    it.each(['Ana Domingo', 'Ana Souza-Domingo', 'Beltrana Souza-Domingo'])(
        'permite dia da semana como sobrenome: %s', (nome) => {
            expect(mascararTextoPublico(nome)).toBe('[nome]');
        },
    );

    it('mantém en dash como separador de trechos', () => {
        expect(mascararTextoPublico('Tiago Nóbrega–Assunção'))
            .toBe('[nome]–Assunção');
    });

    it('preserva intervalo de datas e as máscaras de telefone e CPF', () => {
        expect(mascararTextoPublico('10-12 de março')).toBe('10-12 de março');
        expect(mascararTextoPublico('(21) 99999-0000, 123.456.789-00'))
            .toBe('[telefone], [CPF]');
    });

    it('combina sobrenome hifenizado com telefone, CPF e e-mail', () => {
        const out = mascararTextoPublico('Tiago Nóbrega-Assunção, (21) 99999-0000, 123.456.789-00, tiago-assuncao@exemplo.com');
        expect(out).toBe('[nome], [telefone], [CPF], [e-mail]');
        expect(out).not.toContain('Assunção');
    });

    it('mascara nome após tratamento ("Dona", "Seu")', () => {
        expect(mascararTextoPublico('A casa da Dona Fulana caiu')).toBe('A casa da Dona [nome] caiu');
    });

    it('mantém comunidades, lugares e órgãos (lista de exceções)', () => {
        const texto = 'No Complexo do Alemão, perto da Rua Teixeira Ribeiro, a Defesa Civil e a Cidade de Deus. Na Vila Cruzeiro também.';
        expect(mascararTextoPublico(texto)).toBe(texto);
    });

    it.each(['Av', 'Estr', 'Trav', 'Pça', 'Pca'])('preserva abreviação de logradouro %s com ou sem ponto', (prefixo) => {
        for (const ponto of ['', '.']) {
            const texto = `${prefixo}${ponto} Leopoldo Bulhões`;
            expect(mascararTextoPublico(texto)).toBe(texto);
        }
    });

    it('preserva logradouros com ponto e continua mascarando pessoas', () => {
        expect(mascararTextoPublico('Av. Leopoldo Bulhões')).toBe('Av. Leopoldo Bulhões');
        expect(mascararTextoPublico('Estr. José Rucas')).toBe('Estr. José Rucas');
        expect(mascararTextoPublico('R. José Rucas')).toBe('R. [nome]');
        expect(mascararTextoPublico('R joão pedro quintanilha')).toBe('R [nome]');
        expect(mascararTextoPublico('falar com joão pedro quintanilha')).toBe('falar com [nome]');
    });

    it.each(['Posto Maria Souza Lima', 'Vila João Pedro Silva'])('mantém o comportamento do HEAD para %s', (texto) => {
        expect(mascararTextoPublico(texto)).toBe(texto);
    });

    it.each(['R.', 'R', 'Al.'])('mascara nomes após a possível inicial %s', (prefixo) => {
        expect(mascararTextoPublico(`falei com ${prefixo} Maria Santos Lima`)).toBe(`falei com ${prefixo} [nome]`);
    });

    it('mantém palavra capitalizada isolada (início de frase, primeiro nome)', () => {
        expect(mascararTextoPublico('Estamos sem luz. Carlos avisou a Light.')).toBe('Estamos sem luz. Carlos avisou a Light.');
    });

    it('mascara nome completo em minúsculas e em CAIXA ALTA', () => {
        expect(mascararTextoPublico('o lixo é do joão da silva')).toBe('o lixo é do [nome]');
        expect(mascararTextoPublico('Falar com JOÃO DA SILVA amanhã')).toBe('Falar com [nome] amanhã');
        expect(mascararTextoPublico('JOÃO DA SILVA JOGOU LIXO NA RUA')).toBe('[nome] NA RUA');
        expect(mascararTextoPublico('vizinho QUINTANILHA DA SILVA')).toBe('vizinho [nome]');
        expect(mascararTextoPublico('Maria Quintanilha reclamou')).toBe('[nome] reclamou');
        expect(mascararTextoPublico('maria e josé foram passear longe')).toBe('[nome] longe');
    });

    it.each([
        ['falar com joão quintanilha amanhã', 'falar com [nome] amanhã'],
        ['falar com joão pedro quintanilha amanhã', 'falar com [nome] amanhã'],
        ['falar com enzo gabriel bertolucci amanhã', 'falar com [nome] amanhã'],
        ['falar com joão quintanilha bertolucci amanhã', 'falar com [nome] amanhã'],
        ['joão zubrelvax de bertolucci reclamando demais', '[nome] reclamando demais'],
        ['joão zubrelvax pedro bertolucci quintanilha amanhã', '[nome] amanhã'],
        ['ENZO BERTOLUCCI RECLAMOU DO LIXO', '[nome] RECLAMOU DO LIXO'],
        ['Enzo Bertolucci reclamou do lixo', '[nome] reclamou do lixo'],
        ['enzo bertolucci reclamou do lixo', '[nome] reclamou do lixo'],
        ['joão de zubrelvax bertolucci reclamando demais', '[nome] reclamando demais'],
        ['joão cadê o posto', '[nome] posto'],
        ['joão vive reclamando demais', '[nome] demais'],
        ['maria chegou tarde ao posto', '[nome] ao posto'],
        ['pedro precisa de remédio urgente', '[nome] urgente'],
        ['joão e zubrelvax', 'joão e zubrelvax'],
        ['joão quintanilha e maria', '[nome]'],
        ['a guarda municipal João Quintanilha passou ontem sem avisar', 'a guarda municipal [nome] ontem sem avisar'],
        ['guarda municipal joão quintanilha', 'guarda municipal [nome]'],
        ['joão zubrelvax amanhã', '[nome] amanhã'],
        ['JOÃO ZUBRELVAX AMANHÃ', '[nome] AMANHÃ'],
        ['João Zubrelvax amanhã', '[nome] amanhã'],
        ['joão de zubrelvax bertolucci reclamou', '[nome] reclamou'],
    ])('sobrenome fora das listas: %s', (texto, esperado) => {
        expect(mascararTextoPublico(texto)).toBe(esperado);
    });

    it.each(['joão foi ao posto', 'JOÃO FOI AO POSTO', 'João foi ao posto',
        'enzo reclamou do lixo', 'ENZO RECLAMOU DO LIXO',
        'rua joão quintanilha sem luz', 'Escola Municipal Enzo Bertolucci',
        'avenida joão quintanilha', 'praça josé bonifácio',
        'escola maria luiza dias', 'Escola Municipal Alice Pereira',
        'escola municipal alice pereira', 'Hospital Estadual Alice Pereira',
        'Unidade Federal Alice Pereira', 'UBS Municipal Alice Pereira'])
    ('preserva frases e lugares: %s', (texto) => {
        expect(mascararTextoPublico(texto)).toBe(texto);
    });

    it('texto gritado: mascara o nome sem engolir a frase', () => {
        expect(mascararTextoPublico('FALTA DE LUZ HÁ TRÊS DIAS NA RUA')).toBe('FALTA DE LUZ HÁ TRÊS DIAS NA RUA');
        expect(mascararTextoPublico('JOSÉ QUINTANILHA ESTÁ SEM LUZ HÁ DIAS')).toBe('[nome] ESTÁ SEM LUZ HÁ DIAS');
    });

    it('tratamento + primeiro nome em minúsculas', () => {
        expect(mascararTextoPublico('a dona maria reclamou')).toBe('a dona [nome] reclamou');
    });

    it('não mascara palavra comum nem nome isolado em minúsculas', () => {
        for (const t of ['o lixo da silva', 'há dias sem água', 'joão foi ao posto', 'o filho da maria', 'Lixo na PM']) {
            expect(mascararTextoPublico(t)).toBe(t);
        }
    });

    it('logradouro/instituição com nome de pessoa é mantido (decisão documentada)', () => {
        for (const t of ['Rua João Silva sem luz', 'na rua joão da silva tem buraco', 'RUA JOÃO SILVA SEM LUZ HÁ DIAS',
            'Escola Municipal Maria da Silva', 'rua dona maria santos', 'Santa Marta e São João de Meriti']) {
            expect(mascararTextoPublico(t)).toBe(t);
        }
    });

    it('combina tudo', () => {
        const out = mascararTextoPublico('Fulano de Tal (21) 98888-7777 com tumor na Maré');
        expect(out).toBe('[nome] [telefone] com [condição de saúde] na Maré');
    });

    it('lida com vazio/nulo', () => {
        expect(mascararTextoPublico(null)).toBe('');
        expect(mascararTextoPublico(undefined)).toBe('');
    });
});

describe('autorPublico (R3)', () => {
    it('sem consentimento → Anônimo', () => {
        expect(autorPublico('Fulana de Tal', false)).toBe('Anônimo');
    });

    it('com consentimento → só o primeiro nome', () => {
        expect(autorPublico('Fulana de Tal', true)).toBe('Fulana');
    });

    it('nome vazio, "Anônimo" ou estranho → Anônimo', () => {
        expect(autorPublico('', true)).toBe('Anônimo');
        expect(autorPublico('Anônimo', true)).toBe('Anônimo');
        expect(autorPublico('a@b.com', true)).toBe('Anônimo');
        expect(autorPublico('21999990000', true)).toBe('Anônimo');
    });
});
