'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { User, Package, LogOut } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';

export default function MinhaContaPage() {
  const { token, user, logout } = useAuthStore();
  const router = useRouter();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!token) { router.push('/login'); return; }
    api.get('/auth/me').then(r => setProfile(r.data)).catch(() => {});
  }, [token]);

  function handleLogout() {
    logout();
    router.push('/');
    toast.success('Até logo!');
  }

  if (!profile) return <div className="max-w-xl mx-auto px-4 py-16 text-center text-gray-400">Carregando...</div>;

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black mb-6">Minha conta</h1>

      <div className="card p-6 mb-4 flex items-center gap-4">
        <div className="w-14 h-14 bg-primary-500 rounded-full flex items-center justify-center text-white text-2xl font-black">
          {profile.name[0].toUpperCase()}
        </div>
        <div>
          <p className="font-black text-lg">{profile.name}</p>
          <p className="text-gray-500 text-sm">{profile.email}</p>
          {profile.phone && <p className="text-gray-400 text-sm">{profile.phone}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Link href="/minha-conta/pedidos" className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
          <Package size={20} className="text-primary-500" />
          <span className="font-semibold">Meus pedidos</span>
        </Link>

        <button
          onClick={handleLogout}
          className="w-full card p-4 flex items-center gap-3 hover:shadow-md transition-shadow text-red-500"
        >
          <LogOut size={20} />
          <span className="font-semibold">Sair da conta</span>
        </button>
      </div>
    </div>
  );
}
