import { Inter, Bebas_Neue } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BottomNav from '@/components/BottomNav';
import OcultarNaHome from '@/components/OcultarNaHome';
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

// Fontes das páginas internas, servidas pelo próprio site (antes: @import do Google Fonts no
// globals.css, que bloqueava o render de todas as páginas, inclusive a home, que nem usa).
// Sem preload: a home pré-carrega só a fonte do topo (components/home-urbano/fontes.js).
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap', preload: false });
const bebas = Bebas_Neue({ weight: '400', subsets: ['latin'], variable: '--font-bebas', display: 'swap', preload: false });

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${bebas.variable}`}>
      <head>
        <meta name="theme-color" content="#0a0a0a" />
        <link rel="icon" href="/logo.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body>
        <Header />
        <main>{children}</main>
        <OcultarNaHome><Footer /></OcultarNaHome>
        <BottomNav />
      </body>
    </html>
  );
}
