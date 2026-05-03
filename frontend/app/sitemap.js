const API = process.env.NEXT_PUBLIC_API_URL;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.atlantasports.com.br';

export default async function sitemap() {
  const staticPages = [
    { url: SITE_URL, priority: 1.0, changeFrequency: 'daily' },
    { url: `${SITE_URL}/busca`, priority: 0.8, changeFrequency: 'weekly' },
    { url: `${SITE_URL}/depoimentos`, priority: 0.5, changeFrequency: 'monthly' },
    { url: `${SITE_URL}/login`, priority: 0.3, changeFrequency: 'yearly' },
    { url: `${SITE_URL}/cadastro`, priority: 0.3, changeFrequency: 'yearly' },
  ];

  let productPages = [];
  let categoryPages = [];

  try {
    const [productsRes, categoriesRes] = await Promise.allSettled([
      fetch(`${API}/products?limit=500&page=1`, { next: { revalidate: 3600 } }),
      fetch(`${API}/categories`, { next: { revalidate: 3600 } }),
    ]);

    if (productsRes.status === 'fulfilled' && productsRes.value.ok) {
      const data = await productsRes.value.json();
      const products = data.products || data;
      productPages = products.map(p => ({
        url: `${SITE_URL}/produto/${p.slug}`,
        lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
        priority: 0.9,
        changeFrequency: 'weekly',
      }));
    }

    if (categoriesRes.status === 'fulfilled' && categoriesRes.value.ok) {
      const categories = await categoriesRes.value.json();
      categoryPages = categories.map(c => ({
        url: `${SITE_URL}/categoria/${c.slug}`,
        priority: 0.7,
        changeFrequency: 'weekly',
      }));
    }
  } catch {
    // silently fail — static pages still get indexed
  }

  return [...staticPages, ...categoryPages, ...productPages];
}
