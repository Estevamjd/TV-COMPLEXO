import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'TV Complexo — Mídia Comunitária Independente',
  description: 'Plataforma digital comunitária focada em vídeos, denúncias e notícias das favelas do Rio de Janeiro. A voz da comunidade.',
  keywords: 'tv complexo, favela, comunidade, denúncias, complexo do alemão, rio de janeiro, mídia comunitária',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
