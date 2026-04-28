import { notFound } from 'next/navigation';
import ProductClient from './ProductClient';

const API = process.env.NEXT_PUBLIC_API_URL;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://atlantasports.com.br';

export async function generateMetadata({ params }) {
  try {
    const res = await fetch(`${API}/products/${params.slug}`, { next: { revalidate: 3600 } });
    if (!res.ok) return {};
    const p = await res.json();

    const title = p.name;
    const description = p.description
      ? p.description.slice(0, 155) + (p.description.length > 155 ? '…' : '')
      : `Compre ${p.name} com o melhor preço na Atlanta Sports.`;
    const image = p.images?.[0];
    const url = `${SITE_URL}/produto/${p.slug}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url,
        type: 'website',
        images: image ? [{ url: image, width: 800, height: 800, alt: p.name }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: image ? [image] : [],
      },
      alternates: { canonical: url },
    };
  } catch {
    return {};
  }
}

async function getProduct(slug) {
  try {
    const res = await fetch(`${API}/products/${slug}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function ProdutoPage({ params }) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  const jsonLd = product ? {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images || [],
    url: `${SITE_URL}/produto/${product.slug}`,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'BRL',
      price: product.price,
      availability: product.stock > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'Atlanta Sports' },
    },
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProductClient params={params} />
    </>
  );
}
