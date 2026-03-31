import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
  metadataBase: new URL('https://tvcomplexo.com.br'),
  title: 'TV Complexo — Mídia Comunitária Independente',
  description: 'Plataforma digital comunitária focada em vídeos, denúncias e notícias do Complexo do Alemão.',
  openGraph: {
    title: 'TV Complexo — Mídia Comunitária Independente',
    description: 'Plataforma digital comunitária focada em vídeos, denúncias e notícias do Complexo do Alemão.',
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
      </body>
    </html>
  );
}
