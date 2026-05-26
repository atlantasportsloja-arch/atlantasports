'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export default function RedefinirSenhaPage() {
  const { token } = useParams();
  const router = useRouter();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [concluido, setConcluido] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error('As senhas não coincidem'); return; }
    if (form.password.length < 6) { toast.error('Senha mínimo 6 caracteres'); return; }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password: form.password });
      setConcluido(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Link inválido ou expirado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="card p-8 w-full max-w-md">
        {concluido ? (
          <div className="text-center">
            <div className="text-5xl mb-4">✅</div>
            <h1 className="text-2xl font-black mb-2">Senha redefinida!</h1>
            <p className="text-gray-500 text-sm mb-6">
              Sua senha foi alterada com sucesso. Faça login com a nova senha.
            </p>
            <Link href="/login" className="btn-primary inline-block">
              Ir para o login
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-black mb-1">Nova senha</h1>
            <p className="text-gray-500 text-sm mb-6">Escolha uma nova senha para sua conta.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nova senha</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="input pr-10"
                    placeholder="Mínimo 6 caracteres"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    required
                    minLength={6}
                  />
                  <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Confirmar nova senha</label>
                <input
                  type="password"
                  className={`input ${form.confirm && form.password !== form.confirm ? 'border-red-400' : ''}`}
                  placeholder="Repita a senha"
                  value={form.confirm}
                  onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                  required
                />
                {form.confirm && form.password !== form.confirm && (
                  <p className="text-red-500 text-xs mt-1">As senhas não coincidem</p>
                )}
              </div>
              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? 'Salvando...' : 'Redefinir senha'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
