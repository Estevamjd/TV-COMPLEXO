'use client';
import { usePathname } from 'next/navigation';

/** Esconde o conteúdo na home, que tem rodapé próprio (estilo Urbano). */
export default function OcultarNaHome({ children }) {
    return usePathname() === '/' ? null : children;
}
