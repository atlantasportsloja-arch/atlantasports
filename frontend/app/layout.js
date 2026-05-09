import './globals.css';
import { Toaster } from 'react-hot-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BottomNav from '@/components/BottomNav';
import FloatingWhatsApp from '@/components/FloatingWhatsApp';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.atlantasports.com.br';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Atlanta Sports', template: '%s | Atlanta Sports' },
  description: 'Loja esportiva — camisas oficiais, tênis de performance e acessórios fitness. Frete grátis acima de R$ 299.',
  keywords: ['camisas de time', 'tênis esportivo', 'loja esportiva', 'atlanta sports', 'moda esportiva', 'acessórios fitness'],
  authors: [{ name: 'Atlanta Sports' }],
  creator: 'Atlanta Sports',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: SITE_URL,
    siteName: 'Atlanta Sports',
    title: 'Atlanta Sports — Loja Esportiva',
    description: 'Camisas oficiais, tênis de performance e acessórios fitness. Frete grátis acima de R$ 299.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Atlanta Sports' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Atlanta Sports — Loja Esportiva',
    description: 'Camisas oficiais, tênis de performance e acessórios fitness.',
    images: ['/og-image.jpg'],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: SITE_URL },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <Header />
        <main className="min-h-screen pb-16 md:pb-0">{children}</main>
        <Footer />
        <BottomNav />
        <FloatingWhatsApp />
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
