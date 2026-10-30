'use client';
import { useEffect, useState } from 'react';
import s from './urbano.module.css';

/**
 * "Instalar app": no Android/Chrome usa o aviso nativo (beforeinstallprompt);
 * onde ele não existe (iPhone, Firefox) abre o passo a passo.
 */
export default function InstalarApp() {
    const [aviso, setAviso] = useState(null);
    const [aberto, setAberto] = useState(false);

    useEffect(() => {
        function guardar(e) {
            e.preventDefault();
            setAviso(e);
        }
        window.addEventListener('beforeinstallprompt', guardar);
        return () => window.removeEventListener('beforeinstallprompt', guardar);
    }, []);

    async function instalar() {
        if (aviso) {
            aviso.prompt();
            await aviso.userChoice.catch(() => null);
            setAviso(null);
            return;
        }
        setAberto(a => !a);
    }

    return (
        <>
            <button type="button" className={s.btn} onClick={instalar}
                aria-expanded={aviso ? undefined : aberto} aria-controls={aviso ? undefined : 'instalar-passos'}>
                <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><path d="M12 3v12m-5-5l5 5 5-5M5 21h14" /></svg>
                Instalar app
            </button>
            <ol id="instalar-passos" className={s.passos} hidden={!aberto}>
                <li><strong>iPhone:</strong> abra no Safari, toque em Compartilhar e depois em “Adicionar à Tela de Início” (iOS 16.4 ou mais novo).</li>
                <li><strong>Android:</strong> no Chrome, toque no menu ⋮ e em “Instalar app” ou “Adicionar à tela inicial”.</li>
            </ol>
        </>
    );
}
