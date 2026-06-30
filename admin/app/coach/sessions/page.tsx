'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, Clock, Link2, Check, X, Info } from 'lucide-react';
import { coachFetch } from '../../lib/coach-auth';

type Session = {
  id: string; scheduledAt: string; durationMin: number; status: string;
  meetingUrl?: string; notesAr?: string;
};
type AvailDay = { dayOfWeek: number; slots: string[] };

const DAY_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const ALL_SLOTS = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'];
const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  scheduled: { label: 'محجوزة', cls: 'badge-blue' },
  confirmed:  { label: 'مؤكدة',  cls: 'badge-green' },
  done:       { label: 'منتهية', cls: 'badge-gray' },
  canceled:   { label: 'ملغاة',  cls: 'badge-red' },
};

export default function CoachSessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [avail, setAvail] = useState<AvailDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingAvail, setSavingAvail] = useState(false);
  const [meetingInputs, setMeetingInputs] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<'sessions' | 'availability'>('sessions');
  const [priceSAR, setPriceSAR] = useState('');

  useEffect(() => {
    Promise.all([
      coachFetch<Session[]>('/coach-portal/sessions').then(setSessions).catch(() => []),
      coachFetch<AvailDay[]>('/coach-portal/availability').then(setAvail).catch(() => []),
      coachFetch<any>('/coach-portal/me').then((d) => { if (d.priceSAR) setPriceSAR(String(d.priceSAR)); }).catch(() => null),
    ]).finally(() => setLoading(false));
  }, []);

  function toggleSlot(day: number, slot: string) {
    setAvail((prev) => {
      const found = prev.find((d) => d.dayOfWeek === day);
      if (found) {
        const slots = found.slots.includes(slot) ? found.slots.filter((s) => s !== slot) : [...found.slots, slot].sort();
        return prev.map((d) => d.dayOfWeek === day ? { ...d, slots } : d);
      }
      return [...prev, { dayOfWeek: day, slots: [slot] }];
    });
  }

  function toggleDay(day: number) {
    setAvail((prev) => {
      const found = prev.find((d) => d.dayOfWeek === day);
      if (found && found.slots.length > 0) return prev.map((d) => d.dayOfWeek === day ? { ...d, slots: [] } : d);
      return prev.find((d) => d.dayOfWeek === day)
        ? prev.map((d) => d.dayOfWeek === day ? { ...d, slots: ['09:00', '10:00', '11:00'] } : d)
        : [...prev, { dayOfWeek: day, slots: ['09:00', '10:00', '11:00'] }];
    });
  }

  function getSlots(day: number) {
    return avail.find((d) => d.dayOfWeek === day)?.slots ?? [];
  }

  async function saveAvailability() {
    setSavingAvail(true);
    try {
      await coachFetch('/coach-portal/availability', { method: 'PUT', body: JSON.stringify({ days: avail.filter((d) => d.slots.length > 0) }) });
      if (priceSAR) {
        await coachFetch('/coach-portal/me', { method: 'PATCH', body: JSON.stringify({ priceSAR: Number(priceSAR) }) });
      }
      alert('تم حفظ المواعيد بنجاح ✓');
    } catch (e) { alert('خطأ: ' + (e as Error).message); } finally { setSavingAvail(false); }
  }

  async function saveMeetingUrl(sessionId: string) {
    const url = meetingInputs[sessionId]?.trim();
    if (!url) return;
    try {
      await coachFetch(`/coach-portal/sessions/${sessionId}`, {
        method: 'PATCH',
        body: JSON.stringify({ meetingUrl: url, status: 'confirmed' }),
      });
      setSessions((s) => s.map((x) => x.id === sessionId ? { ...x, meetingUrl: url, status: 'confirmed' } : x));
      setMeetingInputs((m) => { const n = { ...m }; delete n[sessionId]; return n; });
    } catch (e) { alert('خطأ: ' + (e as Error).message); }
  }

  const upcoming = sessions.filter((s) => ['scheduled', 'confirmed'].includes(s.status) && new Date(s.scheduledAt) >= new Date());
  const past = sessions.filter((s) => s.status === 'done' || new Date(s.scheduledAt) < new Date());

  return (
    <div style={{ padding: 32 }}>
      <div className="page-head">
        <div>
          <div className="page-h1">الجلسات والمواعيد</div>
          <div className="page-desc">إدارة حجوزاتك وضبط أوقات توافرك (توقيت عُمان)</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '2px solid #EAEDF3', paddingBottom: 0 }}>
        {[{ id: 'sessions', label: 'الجلسات المحجوزة' }, { id: 'availability', label: 'أوقات التوافر والسعر' }].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id as any)} style={{
            padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
            fontWeight: 700, fontSize: 14, borderBottom: tab === t.id ? '2px solid #2EC5B6' : '2px solid transparent',
            color: tab === t.id ? '#2EC5B6' : '#5A6473', marginBottom: -2,
          }}>{t.label}</button>
        ))}
      </div>

      {tab === 'sessions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* How to add Google Meet */}
          <div style={S.infoBox}>
            <Info size={18} color="#3B82F6" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#131826' }}>كيف تنشئ رابط Google Meet؟</div>
              <div style={{ fontSize: 13, color: '#5A6473', marginTop: 4, lineHeight: 1.7 }}>
                ١. افتح <a href="https://meet.google.com" target="_blank" rel="noreferrer" style={{ color: '#3B82F6', fontWeight: 700 }}>meet.google.com</a> في المتصفح<br />
                ٢. انقر <strong>"اجتماع جديد"</strong> ثم <strong>"إنشاء اجتماع للمستقبل"</strong><br />
                ٣. <strong>انسخ الرابط</strong> وضعه في حقل "رابط الاجتماع" أدناه
              </div>
            </div>
          </div>

          {/* Upcoming */}
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#131826', marginBottom: 14 }}>الجلسات القادمة ({upcoming.length})</div>
            {upcoming.length === 0 ? <div style={S.empty}>لا توجد جلسات قادمة</div> : upcoming.map((s) => {
              const d = new Date(s.scheduledAt);
              const st = STATUS_MAP[s.status] ?? STATUS_MAP.scheduled;
              return (
                <div key={s.id} style={S.sessionCard}>
                  <div style={S.sessionLeft}>
                    <div style={S.sessionDateBig}>{d.toLocaleDateString('ar-OM', { month: 'short', day: 'numeric', timeZone: 'Asia/Muscat' })}</div>
                    <div style={S.sessionTimeBig}>{d.toLocaleTimeString('ar-OM', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Muscat' })}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span className={`badge ${st.cls}`}>{st.label}</span>
                      <span style={{ fontSize: 13, color: '#5A6473' }}>{s.durationMin} دقيقة</span>
                    </div>
                    {s.notesAr && <div style={{ fontSize: 13, color: '#5A6473', marginBottom: 8 }}>📝 {s.notesAr}</div>}
                    {s.meetingUrl ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <a href={s.meetingUrl} target="_blank" rel="noreferrer" style={S.meetingLink}>
                          <Link2 size={14} /> {s.meetingUrl}
                        </a>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          value={meetingInputs[s.id] ?? ''}
                          onChange={(e) => setMeetingInputs((m) => ({ ...m, [s.id]: e.target.value }))}
                          placeholder="الصق رابط Google Meet هنا…"
                          style={{ flex: 1, fontSize: 13, padding: '7px 10px', borderRadius: 8, border: '1.5px solid #EAEDF3' }}
                        />
                        <button className="btn btn-primary btn-sm" onClick={() => saveMeetingUrl(s.id)}>
                          <Check size={13} /> حفظ الرابط
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Past */}
          {past.length > 0 && (
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#5A6473', marginBottom: 12 }}>الجلسات السابقة</div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>التاريخ والوقت</th><th>المدة</th><th>الحالة</th><th>رابط الاجتماع</th></tr></thead>
                  <tbody>
                    {past.map((s) => {
                      const d = new Date(s.scheduledAt);
                      const st = STATUS_MAP[s.status] ?? STATUS_MAP.done;
                      return (
                        <tr key={s.id}>
                          <td>{d.toLocaleString('ar-OM', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Muscat' })}</td>
                          <td>{s.durationMin} دق</td>
                          <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                          <td>{s.meetingUrl ? <a href={s.meetingUrl} target="_blank" style={{ color: '#2EC5B6', fontSize: 12 }}>فتح الرابط</a> : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'availability' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Price */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 8px rgba(16,24,40,0.05)' }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 14 }}>سعر الجلسة (ر.ع)</div>
            <div className="field" style={{ maxWidth: 280 }}>
              <label>السعر لكل جلسة</label>
              <input type="number" min="0" step="0.5" value={priceSAR} onChange={(e) => setPriceSAR(e.target.value)} placeholder="مثال: 15.000" />
            </div>
          </div>

          {/* Days grid */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 8px rgba(16,24,40,0.05)' }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>أيام وأوقات التوافر</div>
            <div style={{ fontSize: 13, color: '#5A6473', marginBottom: 20 }}>الأوقات بتوقيت مسقط (UTC+4). انقر يوماً لتفعيله، ثم اختر الأوقات المتاحة.</div>

            {[0, 1, 2, 3, 4, 5, 6].map((day) => {
              const slots = getSlots(day);
              const active = slots.length > 0;
              return (
                <div key={day} style={{ ...S.dayRow, borderColor: active ? 'rgba(46,197,182,0.3)' : '#EAEDF3', background: active ? 'rgba(46,197,182,0.03)' : '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 120 }}>
                    <div
                      onClick={() => toggleDay(day)}
                      style={{ ...S.dayToggle, background: active ? '#2EC5B6' : '#EAEDF3', cursor: 'pointer' }}
                    >
                      {active && <Check size={12} color="#fff" />}
                    </div>
                    <span style={{ fontWeight: active ? 700 : 500, fontSize: 14, color: active ? '#131826' : '#98A2B3' }}>{DAY_AR[day]}</span>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {ALL_SLOTS.map((slot) => {
                      const selected = slots.includes(slot);
                      return (
                        <button key={slot} onClick={() => toggleSlot(day, slot)} style={{
                          padding: '5px 12px', borderRadius: 8, border: `1.5px solid ${selected ? '#2EC5B6' : '#EAEDF3'}`,
                          background: selected ? 'rgba(46,197,182,0.12)' : '#fff',
                          color: selected ? '#1FA193' : '#98A2B3', fontWeight: selected ? 700 : 400,
                          fontSize: 12.5, cursor: 'pointer',
                        }}>{slot}</button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div>
            <button className="btn btn-primary" style={{ height: 48, fontSize: 15 }} onClick={saveAvailability} disabled={savingAvail}>
              {savingAvail ? 'جارٍ الحفظ…' : 'حفظ المواعيد والسعر'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  infoBox: {
    display: 'flex', gap: 14, background: '#EAF1FE', border: '1px solid #BFDBFE',
    borderRadius: 14, padding: '14px 18px',
  },
  empty: { textAlign: 'center', color: '#98A2B3', padding: '32px 0', fontSize: 14 },
  sessionCard: {
    display: 'flex', gap: 18, background: '#fff', borderRadius: 14,
    padding: '16px 20px', marginBottom: 12,
    boxShadow: '0 2px 8px rgba(16,24,40,0.05)', border: '1.5px solid #EAEDF3',
  },
  sessionLeft: { textAlign: 'center', minWidth: 64, paddingTop: 4 },
  sessionDateBig: { fontWeight: 700, fontSize: 14, color: '#131826' },
  sessionTimeBig: { fontWeight: 800, fontSize: 18, color: '#2EC5B6', marginTop: 2 },
  meetingLink: {
    display: 'flex', alignItems: 'center', gap: 6, color: '#2EC5B6',
    fontSize: 12.5, fontWeight: 600, wordBreak: 'break-all', textDecoration: 'none',
    background: 'rgba(46,197,182,0.08)', padding: '6px 12px', borderRadius: 8,
  },
  dayRow: {
    display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px',
    borderRadius: 12, border: '1.5px solid', marginBottom: 8, transition: 'all 0.2s',
  },
  dayToggle: {
    width: 22, height: 22, borderRadius: 6,
    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s',
  },
};
