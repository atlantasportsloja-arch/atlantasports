import './globals.css';
import { Toaster } from 'react-hot-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BottomNav from '@/components/BottomNav';
import FloatingWhatsApp from '@/components/FloatingWhatsApp';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.atlantasports.com.br';
const API_URL  = process.env.NEXT_PUBLIC_API_URL;

const DEFAULT_ICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32'%3E%3Crect width='32' height='32' rx='7' fill='%23f97316'/%3E%3Cpolygon points='16,4 19,4 12,28 9,28' fill='white'/%3E%3Cpolygon points='13,4 16,4 23,28 20,28' fill='white'/%3E%3Crect x='10.5' y='17.5' width='11' height='3' fill='white'/%3E%3C/svg%3E";

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export async function generateMetadata() {
  let faviconUrl = DEFAULT_ICON;
  try {
    const r = await fetch(`${API_URL}/config`, { next: { revalidate: 3600 } });
    const data = await r.json();
    if (data.faviconUrl) faviconUrl = data.faviconUrl;
  } catch {}

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: 'Atlanta Sports', template: '%s | Atlanta Sports' },
    description: 'Loja esportiva — camisas oficiais, tênis de performance e acessórios fitness. Frete grátis acima de R$ 299.',
    keywords: ['camisas de time', 'tênis esportivo', 'loja esportiva', 'atlanta sports', 'moda esportiva', 'acessórios fitness'],
    authors: [{ name: 'Atlanta Sports' }],
    creator: 'Atlanta Sports',
    icons: { icon: faviconUrl, apple: faviconUrl },
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
}

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
