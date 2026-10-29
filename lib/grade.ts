/**
 * Grade da semana lida de lib/grade.json (sem tabela no banco).
 * Dia sem programa = "em breve" (RN3: nada de dado inventado).
 */
import grade from './grade.json';

export interface Programa {
    titulo: string;
    inicio: string; // HH:MM
    fim: string;    // HH:MM
}

export type DiaChave = 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom';

export const DIAS: { chave: DiaChave; rotulo: string; nome: string }[] = [
    { chave: 'seg', rotulo: 'Seg', nome: 'Segunda' },
    { chave: 'ter', rotulo: 'Ter', nome: 'Terça' },
    { chave: 'qua', rotulo: 'Qua', nome: 'Quarta' },
    { chave: 'qui', rotulo: 'Qui', nome: 'Quinta' },
    { chave: 'sex', rotulo: 'Sex', nome: 'Sexta' },
    { chave: 'sab', rotulo: 'Sáb', nome: 'Sábado' },
    { chave: 'dom', rotulo: 'Dom', nome: 'Domingo' },
];

const SEMANA_EN: Record<string, DiaChave> = {
    Mon: 'seg', Tue: 'ter', Wed: 'qua', Thu: 'qui', Fri: 'sex', Sat: 'sab', Sun: 'dom',
};

export function programasDoDia(dia: DiaChave, dados: Record<string, Programa[]> = grade.dias): Programa[] {
    return Array.isArray(dados[dia]) ? dados[dia] : [];
}

/** Dia e minuto do dia no horário de Brasília. */
export function agoraBrasilia(ms: number): { dia: DiaChave; minuto: number } {
    const partes = new Intl.DateTimeFormat('en-US', {
        weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'America/Sao_Paulo',
    }).formatToParts(new Date(ms));
    const get = (t: string) => partes.find(p => p.type === t)?.value ?? '';
    return { dia: SEMANA_EN[get('weekday')] ?? 'seg', minuto: Number(get('hour')) * 60 + Number(get('minute')) };
}

function minutos(hhmm: string): number {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
}

export function programaAgora(programas: Programa[], minuto: number): Programa | null {
    return programas.find(p => minutos(p.inicio) <= minuto && minuto < minutos(p.fim)) ?? null;
}
