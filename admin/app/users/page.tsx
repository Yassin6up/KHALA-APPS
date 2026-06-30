'use client';

import { useEffect, useState, useCallback, Fragment } from 'react';
import { Search, Trash2, ChevronDown, X, Phone, Mail, Calendar, Hash } from 'lucide-react';
import { adminFetch, fileUrl } from '../lib/api';
import { useApp, appColor } from '../lib/app-context';

interface Subscription { id: string; status: string; planId: string; }
interface User {
  id: string; fullName: string | null; email: string | null; phone: string | null;
  avatarUrl: string | null; createdAt: string; role: string; joinedAt: string;
  subscription: Subscription | null;
}
interface PageResult { data: User[]; total: number; page: number; pageSize: number; totalPages: number; }

const statusConfig: Record<string, { label: string; badge: string }> = {
  active: { label: 'نشط', badge: 'badge-green' },
  trialing: { label: 'تجريبي', badge: 'badge-yellow' },
  canceled: { label: 'ملغي', badge: 'badge-red' },
};

function initials(name: string | null, email: string | null) {
  if (name) return name.trim().slice(0, 2);
  if (email) return email.slice(0, 2).toUpperCase();
  return '؟';
}
const fmtDate = (d: string) => new Date(d).toLocaleDateString('ar-OM', { year: 'numeric', month: 'short', day: 'numeric' });

export default function UsersPage() {
  const { appKey } = useApp();
  const [result, setResult] = useState<PageResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ appKey, page: page.toString(), ...(search ? { search } : {}) });
      setResult(await adminFetch(`/admin/users?${params}`));
    } catch (e) { setError((e as Error).message); } finally { setLoading(false); }
  }, [page, search, appKey]);

  useEffect(() => { if (appKey) load(); }, [load]);
  useEffect(() => { setPage(1); }, [appKey]);

  function handleSearch(e: React.FormEvent) { e.preventDefault(); setSearch(searchInput); setPage(1); }

  async function handleDelete(id: string, name: string | null) {
    if (!confirm(`حذف المستخدم "${name ?? id}"؟ لا يمكن التراجع.`)) return;
    try { await adminFetch(`/admin/users/${id}`, { method: 'DELETE' }); await load(); }
    catch (e) { alert('خطأ: ' + (e as Error).message); }
  }

  return (
    <div>
      <div className="page-head">
        <div style={{ color: 'var(--text-2)', fontSize: 14 }}>
          {result ? `${result.total.toLocaleString('ar')} مستخدم` : '…'}
        </div>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
          <div className="search-box">
            <Search size={17} color="var(--text-3)" />
            <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="بحث بالاسم أو البريد…" />
            {search && <X size={16} color="var(--text-3)" style={{ cursor: 'pointer' }} onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }} />}
          </div>
          <button type="submit" className="btn btn-primary">بحث</button>
        </form>
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>المستخدم</th><th>التواصل</th><th>الانضمام</th><th>الاشتراك</th><th style={{ textAlign: 'left' }}>إجراءات</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5}><div className="empty">جارٍ التحميل…</div></td></tr>
            ) : !result || result.data.length === 0 ? (
              <tr><td colSpan={5}><div className="empty">لا يوجد مستخدمون</div></td></tr>
            ) : result.data.map((user) => {
              const name = user.fullName ?? user.email ?? user.phone ?? 'مجهول';
              const sc = user.subscription?.status ? statusConfig[user.subscription.status] ?? { label: user.subscription.status, badge: 'badge-gray' } : null;
              const open = expandedId === user.id;
              return (
                <Fragment key={user.id}>
                  <tr style={{ cursor: 'pointer' }} onClick={() => setExpandedId(open ? null : user.id)}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                        {user.avatarUrl
                          ? <img src={fileUrl(user.avatarUrl)} alt={name} className="avatar" style={{ width: 38, height: 38 }} />
                          : <div className="avatar" style={{ width: 38, height: 38, background: appColor(name), fontSize: 14 }}>{initials(user.fullName, user.email)}</div>}
                        <div>
                          <div style={{ fontWeight: 700 }}>{name}</div>
                          <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{user.role}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-2)', fontSize: 13 }}>{user.email ?? user.phone ?? '—'}</td>
                    <td style={{ color: 'var(--text-2)', fontSize: 13 }}>{fmtDate(user.joinedAt)}</td>
                    <td>{sc ? <span className={`badge ${sc.badge}`}>{sc.label}</span> : <span style={{ color: 'var(--text-3)', fontSize: 13 }}>بلا اشتراك</span>}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 7, justifyContent: 'flex-start', alignItems: 'center' }}>
                        <button className="icon-btn danger" onClick={() => handleDelete(user.id, user.fullName)}><Trash2 size={15} /></button>
                        <ChevronDown size={16} color="var(--text-3)" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: '.2s' }} />
                      </div>
                    </td>
                  </tr>
                  {open && (
                    <tr style={{ background: 'var(--surface-2)' }}>
                      <td colSpan={5} style={{ padding: '14px 24px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                          {[
                            { icon: Hash, label: 'المعرف', value: user.id, mono: true },
                            { icon: Phone, label: 'الهاتف', value: user.phone ?? '—' },
                            { icon: Mail, label: 'البريد', value: user.email ?? '—' },
                            { icon: Calendar, label: 'التسجيل', value: fmtDate(user.createdAt) },
                          ].map((row) => (
                            <div key={row.label} style={{ display: 'flex', gap: 10 }}>
                              <row.icon size={16} color="var(--text-3)" style={{ marginTop: 2 }} />
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: 11.5, color: 'var(--text-3)', fontWeight: 600 }}>{row.label}</div>
                                <div style={{ fontSize: 13, marginTop: 2, fontFamily: row.mono ? 'monospace' : 'inherit', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.value}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {result && result.totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20, justifyContent: 'center' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>السابق</button>
          <span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>صفحة {page.toLocaleString('ar')} من {result.totalPages.toLocaleString('ar')}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setPage((p) => Math.min(result.totalPages, p + 1))} disabled={page === result.totalPages}>التالي</button>
        </div>
      )}
    </div>
  );
}
