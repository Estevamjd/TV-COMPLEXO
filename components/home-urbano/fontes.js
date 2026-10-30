import { Anton, Archivo_Black, Inter_Tight, Space_Mono } from 'next/font/google';

// Fontes grátis (OFL), servidas pelo próprio site via next/font (sem custo, sem CDN externa).
// Só a Anton (o "LIGA A TV!" do topo, elemento de LCP) é pré-carregada; as outras entram com
// swap sobre um fallback com métricas ajustadas (adjustFontFallback), sem disputar banda com ela.
export const anton = Anton({ weight: '400', subsets: ['latin'], variable: '--font-anton', display: 'swap' });
export const archivoBlack = Archivo_Black({ weight: '400', subsets: ['latin'], variable: '--font-archivo-black', display: 'swap', preload: false });
export const interTight = Inter_Tight({ weight: ['500', '600', '700'], subsets: ['latin'], variable: '--font-inter-tight', display: 'swap', preload: false });
export const spaceMono = Space_Mono({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-space-mono', display: 'swap', preload: false });

export const fontesUrbano = [anton, archivoBlack, interTight, spaceMono].map(f => f.variable).join(' ');
