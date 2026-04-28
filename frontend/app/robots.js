const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://atlantasports.com.br';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/checkout', '/carrinho', '/minha-conta/', '/pedido/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
