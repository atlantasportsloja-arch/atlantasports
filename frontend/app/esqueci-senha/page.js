'use client';
import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setEnviado(true);
    } catch {
      toast.error('Erro ao processar solicitação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="card p-8 w-full max-w-md">
        {enviado ? (
          <div className="text-center">
            <div className="text-5xl mb-4">📧</div>
            <h1 className="text-2xl font-black mb-2">E-mail enviado!</h1>
            <p className="text-gray-500 text-sm mb-6">
              Se este e-mail estiver cadastrado, você receberá um link para redefinir sua senha em instantes. Verifique também a caixa de spam.
            </p>
            <Link href="/login" className="btn-primary inline-block">
              Voltar ao login
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-black mb-1">Esqueci minha senha</h1>
            <p className="text-gray-500 text-sm mb-6">
              Informe seu e-mail e enviaremos um link para redefinir sua senha.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">E-mail</label>
                <input
                  type="email"
                  className="input"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar link de redefinição'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Lembrou a senha?{' '}
              <Link href="/login" className="text-primary-500 font-semibold hover:underline">
                Voltar ao login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
