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
    <footer className="bg-gray-900 text-gray-400 mt-12 md:mt-16">
      <div className="max-w-7xl mx-auto px-4 py-10 md:py-12 grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8">
        <div>
          <p className="text-xl font-black text-primary-500 mb-3">
            {name}<span className="text-white">{tag ? ` ${tag}` : ''}</span>
          </p>
          <p className="text-sm">{config.footerDesc}</p>
          {config.whatsapp && (
            <a href={`https://wa.me/${config.whatsapp}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-3 text-green-400 hover:text-green-300 text-sm font-semibold">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
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
                  className="inline-flex items-center gap-1.5 text-green-400 hover:text-green-300">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 shrink-0">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
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
