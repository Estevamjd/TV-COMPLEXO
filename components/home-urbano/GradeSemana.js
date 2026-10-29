'use client';
import { useEffect, useState } from 'react';
import { DIAS, agoraBrasilia, programasDoDia, programaAgora } from '@/lib/grade';
import s from './urbano.module.css';

const ATUALIZAR_MS = 30_000;
const GIROS_DIA = [-1, 1, -0.5, 0.8, -1, 0.6, -0.4];

/**
 * Grade da semana (lib/grade.json; vazio = em breve). O primeiro render usa a
 * hora do servidor (mesmo HTML do SSR, sem erro de hidratação); depois o
 * navegador atualiza "hoje" e "agora" pelo horário de Brasília.
 */
export default function GradeSemana({ agoraInicial }) {
    const [agora, setAgora] = useState(agoraInicial);

    useEffect(() => {
        const atualizar = () => setAgora(Date.now());
        atualizar();
        const t = setInterval(atualizar, ATUALIZAR_MS);
        document.addEventListener('visibilitychange', atualizar);
        return () => { clearInterval(t); document.removeEventListener('visibilitychange', atualizar); };
    }, []);

    const hoje = agoraBrasilia(agora);

    return (
        <ul className={s.grade} role="list">
            {DIAS.map((d, i) => {
                const progs = programasDoDia(d.chave);
                const ehHoje = d.chave === hoje.dia;
                const noAr = ehHoje ? programaAgora(progs, hoje.minuto) : null;
                return (
                    <li key={d.chave} className={`${s.dia} ${ehHoje ? s.diaHoje : ''}`}
                        style={{ '--giro': `${GIROS_DIA[i]}deg` }}
                        aria-current={ehHoje ? 'date' : undefined}>
                        <span className={s.diaNome}><abbr title={d.nome}>{d.rotulo}</abbr></span>
                        {ehHoje && <span className={s.diaInfo}><span className={s.diaAgora}>Agora</span>{noAr ? noAr.titulo : 'canal 24h'}</span>}
                        {progs.length === 0 ? (
                            !ehHoje && <span className={s.diaInfo}>Em breve</span>
                        ) : (
                            <ul className={s.diaProgs}>
                                {progs.map(p => (
                                    <li key={p.inicio + p.titulo}><span className={s.mono}>{p.inicio}</span> {p.titulo}</li>
                                ))}
                            </ul>
                        )}
                    </li>
                );
            })}
        </ul>
    );
}
