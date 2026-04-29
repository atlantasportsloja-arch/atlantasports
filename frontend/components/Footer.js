'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function Footer() {
  const [config, setConfig] = useState({
    storeName: 'Atlanta Sports',
    footerDesc: 'Equipamentos e moda esportiva de alta performance.',
    footerEmail: 'atlantasportsloja@gmail.com',
    footerHours: 'Seg–Sex 9h–18h',
    whatsapp: '',
  });

  useEffect(() => {
    api.get('/config').then(r => setConfig(c => ({ ...c, ...r.data }))).catch(() => {});
  }, []);

  const [name, tag] = config.storeName?.includes(' ')
    ? [config.storeName.split(' ')[0], config.storeName.split(' ').slice(1).join(' ')]
    : [config.storeName, ''];

  return (
    <footer className="bg-gray-900 text-gray-400 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <p className="text-xl font-black text-primary-500 mb-3">
            {name}<span className="text-white">{tag ? ` ${tag}` : ''}</span>
          </p>
          <p className="text-sm">{config.footerDesc}</p>
          {config.whatsapp && (
            <a href={`https://wa.me/${config.whatsapp}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-3 text-green-400 hover:text-green-300 text-sm font-semibold">
              💬 WhatsApp
            </a>
          )}
        </div>
        {config.footerLinks?.length > 0 && (
          <div>
            <p className="text-white font-semibold mb-3">Loja</p>
            <ul className="space-y-2 text-sm">
              {config.footerLinks.map((l, i) => (
                <li key={i}>
                  <Link href={l.url} className="hover:text-white">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div>
          <p className="text-white font-semibold mb-3">Conta</p>
          <ul className="space-y-2 text-sm">
            <li><Link href="/login" className="hover:text-white">Entrar</Link></li>
            <li><Link href="/cadastro" className="hover:text-white">Criar conta</Link></li>
            <li><Link href="/minha-conta/pedidos" className="hover:text-white">Meus pedidos</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-white font-semibold mb-3">Atendimento</p>
          <ul className="space-y-2 text-sm">
            <li>{config.footerEmail}</li>
            <li>{config.footerHours}</li>
            {config.whatsapp && (
              <li>
                <a href={`https://wa.me/${config.whatsapp}`} target="_blank" rel="noopener noreferrer"
                  className="text-green-400 hover:text-green-300">
                  WhatsApp
                </a>
              </li>
            )}
            <li><Link href="/termos" className="hover:text-white">Termos de Uso</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-800 text-center py-4 text-xs text-gray-600">
        © {new Date().getFullYear()} {config.storeName}. Todos os direitos reservados.
      </div>
    </footer>
  );
}
