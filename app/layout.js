import { Inter, Bebas_Neue } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BottomNav from '@/components/BottomNav';
import { fontesUrbano } from '@/components/home-urbano/fontes';
import { SITE_URL, SITE_NOME, DESCRICAO_PADRAO, OG_IMAGEM, urlAbsoluta } from '@/lib/site';

// Padrão herdado (ex.: /admin). Cada página pública define título, descrição e canonical
// próprios com metadataDaPagina (lib/site.ts). Sem `url` aqui: og:url é sempre o da página.
export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'TV Complexo — A Real da Favela',
  description: DESCRICAO_PADRAO,
  openGraph: {
    title: 'TV Complexo — A Real da Favela',
    description: DESCRICAO_PADRAO,
    siteName: SITE_NOME,
    images: [{ ...OG_IMAGEM, url: urlAbsoluta(OG_IMAGEM.url) }],
    locale: 'pt_BR',
    type: 'website',
  },
  keywords: 'tv complexo, favela, comunidade, denúncias, complexo do alemão, rio de janeiro, mídia comunitária',
};

// Fontes do estilo urbano (components/home-urbano/fontes.js) valem para o site todo; só a Anton
// (títulos) é pré-carregada. Inter e Bebas ficam para o painel admin (tema escuro), sem preload.
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap', preload: false });
const bebas = Bebas_Neue({ weight: '400', subsets: ['latin'], variable: '--font-bebas', display: 'swap', preload: false });

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${bebas.variable} ${fontesUrbano}`}>
      <head>
        <meta name="theme-color" content="#FFD60A" />
        <link rel="icon" href="/logo.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
        <BottomNav />
      </body>
    </html>
  );
}
