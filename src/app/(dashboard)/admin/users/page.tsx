'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Check, LoaderCircle, Pencil, Plus, Search, Trash2, UserRound, X } from 'lucide-react';
import axios from 'axios';
import apiClient from '@/services/apiClient';
import { useAuth } from '@/context/AuthContext';
import AdminSidebar from '@/components/AdminSidebar';

const getApiError = (error: unknown, fallback: string) => {
  if (axios.isAxiosError<{ error?: string }>(error)) {
    return error.response?.data?.error || fallback;
  }
  return error instanceof Error ? error.message : fallback;
};

type AdminUser = {
  _id?: string;
  id?: string;
  author_id?: string;
  name: string;
  email: string;
  role: string;
  status?: string;
  joined_date?: string;
  createdAt?: string;
};
type UserForm = {
  author_id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  status: 'active' | 'inactive';
  joined_date: string;
};
const blankForm: UserForm = {
  author_id: '',
  name: '',
  email: '',
  password: '',
  role: 'author',
  status: 'active',
  joined_date: '',
};

export default function AdminUsersPage() {
  const { user, logout, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [form, setForm] = useState<UserForm>(blankForm);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  const fetchUsers = useCallback(async () => {
    setError('');
    try {
      const response = await apiClient.get<AdminUser[]>('/users');
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(getApiError(err, 'Unable to load users. Please try again.'));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { router.replace('/'); return; }
    if (user?.role !== 'admin') { router.replace('/dashboard'); return; }
    void fetchUsers();
  }, [authLoading, isAuthenticated, user?.role, router, fetchUsers]);

  const startCreate = () => { setEditing(null); setForm(blankForm); setNotice(''); };
  const startEdit = (person: AdminUser) => {
    setEditing(person);
    setForm({
      author_id: person.author_id || '',
      name: person.name,
      email: person.email,
      password: '',
      role: person.role || 'author',
      status: person.status === 'inactive' ? 'inactive' : 'active',
      joined_date: person.joined_date?.slice(0, 10) || '',
    });
    setNotice('');
  };

  const saveUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true); setError(''); setNotice('');
    const payload = {
      author_id: form.author_id || undefined,
      name: form.name,
      email: form.email,
      role: form.role,
      joined_date: form.joined_date || undefined,
      ...(editing ? { status: form.status } : { password: form.password }),
      ...(editing && form.password ? { password: form.password } : {}),
    };
    try {
      if (editing) {
        const id = editing._id || editing.id;
        if (!id) throw new Error('This user has no identifier.');
        await apiClient.put(`/users/${id}`, payload);
        setNotice('User details updated.');
      } else {
        await apiClient.post('/users', payload);
        setNotice('User created successfully.');
      }
      setForm(blankForm); setEditing(null); await fetchUsers();
    } catch (err) {
      console.error('Error saving user:', err);
      setError(getApiError(err, 'Unable to save this user. Check the details and try again.'));
    } finally { setSaving(false); }
  };

  const deleteUser = async (person: AdminUser) => {
    const id = person._id || person.id;
    if (!id || !window.confirm(`Deactivate ${person.name}? You can reactivate this account by editing its status.`)) return;
    setError(''); setNotice('');
    try {
      await apiClient.delete(`/users/${id}`);
      if ((editing?._id || editing?.id) === id) { setEditing(null); setForm(blankForm); }
      setNotice('User deactivated.'); await fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(getApiError(err, 'Unable to deactivate this user. Please try again.'));
    }
  };

  const visibleUsers = users.filter((person) => `${person.author_id || ''} ${person.name} ${person.email} ${person.role} ${person.status || 'active'}`.toLowerCase().includes(query.toLowerCase()));
  if (authLoading || !isAuthenticated || !user || user.role !== 'admin' || loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm font-semibold text-slate-500">Loading Support Admin...</div>;
  }

  return <div className="min-h-screen bg-[#F7F7F8] font-sans text-slate-900">
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
      <div className="mx-auto flex h-[76px] max-w-[1600px] items-center justify-between px-5 sm:px-8 lg:px-10">
        <div className="flex items-center gap-4">
          <img src="https://static.wixstatic.com/media/6d2cdc_fbad8eb25d304d57be46e9c494a1a355~mv2.jpg/v1/fill/w_360,h_162,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/book%20background%20white.jpg" alt="BookLeaf Publishing" className="h-12 w-auto object-contain sm:h-14" />
          <span className="hidden border-l border-slate-200 pl-4 text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500 sm:block">Support Admin</span>
        </div>
        <div className="flex items-center gap-3 sm:gap-5">
          <div className="hidden text-right sm:block"><p className="text-sm font-bold">{user.name}</p><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Admin Workspace</p></div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">{user.name.charAt(0).toUpperCase()}</div>
          <button onClick={logout} className="rounded-lg px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-900">Log out</button>
        </div>
      </div>
    </header>

    <main className="mx-auto grid max-w-[1600px] gap-6 px-5 py-8 sm:px-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-10">
      <AdminSidebar />
      <div className="min-w-0">
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div><p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400">People & access</p><h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">All users</h1><p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-500">Manage author and support team accounts from one place.</p></div>
          <button onClick={startCreate} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-slate-700"><Plus className="h-4 w-4" /> Add user</button>
        </div>

        {(error || notice) && <div role="status" className={`mb-5 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold ${error ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{error ? <AlertCircle className="h-4 w-4 shrink-0" /> : <Check className="h-4 w-4 shrink-0" />}{error || notice}<button onClick={() => { setError(''); setNotice(''); }} aria-label="Dismiss message" className="ml-auto"><X className="h-4 w-4" /></button></div>}

        <div className="grid items-start gap-6 2xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div><h2 className="text-sm font-extrabold">User directory</h2><p className="mt-1 text-xs text-slate-500">{users.length} {users.length === 1 ? 'account' : 'accounts'}</p></div>
              <label className="relative block sm:w-72"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search users" className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-slate-400" /></label>
            </div>
            {visibleUsers.length ? <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left"><thead className="bg-slate-50 text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-400"><tr><th className="px-6 py-3">User</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Joined</th><th className="px-6 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{visibleUsers.map((person, index) => <tr key={person._id || person.id || person.email || index} className="transition-colors hover:bg-slate-50/70"><td className="px-6 py-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f4f0ed] text-sm font-extrabold text-[#704d3c]">{person.name?.charAt(0)?.toUpperCase() || <UserRound className="h-4 w-4" />}</div><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-900">{person.name}</p><p className="truncate text-xs text-slate-500">{person.email}</p></div></div></td><td className="px-4 py-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-600">{person.role}</span></td><td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${person.status === 'inactive' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>{person.status || 'active'}</span></td><td className="px-4 py-4 text-xs font-medium text-slate-500">{(person.joined_date || person.createdAt) ? new Date(person.joined_date || person.createdAt || '').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</td><td className="px-6 py-4"><div className="flex justify-end gap-1"><button onClick={() => startEdit(person)} aria-label={`Edit ${person.name}`} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900"><Pencil className="h-4 w-4" /></button><button onClick={() => void deleteUser(person)} aria-label={`Deactivate ${person.name}`} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button></div></td></tr>)}</tbody></table></div> : <div className="px-6 py-16 text-center"><UserRound className="mx-auto h-9 w-9 text-slate-200" /><p className="mt-3 text-sm font-bold text-slate-700">{query ? 'No users match your search' : 'No users yet'}</p><p className="mt-1 text-xs text-slate-500">{query ? 'Try a different name, email, or role.' : 'Create an account to get started.'}</p></div>}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] sm:p-6">
            <div className="mb-5 flex items-start justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">{editing ? 'Account details' : 'New account'}</p><h2 className="mt-1 text-lg font-extrabold">{editing ? 'Edit user' : 'Create a user'}</h2></div>{editing && <button onClick={startCreate} aria-label="Cancel editing" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>}</div>
            <form onSubmit={(e) => void saveUser(e)} className="space-y-4">
              <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-700">Full name</span><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-slate-400" placeholder="e.g. Aditi Sharma" /></label>
              <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-700">Email address</span><input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-slate-400" placeholder="name@example.com" /></label>
              <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-700">{editing ? 'New password (optional)' : 'Password'}</span><input required={!editing} type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-slate-400" placeholder={editing ? 'Leave blank to keep current password' : 'Enter a password'} /></label>
              <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-700">Role</span><select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium outline-none focus:border-slate-400"><option value="author">Author</option><option value="admin">Admin</option></select></label>
              <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-700">Joined date</span><input type="date" value={form.joined_date} onChange={(e) => setForm({ ...form, joined_date: e.target.value })} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-slate-400" /></label>
              {editing && <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-700">Status</span><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value === 'inactive' ? 'inactive' : 'active' })} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium outline-none focus:border-slate-400"><option value="active">Active</option><option value="inactive">Inactive</option></select></label>}
              <button disabled={saving} className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-bold text-white transition-colors hover:bg-slate-700 disabled:cursor-wait disabled:opacity-60">{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : editing ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{saving ? 'Saving…' : editing ? 'Save changes' : 'Create user'}</button>
            </form>
          </section>
        </div>
      </div>
    </main>
  </div>;
}
