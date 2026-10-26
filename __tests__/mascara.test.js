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

    it('mascara nome após tratamento ("Dona", "Seu")', () => {
        expect(mascararTextoPublico('A casa da Dona Fulana caiu')).toBe('A casa da Dona [nome] caiu');
    });

    it('mantém comunidades, lugares e órgãos (lista de exceções)', () => {
        const texto = 'No Complexo do Alemão, perto da Rua Teixeira Ribeiro, a Defesa Civil e a Cidade de Deus. Na Vila Cruzeiro também.';
        expect(mascararTextoPublico(texto)).toBe(texto);
    });

    it('mantém palavra capitalizada isolada (início de frase, primeiro nome)', () => {
        expect(mascararTextoPublico('Estamos sem luz. Carlos avisou a Light.')).toBe('Estamos sem luz. Carlos avisou a Light.');
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
