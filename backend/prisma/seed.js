require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaNeon } = require('@prisma/adapter-neon');
const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');
const bcrypt = require('bcrypt');

neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaNeon(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Iniciando seed...');

  // Admin
  const adminPass = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'atlantasportsloja@gmail.com' },
    update: {},
    create: { name: 'Admin Atlanta', email: 'atlantasportsloja@gmail.com', password: adminPass, role: 'ADMIN' },
  });
  console.log('Admin criado:', admin.email);

  // Categorias
  const categorias = [
    { name: 'Camisas', slug: 'camisas' },
    { name: 'Tênis', slug: 'tenis' },
    { name: 'Acessórios', slug: 'acessorios' },
    { name: 'Fitness', slug: 'fitness' },
  ];

  const cats = {};
  for (const cat of categorias) {
    const c = await prisma.category.upsert({ where: { slug: cat.slug }, update: {}, create: cat });
    cats[cat.slug] = c;
  }
  console.log('Categorias criadas');

  // Produtos
  const produtos = [
    { name: 'Camisa Brasil 2024 Titular', slug: 'camisa-brasil-2024-titular', description: 'Camisa oficial da seleção brasileira. Material tecnológico com Dri-FIT.', price: 299.9, comparePrice: 399.9, stock: 50, categoryId: cats['camisas'].id, images: ['https://placehold.co/600x600/009c3b/FFF?text=Brasil+2024'] },
    { name: 'Camisa Flamengo 2024 Home', slug: 'camisa-flamengo-2024-home', description: 'Camisa oficial do Flamengo. Listras clássicas rubro-negras.', price: 249.9, comparePrice: 329.9, stock: 35, categoryId: cats['camisas'].id, images: ['https://placehold.co/600x600/CC0000/FFF?text=Flamengo+2024'] },
    { name: 'Camisa Manchester City 2024', slug: 'camisa-manchester-city-2024', description: 'Camisa azul-celeste do City. Edição especial Champions.', price: 349.9, stock: 20, categoryId: cats['camisas'].id, images: ['https://placehold.co/600x600/6CADDF/FFF?text=Man+City'] },
    { name: 'Camisa Real Madrid 2024', slug: 'camisa-real-madrid-2024', description: 'A camisa mais vencedora do mundo. Branco clássico.', price: 349.9, stock: 25, categoryId: cats['camisas'].id, images: ['https://placehold.co/600x600/FEBE10/000?text=Real+Madrid'] },

    { name: 'Nike Air Zoom Pegasus 41', slug: 'nike-air-zoom-pegasus-41', description: 'Tênis de corrida com amortecimento reativo. Ideal para treinos longos.', price: 799.9, comparePrice: 999.9, stock: 15, categoryId: cats['tenis'].id, images: ['https://placehold.co/600x600/111827/FFF?text=Pegasus+41'] },
    { name: 'Adidas Ultraboost 24', slug: 'adidas-ultraboost-24', description: 'Energia que retorna a cada passada. Tecnologia Boost exclusiva.', price: 899.9, stock: 12, categoryId: cats['tenis'].id, images: ['https://placehold.co/600x600/000/FFF?text=Ultraboost+24'] },
    { name: 'New Balance 990v6', slug: 'new-balance-990v6', description: 'Clássico americano com suporte superior. Feito nos EUA.', price: 1199.9, stock: 8, categoryId: cats['tenis'].id, images: ['https://placehold.co/600x600/888/FFF?text=NB+990v6'] },

    { name: 'Meião Esportivo Antiderrapante', slug: 'meiao-esportivo-antiderrapante', description: 'Par de meias esportivas com tecnologia antiderrapante e respirável.', price: 49.9, stock: 100, categoryId: cats['acessorios'].id, images: ['https://placehold.co/600x600/f97316/FFF?text=Meiao'] },
    { name: 'Boné Aba Reta Atlanta Sports', slug: 'bone-aba-reta-atlanta', description: 'Boné exclusivo Atlanta Sports. Tecido dry-fit e ajuste em velcro.', price: 89.9, stock: 60, categoryId: cats['acessorios'].id, images: ['https://placehold.co/600x600/111827/f97316?text=Atlanta'] },
    { name: 'Caneleira Profissional Pro Shield', slug: 'caneleira-profissional-pro-shield', description: 'Proteção total para treinos e jogos. Espuma de alta densidade.', price: 69.9, stock: 40, categoryId: cats['acessorios'].id, images: ['https://placehold.co/600x600/1e40af/FFF?text=Caneleira'] },

    { name: 'Halteres Emborrachados 10kg (par)', slug: 'halteres-emborrachados-10kg', description: 'Par de halteres emborrachados 10kg. Pega antiderrapante.', price: 189.9, stock: 20, categoryId: cats['fitness'].id, images: ['https://placehold.co/600x600/374151/FFF?text=Halteres+10kg'] },
    { name: 'Corda de Pular Speed Rope', slug: 'corda-pular-speed-rope', description: 'Corda de pular profissional com rolamentos. Ideal para crossfit.', price: 119.9, comparePrice: 159.9, stock: 30, categoryId: cats['fitness'].id, images: ['https://placehold.co/600x600/f97316/FFF?text=Speed+Rope'] },
  ];

  for (const p of produtos) {
    await prisma.product.upsert({ where: { slug: p.slug }, update: {}, create: p });
  }
  console.log(`${produtos.length} produtos criados`);

  // Cupom exemplo
  await prisma.coupon.upsert({
    where: { code: 'ATLANTA10' },
    update: {},
    create: { code: 'ATLANTA10', discount: 10, type: 'percentage', minValue: 100, active: true },
  });
  console.log('Cupom ATLANTA10 criado');

  console.log('Seed concluído!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
