'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, LogOut, Edit2, Save, X, Loader2, KeyRound, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';

export default function MinhaContaPage() {
  const { token, logout } = useAuthStore();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [editingInfo, setEditingInfo] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [infoForm, setInfoForm] = useState({ name: '', phone: '' });
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  useEffect(() => {
    if (!token) { router.push('/login'); return; }
    api.get('/auth/me').then(r => {
      setProfile(r.data);
      setInfoForm({ name: r.data.name, phone: r.data.phone || '' });
    }).catch(() => {});
  }, [token]);

  function handleLogout() {
    logout();
    router.push('/');
    toast.success('Até logo!');
  }

  async function saveInfo(e) {
    e.preventDefault();
    if (!infoForm.name.trim()) { toast.error('Nome obrigatório'); return; }
    setSavingInfo(true);
    try {
      const { data } = await api.put('/auth/me', { name: infoForm.name.trim(), phone: infoForm.phone.trim() });
      setProfile(p => ({ ...p, name: data.name, phone: data.phone }));
      toast.success('Perfil atualizado!');
      setEditingInfo(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao atualizar');
    } finally {
      setSavingInfo(false);
    }
  }

  async function savePassword(e) {
    e.preventDefault();
    if (pwdForm.newPassword !== pwdForm.confirmPassword) { toast.error('As senhas não coincidem'); return; }
    if (pwdForm.newPassword.length < 6) { toast.error('Nova senha mínimo 6 caracteres'); return; }
    setSavingPassword(true);
    try {
      await api.put('/auth/me', { currentPassword: pwdForm.currentPassword, newPassword: pwdForm.newPassword });
      toast.success('Senha alterada com sucesso!');
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setEditingPassword(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao alterar senha');
    } finally {
      setSavingPassword(false);
    }
  }

  if (!profile) return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center text-gray-400">Carregando...</div>
  );

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-4">
      <h1 className="text-2xl font-black">Minha conta</h1>

      {/* Perfil */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary-500 rounded-full flex items-center justify-center text-white text-2xl font-black flex-shrink-0">
              {(profile.name?.[0] || '?').toUpperCase()}
            </div>
            <div>
              <p className="font-black text-lg leading-tight">{profile.name}</p>
              <p className="text-gray-500 text-sm">{profile.email}</p>
              {profile.phone && !editingInfo && <p className="text-gray-400 text-sm">{profile.phone}</p>}
            </div>
          </div>
          {!editingInfo && (
            <button
              onClick={() => { setEditingInfo(true); setEditingPassword(false); }}
              className="flex items-center gap-1 text-sm text-primary-500 hover:text-primary-700 font-semibold"
            >
              <Edit2 size={14} /> Editar
            </button>
          )}
        </div>

        {editingInfo && (
          <form onSubmit={saveInfo} className="space-y-3 border-t pt-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome</label>
              <input className="input" value={infoForm.name} onChange={e => setInfoForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Telefone <span className="text-gray-400 font-normal">(opcional)</span></label>
              <input className="input" value={infoForm.phone} onChange={e => setInfoForm(f => ({ ...f, phone: e.target.value }))} placeholder="(11) 99999-9999" />
            </div>
            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={savingInfo} className="btn-primary flex items-center gap-2">
                {savingInfo ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                Salvar
              </button>
              <button type="button" onClick={() => { setEditingInfo(false); setInfoForm({ name: profile.name, phone: profile.phone || '' }); }} className="btn-outline flex items-center gap-1">
                <X size={15} /> Cancelar
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Senha */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <KeyRound size={18} className="text-gray-400" />
            <p className="font-semibold">Senha</p>
          </div>
          {!editingPassword && (
            <button
              onClick={() => { setEditingPassword(true); setEditingInfo(false); }}
              className="flex items-center gap-1 text-sm text-primary-500 hover:text-primary-700 font-semibold"
            >
              <Edit2 size={14} /> Alterar
            </button>
          )}
        </div>

        {editingPassword && (
          <form onSubmit={savePassword} className="space-y-3 mt-4 border-t pt-4">
            <div>
              <label className="block text-sm font-medium mb-1">Senha atual</label>
              <div className="relative">
                <input type={showCurrentPwd ? 'text' : 'password'} className="input pr-10" value={pwdForm.currentPassword} onChange={e => setPwdForm(f => ({ ...f, currentPassword: e.target.value }))} required />
                <button type="button" onClick={() => setShowCurrentPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showCurrentPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nova senha</label>
              <div className="relative">
                <input type={showNewPwd ? 'text' : 'password'} className="input pr-10" value={pwdForm.newPassword} onChange={e => setPwdForm(f => ({ ...f, newPassword: e.target.value }))} minLength={6} required />
                <button type="button" onClick={() => setShowNewPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showNewPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Confirmar nova senha</label>
              <input
                type="password"
                className={`input ${pwdForm.confirmPassword && pwdForm.newPassword !== pwdForm.confirmPassword ? 'border-red-400' : ''}`}
                value={pwdForm.confirmPassword}
                onChange={e => setPwdForm(f => ({ ...f, confirmPassword: e.target.value }))}
                required
              />
              {pwdForm.confirmPassword && pwdForm.newPassword !== pwdForm.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">As senhas não coincidem</p>
              )}
            </div>
            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={savingPassword} className="btn-primary flex items-center gap-2">
                {savingPassword ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                Alterar senha
              </button>
              <button type="button" onClick={() => { setEditingPassword(false); setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); }} className="btn-outline flex items-center gap-1">
                <X size={15} /> Cancelar
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Pedidos */}
      <Link href="/minha-conta/pedidos" className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
        <Package size={20} className="text-primary-500" />
        <span className="font-semibold">Meus pedidos</span>
        <span className="ml-auto text-gray-300">→</span>
      </Link>

      {/* Sair */}
      <button onClick={handleLogout} className="w-full card p-4 flex items-center gap-3 hover:shadow-md transition-shadow text-red-500">
        <LogOut size={20} />
        <span className="font-semibold">Sair da conta</span>
      </button>
    </div>
  );
}
