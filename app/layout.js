import { Inter, Bebas_Neue } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BottomNav from '@/components/BottomNav';
import OcultarNaHome from '@/components/OcultarNaHome';
import { SITE_URL } from '@/lib/site-url';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'TV Complexo — A Real da Favela',
  description: 'A real da favela. Vídeos, denúncias e notícias direto das comunidades do Rio de Janeiro.',
  openGraph: {
    title: 'TV Complexo — A Real da Favela',
    description: 'A real da favela. Vídeos, denúncias e notícias direto das comunidades do Rio de Janeiro.',
    url: '/',
    siteName: 'TV Complexo',
    images: [
      {
        url: '/og-tv-complexo.jpg',
        width: 1200,
        height: 630,
        alt: 'TV Complexo Preview',
      },
    ],
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
