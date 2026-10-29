import { Anton, Archivo_Black, Inter_Tight, Space_Mono } from 'next/font/google';

// Fontes grátis (OFL), servidas pelo próprio site via next/font (sem custo, sem CDN externa).
export const anton = Anton({ weight: '400', subsets: ['latin'], variable: '--font-anton', display: 'swap' });
export const archivoBlack = Archivo_Black({ weight: '400', subsets: ['latin'], variable: '--font-archivo-black', display: 'swap' });
export const interTight = Inter_Tight({ weight: ['500', '600', '700'], subsets: ['latin'], variable: '--font-inter-tight', display: 'swap' });
export const spaceMono = Space_Mono({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-space-mono', display: 'swap' });

export const fontesUrbano = [anton, archivoBlack, interTight, spaceMono].map(f => f.variable).join(' ');
