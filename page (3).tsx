'use client';

import { useState } from 'react';
import { AdminStats, Participant } from '@/lib/types';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Participant | null>(null);

  const login = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin?password=${password}`);
      if (!res.ok) { setError('Yanlış şifre.'); setLoading(false); return; }
      setStats(await res.json());
      setAuthed(true);
    } catch { setError('Bağlantı hatası.'); }
    setLoading(false);
  };

  const refresh = async () => {
    setLoading(true);
    try { setStats(await (await fetch(`/api/admin?password=${password}`)).json()); } catch {}
    setLoading(false);
  };

  if (!authed) {
    return (
      <main className="min-h-screen bg-[#f5f0e8] flex items-center justify-center">
        <div className="bg-white/70 border border-black/10 rounded-2xl p-10 w-full max-w-sm space-y-5 text-center">
          <h1 className="font-display text-2xl font-bold">Admin Paneli</h1>
          <input
            type="password" value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()}
            placeholder="Şifre"
            className="w-full border border-black/15 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black/35"
          />
          {error && <p className="text-sm text-[#c84b2f]">{error}</p>}
          <button onClick={login} disabled={loading}
            className="w-full bg-[#0f0e0d] text-[#f5f0e8] py-3 rounded-xl font-medium hover:bg-[#c84b2f] transition-colors disabled:opacity-50">
            {loading ? 'Yükleniyor...' : 'Giriş'}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f0e8]">
      <header className="border-b border-black/10 px-6 py-4 flex items-center justify-between">
        <h1 className="font-display text-xl font-bold">OpinionSync — Admin</h1>
        <div className="flex gap-3">
          <button onClick={refresh} disabled={loading}
            className="text-sm border border-black/15 rounded-lg px-4 py-2 text-[#8a7f72] hover:text-[#0f0e0d] transition-colors disabled:opacity-50">
            {loading ? 'Yükleniyor...' : 'Yenile'}
          </button>
          <a href={`/api/admin/export?password=${password}`} target="_blank"
            className="text-sm bg-[#2d6a4f] text-white rounded-lg px-4 py-2 hover:opacity-80 transition-opacity">
            Excel İndir
          </a>
        </div>
      </header>

      {stats && (
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Katılımcı', v: stats.totalParticipants },
              { label: 'Toplam Tur', v: stats.totalRounds },
              { label: 'Toplam Oy', v: stats.totalVotes },
              { label: 'Ort. Tur/Katılımcı', v: stats.totalParticipants ? (stats.totalRounds / stats.totalParticipants).toFixed(1) : '0' },
            ].map(item => (
              <div key={item.label} className="bg-white/60 border border-black/8 rounded-2xl p-5">
                <div className="font-display text-3xl font-bold">{item.v}</div>
                <div className="text-sm text-[#8a7f72] mt-1">{item.label}</div>
              </div>
            ))}
          </div>

          {/* Vote distribution */}
          <div className="bg-white/60 border border-black/8 rounded-2xl p-6 space-y-4">
            <h2 className="font-display text-lg font-semibold">Oy Dağılımı</h2>
            <div className="grid grid-cols-3 gap-6">
              {[
                { label: '👍 Katıldım', v: stats.voteDistribution.approve, color: 'bg-[#2d6a4f]', tc: 'text-[#2d6a4f]' },
                { label: '👎 Katılmadım', v: stats.voteDistribution.disapprove, color: 'bg-[#c84b2f]', tc: 'text-[#c84b2f]' },
                { label: '❔ Fikrim yok', v: stats.voteDistribution.unsure, color: 'bg-[#b5820a]', tc: 'text-[#b5820a]' },
              ].map(item => {
                const pct = stats.totalVotes > 0 ? ((item.v / stats.totalVotes) * 100).toFixed(1) : '0';
                return (
                  <div key={item.label} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span>{item.label}</span>
                      <span className={`font-medium ${item.tc}`}>{pct}%</span>
                    </div>
                    <div className="h-2 bg-[#e8dfd0] rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="text-xs text-[#8a7f72]">{item.v} oy</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent rounds */}
          <div className="bg-white/60 border border-black/8 rounded-2xl p-6">
            <h2 className="font-display text-lg font-semibold mb-4">Son Turlar</h2>
            {stats.recentRounds.length === 0
              ? <p className="text-sm text-[#8a7f72]">Henüz tamamlanmış tur yok.</p>
              : (
                <div className="space-y-2 text-sm">
                  {stats.recentRounds.map((r, i) => (
                    <div key={i} className="flex items-center gap-3 py-2 border-b border-black/5 last:border-0">
                      <span className="text-xs text-[#8a7f72] w-32 shrink-0 tabular-nums">
                        {new Date(r.completedAt).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-xs font-mono text-[#8a7f72] shrink-0">{r.participantId.slice(0, 8)}…</span>
                      <span className="text-xs text-[#0f0e0d]/60 line-clamp-1">{r.scenarioText}</span>
                    </div>
                  ))}
                </div>
              )}
          </div>

          {/* Participants */}
          <div className="bg-white/60 border border-black/8 rounded-2xl p-6">
            <h2 className="font-display text-lg font-semibold mb-4">Katılımcılar ({stats.participants.length})</h2>
            {stats.participants.length === 0
              ? <p className="text-sm text-[#8a7f72]">Henüz katılımcı yok.</p>
              : (
                <div className="space-y-1">
                  {stats.participants.map(p => (
                    <div key={p.participantId}
                      onClick={() => setSelected(p)}
                      className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-[#e8dfd0]/50 cursor-pointer transition-colors">
                      <div className="flex items-center gap-3 text-sm">
                        <span className="font-mono text-xs text-[#8a7f72]">{p.participantId.slice(0, 12)}…</span>
                        <span className="text-xs text-[#8a7f72]">{new Date(p.createdAt).toLocaleDateString('tr-TR')}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-[#8a7f72]">{p.totalRounds} tur</span>
                        <span className="text-[#8a7f72]">{p.rounds.reduce((a, r) => a + r.responses.length, 0)} oy</span>
                        <span className="text-[#c84b2f]">Detay →</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        </div>
      )}

      {/* Participant detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-[#f5f0e8] border border-black/10 rounded-2xl max-w-xl w-full max-h-[80vh] overflow-y-auto p-6 space-y-5"
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-display text-xl font-bold">Katılımcı Detayı</h3>
                <p className="text-xs font-mono text-[#8a7f72] mt-0.5">{selected.participantId}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-[#8a7f72] hover:text-[#0f0e0d] text-xl leading-none">✕</button>
            </div>

            {selected.rounds.map(r => (
              <div key={r.roundNumber} className="border border-black/8 rounded-xl p-4 space-y-3 bg-white/50">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Tur {r.roundNumber}</span>
                  <span className="text-xs text-[#8a7f72]">{new Date(r.completedAt).toLocaleString('tr-TR')}</span>
                </div>
                <p className="text-xs text-[#8a7f72] line-clamp-2">{r.scenarioText}</p>
                <div className="flex gap-4 text-xs">
                  <span className="text-[#2d6a4f]">👍 {r.responses.filter(v => v.vote === 'approve').length}</span>
                  <span className="text-[#c84b2f]">👎 {r.responses.filter(v => v.vote === 'disapprove').length}</span>
                  <span className="text-[#b5820a]">❔ {r.responses.filter(v => v.vote === 'unsure').length}</span>
                  <span className="text-[#8a7f72]">💬 {r.responses.filter(v => v.comment).length} yorum</span>
                </div>
                {r.additionalOpinion && (
                  <div className="bg-[#e8dfd0]/60 rounded-lg p-3">
                    <p className="text-xs text-[#8a7f72] mb-1 font-medium uppercase tracking-wider">Eklenen Görüş</p>
                    <p className="text-xs italic">"{r.additionalOpinion}"</p>
                  </div>
                )}
                {r.integratedPrompt && (
                  <div className="bg-black/4 rounded-lg p-3">
                    <p className="text-xs font-medium text-[#8a7f72] mb-1.5 uppercase tracking-wider">Entegre Prompt</p>
                    <p className="text-xs text-[#0f0e0d]/70 leading-relaxed">{r.integratedPrompt}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
