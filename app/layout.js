import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BottomNav from '@/components/BottomNav';

export const metadata = {
  metadataBase: new URL('https://tvcomplexo.com.br'),
  title: 'TV Complexo — A Real da Favela',
  description: 'A real da favela. Vídeos, denúncias e notícias direto das comunidades do Rio de Janeiro.',
  openGraph: {
    title: 'TV Complexo — A Real da Favela',
    description: 'A real da favela. Vídeos, denúncias e notícias direto das comunidades do Rio de Janeiro.',
    url: 'https://tvcomplexo.com.br',
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

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="theme-color" content="#0a0a0a" />
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
