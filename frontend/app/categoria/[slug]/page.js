import { notFound } from 'next/navigation';
import CategoriaClient from './CategoriaClient';

const API = process.env.NEXT_PUBLIC_API_URL;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.atlantasports.com.br';

export async function generateMetadata({ params }) {
  try {
    const res = await fetch(`${API}/categories`, { next: { revalidate: 3600 } });
    if (!res.ok) return {};
    const categories = await res.json();
    const cat = categories.find(c => c.slug === params.slug);
    if (!cat) return {};

    const title = cat.name;
    const description = `Explore todos os produtos da categoria ${cat.name} na Atlanta Sports. Camisas, tênis e acessórios esportivos com o melhor preço.`;
    const url = `${SITE_URL}/categoria/${cat.slug}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url,
        type: 'website',
        images: cat.image ? [{ url: cat.image, width: 800, height: 600, alt: cat.name }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: cat.image ? [cat.image] : [],
      },
    };
  } catch {
    return {};
  }
}

export default async function CategoriaPage({ params }) {
  try {
    const res = await fetch(`${API}/categories`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const categories = await res.json();
      if (!categories.find(c => c.slug === params.slug)) notFound();
    }
  } catch { /* deixa o cliente lidar */ }

  return <CategoriaClient />;
}
