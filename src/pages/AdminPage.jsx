import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import Flag from '../components/Flag'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import {
  collection, addDoc, getDocs, updateDoc, doc, deleteDoc,
  serverTimestamp, query, orderBy, writeBatch, getDoc,
} from 'firebase/firestore'
import { db } from '../firebase'
import { calcPoints, getTendency } from '../lib/scoring'
import { ALL_TEAMS as TEAMS } from '../lib/teams'

const PHASES = ['Gruppe', 'Round of 32', 'Achtelfinale', 'Viertelfinale', 'Halbfinale', 'Finale']

function TeamSelect({ label, value, onChange }) {
  const selected = TEAMS.find((t) => t.name === value)
  return (
    <div className="flex-1">
      <label className="text-xs text-white/40 mb-1 block">{label}</label>
      <select
        value={value}
        onChange={onChange}
        className="w-full appearance-none bg-white/10 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-brand-gold outline-none"
      >
        {TEAMS.map((t) => <option key={t.code} value={t.name}>{t.name}</option>)}
      </select>
      {selected && (
        <div className="flex items-center gap-1 mt-1 px-1">
          <Flag code={selected.code} size={14} />
          <span className="text-xs text-white/40">{selected.name}</span>
        </div>
      )}
    </div>
  )
}

export default function AdminPage() {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const [matches, setMatches] = useState([])
  const [activeTab, setActiveTab] = useState('create')
  const [msg, setMsg] = useState({ text: '', type: 'success' })
  const [evaluating, setEvaluating] = useState(false)
  const [editMatch, setEditMatch] = useState(null) // match object being edited
  const [deleteConfirm, setDeleteConfirm] = useState(null) // match id to confirm delete

  const [form, setForm] = useState({
    home: TEAMS[0].name, homeCode: TEAMS[0].code,
    away: TEAMS[1].name, awayCode: TEAMS[1].code,
    phase: 'Gruppe', kickoff: '',
    oddsHome: '2.00', oddsDraw: '3.20', oddsAway: '3.50',
    isMatchOfDay: false,
  })

  const [resultMatchId, setResultMatchId] = useState('')
  const [resultHome, setResultHome] = useState('')
  const [resultAway, setResultAway] = useState('')

  useEffect(() => {
    if (!isAdmin) { navigate('/'); return }
    loadMatches()
  }, [isAdmin])

  async function loadMatches() {
    const q = query(collection(db, 'matches'), orderBy('kickoff', 'asc'))
    const snap = await getDocs(q)
    setMatches(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  }

  function flash(text, type = 'success') {
    setMsg({ text, type })
    setTimeout(() => setMsg({ text: '', type: 'success' }), 3000)
  }

  function setTeam(side, name) {
    const t = TEAMS.find((x) => x.name === name)
    if (!t) return
    if (side === 'home') setForm((f) => ({ ...f, home: t.name, homeCode: t.code }))
    else setForm((f) => ({ ...f, away: t.name, awayCode: t.code }))
  }

  async function handleCreateMatch() {
    if (!form.kickoff) { flash('Bitte Anstoßzeit eintragen', 'error'); return }
    await addDoc(collection(db, 'matches'), {
      home: form.home, homeCode: form.homeCode,
      away: form.away, awayCode: form.awayCode,
      phase: form.phase,
      kickoff: new Date(form.kickoff),
      status: 'upcoming',
      isMatchOfDay: form.isMatchOfDay,
      odds: {
        home: parseFloat(form.oddsHome) || 2.0,
        draw: parseFloat(form.oddsDraw) || 3.2,
        away: parseFloat(form.oddsAway) || 3.5,
      },
      createdAt: serverTimestamp(),
    })
    flash('✅ Spiel erstellt!')
    loadMatches()
  }

  async function handleDeleteMatch(matchId) {
    await deleteDoc(doc(db, 'matches', matchId))
    setDeleteConfirm(null)
    flash('🗑️ Spiel gelöscht')
    loadMatches()
  }

  function openEdit(match) {
    const kickoff = match.kickoff?.toDate ? match.kickoff.toDate() : new Date(match.kickoff)
    const pad = (n) => String(n).padStart(2, '0')
    const localKickoff = `${kickoff.getFullYear()}-${pad(kickoff.getMonth() + 1)}-${pad(kickoff.getDate())}T${pad(kickoff.getHours())}:${pad(kickoff.getMinutes())}`
    setEditMatch({
      id: match.id,
      home: match.home, homeCode: match.homeCode,
      away: match.away, awayCode: match.awayCode,
      phase: match.phase,
      kickoff: localKickoff,
      oddsHome: String(match.odds?.home ?? '2.00'),
      oddsDraw: String(match.odds?.draw ?? '3.20'),
      oddsAway: String(match.odds?.away ?? '3.50'),
      isMatchOfDay: match.isMatchOfDay || false,
    })
    setActiveTab('manage')
  }

  async function handleUpdateMatch() {
    if (!editMatch?.id) return
    await updateDoc(doc(db, 'matches', editMatch.id), {
      home: editMatch.home, homeCode: editMatch.homeCode,
      away: editMatch.away, awayCode: editMatch.awayCode,
      phase: editMatch.phase,
      kickoff: new Date(editMatch.kickoff),
      isMatchOfDay: editMatch.isMatchOfDay,
      odds: {
        home: parseFloat(editMatch.oddsHome) || 2.0,
        draw: parseFloat(editMatch.oddsDraw) || 3.2,
        away: parseFloat(editMatch.oddsAway) || 3.5,
      },
    })
    flash('✅ Spiel aktualisiert!')
    setEditMatch(null)
    loadMatches()
  }

  async function toggleMatchOfDay(matchId, current) {
    await updateDoc(doc(db, 'matches', matchId), { isMatchOfDay: !current })
    flash(current ? 'Match of Day entfernt' : '⭐ Match of the Day gesetzt!')
    loadMatches()
  }

  async function setMatchLive(matchId) {
    await updateDoc(doc(db, 'matches', matchId), { status: 'live' })
    flash('🔴 Spiel ist jetzt LIVE')
    loadMatches()
  }

  async function handleSetResult() {
    if (!resultMatchId || resultHome === '' || resultAway === '') return
    setEvaluating(true)
    try {
      const h = parseInt(resultHome), a = parseInt(resultAway)
      const matchRef = doc(db, 'matches', resultMatchId)
      await updateDoc(matchRef, { result: { home: h, away: a }, status: 'finished' })

      const matchSnap = await getDoc(matchRef)
      const matchData = matchSnap.data()
      const result = { home: h, away: a }
      const resultTendency = getTendency(h, a)
      const odds = matchData.odds?.[resultTendency] || 1.0
      const isMatchOfDay = matchData.isMatchOfDay || false

      const tipsSnap = await getDocs(collection(db, 'matches', resultMatchId, 'tips'))
      const usersSnap = await getDocs(collection(db, 'users'))
      const allUsers = Object.fromEntries(usersSnap.docs.map((d) => [d.id, d.data()]))

      const batch = writeBatch(db)

      // Build correctness map for H2H
      const tipResults = {}
      for (const tipDoc of tipsSnap.docs) {
        const tip = tipDoc.data()
        const tipTendency = getTendency(tip.home, tip.away)
        tipResults[tip.uid] = tipTendency === resultTendency
      }

      for (const tipDoc of tipsSnap.docs) {
        const tip = tipDoc.data()
        const ud = allUsers[tip.uid]
        if (!ud) continue

        const isCorrect = tipResults[tip.uid]
        const hasMomentum = (ud.currentStreak || 0) >= 3

        const points = calcPoints(tip, result, odds, { isMatchOfDay, hasMomentum })
        const newTotal = Math.max(0, (ud.totalPoints || 0) + points)

        // Streak tracking
        const prevStreak = ud.currentStreak || 0
        const newStreak = isCorrect ? Math.max(1, prevStreak + 1) : Math.min(-1, prevStreak - 1)
        const newBestStreak = Math.max(ud.bestStreak || 0, newStreak)

        const update = {
          totalPoints: newTotal,
          currentStreak: newStreak,
          bestStreak: newBestStreak,
          hasMomentum: newStreak >= 3,
          'stats.correctTips': (ud.stats?.correctTips || 0) + (isCorrect ? 1 : 0),
          'stats.wrongTips': (ud.stats?.wrongTips || 0) + (isCorrect ? 0 : 1),
        }

        if (isCorrect && odds > (ud.stats?.highestOddsWon || 0)) {
          update['stats.highestOddsWon'] = odds
        }
        if (tip.joker) update.jokersLeft = Math.max(0, (ud.jokersLeft || 0) - 1)
        if (tip.insurance && !isCorrect) update.insuranceLeft = Math.max(0, (ud.insuranceLeft || 0) - 1)
        if (tip.allIn) update.allInLeft = Math.max(0, (ud.allInLeft || 0) - 1)

        // H2H updates
        const h2h = { ...(ud.h2h || {}) }
        Object.entries(tipResults).forEach(([otherUid, otherCorrect]) => {
          if (otherUid === tip.uid) return
          if (!h2h[otherUid]) h2h[otherUid] = { wins: 0, losses: 0 }
          if (isCorrect && !otherCorrect) h2h[otherUid].wins = (h2h[otherUid].wins || 0) + 1
          if (!isCorrect && otherCorrect) h2h[otherUid].losses = (h2h[otherUid].losses || 0) + 1
        })
        update.h2h = h2h

        batch.update(doc(db, 'users', tip.uid), update)
      }

      await batch.commit()
      await updateRanks()
      flash(`✅ ${h}:${a} — Punkte vergeben, Streaks + H2H aktualisiert!`)
      loadMatches()
    } finally {
      setEvaluating(false)
      setResultMatchId('')
      setResultHome('')
      setResultAway('')
    }
  }

  async function updateRanks() {
    const snap = await getDocs(collection(db, 'users'))
    const sorted = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => b.totalPoints - a.totalPoints)
    const batch = writeBatch(db)
    sorted.forEach((u, i) => {
      const isLast = i === sorted.length - 1
      const badges = [...(u.badges || []).filter((b) => b !== 'keller_laterne')]
      if (isLast && sorted.length > 1) badges.push('keller_laterne')
      batch.update(doc(db, 'users', u.id), {
        lastRank: u.currentRank || i + 1,
        currentRank: i + 1,
        badges,
      })
    })
    await batch.commit()
  }

  const upcomingMatches = matches.filter((m) => m.status === 'upcoming')
  const selectedResult = matches.find((m) => m.id === resultMatchId)

  return (
    <Layout title="⚙️ God-Modus">
      <div className="max-w-md mx-auto space-y-4">

        {msg.text && (
          <div className={`rounded-2xl px-4 py-3 text-center text-sm font-bold ${
            msg.type === 'error'
              ? 'bg-brand-red/20 border border-brand-red/40 text-brand-red'
              : 'bg-brand-green/20 border border-brand-green/40 text-brand-green'
          }`}>{msg.text}</div>
        )}

        {/* Tabs */}
        <div className="grid grid-cols-4 gap-1 bg-white/5 rounded-2xl p-1.5">
          {[
            { key: 'create', label: '➕ Neu' },
            { key: 'manage', label: '✏️ Spiele' },
            { key: 'live', label: '🔴 Live' },
            { key: 'result', label: '📝 Erg.' },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => { setActiveTab(key); setEditMatch(null) }}
              className={`py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === key ? 'bg-brand-red text-white shadow' : 'text-white/40'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* ── TAB: Spiel anlegen ── */}
        {activeTab === 'create' && (
          <div className="space-y-3">
            {/* VS Preview */}
            <div className="card flex items-center justify-center gap-4 py-5">
              <div className="flex flex-col items-center gap-1">
                <Flag code={TEAMS.find((t) => t.name === form.home)?.code} size={40} />
                <span className="text-xs font-bold text-center max-w-[70px] leading-tight">{form.home}</span>
              </div>
              <span className="text-white/30 font-display text-2xl">VS</span>
              <div className="flex flex-col items-center gap-1">
                <Flag code={TEAMS.find((t) => t.name === form.away)?.code} size={40} />
                <span className="text-xs font-bold text-center max-w-[70px] leading-tight">{form.away}</span>
              </div>
            </div>

            <div className="card space-y-3">
              <div className="flex gap-3">
                <TeamSelect label="Heimteam" value={form.home} onChange={(e) => setTeam('home', e.target.value)} />
                <TeamSelect label="Auswärtsteam" value={form.away} onChange={(e) => setTeam('away', e.target.value)} />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-white/40 mb-1 block">Phase</label>
                  <select value={form.phase} onChange={(e) => setForm({ ...form, phase: e.target.value })}
                    className="w-full appearance-none bg-white/10 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none">
                    {PHASES.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-xs text-white/40 mb-1 block">Anstoß</label>
                  <input type="datetime-local" value={form.kickoff}
                    onChange={(e) => setForm({ ...form, kickoff: e.target.value })}
                    className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none" />
                </div>
              </div>

              {/* Match of Day toggle */}
              <button
                onClick={() => setForm((f) => ({ ...f, isMatchOfDay: !f.isMatchOfDay }))}
                className={`w-full py-2.5 rounded-xl text-sm font-bold border transition-colors ${
                  form.isMatchOfDay ? 'bg-brand-gold/20 border-brand-gold text-brand-gold' : 'border-white/10 text-white/40'
                }`}>
                ⭐ Match of the Day {form.isMatchOfDay ? '(aktiv — 2x Punkte)' : '(inaktiv)'}
              </button>
            </div>

            {/* Odds */}
            <div className="card">
              <label className="text-xs text-white/40 mb-3 block">Quoten</label>
              <div className={`grid gap-2 ${form.phase === 'Gruppe' ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {[
                  { key: 'oddsHome', label: '1 Heim' },
                  ...(form.phase === 'Gruppe' ? [{ key: 'oddsDraw', label: 'X Unent.' }] : []),
                  { key: 'oddsAway', label: '2 Auswärts' },
                ].map(({ key, label }) => (
                  <div key={key} className="text-center">
                    <p className="text-xs text-white/40 mb-1">{label}</p>
                    <input type="number" step="0.01" min="1" value={form[key]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      className="w-full bg-white/10 border border-white/10 rounded-xl px-2 py-2 text-center text-sm font-bold text-brand-gold outline-none" />
                  </div>
                ))}
              </div>
            </div>

            <button onClick={handleCreateMatch} className="w-full btn-primary">Spiel erstellen</button>
          </div>
        )}

        {/* ── TAB: Verwalten ── */}
        {activeTab === 'manage' && !editMatch && (
          <div className="space-y-2">
            {matches.length === 0 && (
              <p className="text-center text-white/30 py-10 text-sm">Keine Spiele vorhanden</p>
            )}
            {matches.map((m) => {
              const kickoff = m.kickoff?.toDate ? m.kickoff.toDate() : new Date(m.kickoff)
              return (
                <div key={m.id} className="card space-y-2">
                  <div className="flex items-center gap-2">
                    <Flag code={m.homeCode} size={18} />
                    <span className="text-sm font-bold flex-1 truncate">{m.home} vs {m.away}</span>
                    <Flag code={m.awayCode} size={18} />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <span>{m.phase}</span>
                    <span>·</span>
                    <span>{kickoff.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                    {m.isMatchOfDay && <span className="text-brand-gold">⭐</span>}
                    <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-bold ${
                      m.status === 'live' ? 'bg-brand-red/20 text-brand-red' :
                      m.status === 'finished' ? 'bg-white/10 text-white/40' :
                      'bg-brand-green/20 text-brand-green'
                    }`}>
                      {m.status === 'live' ? 'LIVE' : m.status === 'finished' ? 'Beendet' : 'Geplant'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEdit(m)}
                      className="flex-1 bg-white/10 text-white text-xs font-bold py-2 rounded-xl active:scale-95 transition-transform"
                    >
                      ✏️ Bearbeiten
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(m.id)}
                      className="flex-1 bg-brand-red/20 text-brand-red text-xs font-bold py-2 rounded-xl active:scale-95 transition-transform"
                    >
                      🗑️ Löschen
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Edit Form ── */}
        {activeTab === 'manage' && editMatch && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 mb-1">
              <button onClick={() => setEditMatch(null)} className="text-white/40 text-sm">← Zurück</button>
              <span className="text-sm font-bold text-white/70">Spiel bearbeiten</span>
            </div>

            <div className="card flex items-center justify-center gap-4 py-4">
              <div className="flex flex-col items-center gap-1">
                <Flag code={TEAMS.find((t) => t.name === editMatch.home)?.code || editMatch.homeCode} size={36} />
                <span className="text-xs font-bold">{editMatch.home}</span>
              </div>
              <span className="text-white/30 font-display text-xl">VS</span>
              <div className="flex flex-col items-center gap-1">
                <Flag code={TEAMS.find((t) => t.name === editMatch.away)?.code || editMatch.awayCode} size={36} />
                <span className="text-xs font-bold">{editMatch.away}</span>
              </div>
            </div>

            <div className="card space-y-3">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-white/40 mb-1 block">Heimteam</label>
                  <select value={editMatch.home}
                    onChange={(e) => {
                      const t = TEAMS.find((x) => x.name === e.target.value)
                      if (t) setEditMatch((f) => ({ ...f, home: t.name, homeCode: t.code }))
                    }}
                    className="w-full appearance-none bg-white/10 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none">
                    {TEAMS.map((t) => <option key={t.code} value={t.name}>{t.name}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-xs text-white/40 mb-1 block">Auswärtsteam</label>
                  <select value={editMatch.away}
                    onChange={(e) => {
                      const t = TEAMS.find((x) => x.name === e.target.value)
                      if (t) setEditMatch((f) => ({ ...f, away: t.name, awayCode: t.code }))
                    }}
                    className="w-full appearance-none bg-white/10 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none">
                    {TEAMS.map((t) => <option key={t.code} value={t.name}>{t.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-white/40 mb-1 block">Phase</label>
                  <select value={editMatch.phase}
                    onChange={(e) => setEditMatch((f) => ({ ...f, phase: e.target.value }))}
                    className="w-full appearance-none bg-white/10 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none">
                    {PHASES.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-xs text-white/40 mb-1 block">Anstoß</label>
                  <input type="datetime-local" value={editMatch.kickoff}
                    onChange={(e) => setEditMatch((f) => ({ ...f, kickoff: e.target.value }))}
                    className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none" />
                </div>
              </div>

              <button
                onClick={() => setEditMatch((f) => ({ ...f, isMatchOfDay: !f.isMatchOfDay }))}
                className={`w-full py-2.5 rounded-xl text-sm font-bold border transition-colors ${
                  editMatch.isMatchOfDay ? 'bg-brand-gold/20 border-brand-gold text-brand-gold' : 'border-white/10 text-white/40'
                }`}>
                ⭐ Match of the Day {editMatch.isMatchOfDay ? '(aktiv)' : '(inaktiv)'}
              </button>
            </div>

            <div className="card">
              <label className="text-xs text-white/40 mb-3 block">Quoten</label>
              <div className={`grid gap-2 ${editMatch.phase === 'Gruppe' ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {[
                  { key: 'oddsHome', label: '1 Heim' },
                  ...(editMatch.phase === 'Gruppe' ? [{ key: 'oddsDraw', label: 'X Unent.' }] : []),
                  { key: 'oddsAway', label: '2 Auswärts' },
                ].map(({ key, label }) => (
                  <div key={key} className="text-center">
                    <p className="text-xs text-white/40 mb-1">{label}</p>
                    <input type="number" step="0.01" min="1" value={editMatch[key]}
                      onChange={(e) => setEditMatch((f) => ({ ...f, [key]: e.target.value }))}
                      className="w-full bg-white/10 border border-white/10 rounded-xl px-2 py-2 text-center text-sm font-bold text-brand-gold outline-none" />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setEditMatch(null)} className="flex-1 btn-ghost">Abbrechen</button>
              <button onClick={handleUpdateMatch} className="flex-1 btn-primary">Speichern</button>
            </div>
          </div>
        )}

        {/* ── TAB: Live ── */}
        {activeTab === 'live' && (
          <div className="space-y-2">
            {upcomingMatches.length === 0 && (
              <p className="text-center text-white/30 py-10 text-sm">Keine Spiele bereit</p>
            )}
            {upcomingMatches.map((m) => (
              <div key={m.id} className="card space-y-2">
                <div className="flex items-center gap-2">
                  <Flag code={m.homeCode} size={18} />
                  <span className="text-sm font-bold flex-1">{m.home} vs {m.away}</span>
                  <Flag code={m.awayCode} size={18} />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setMatchLive(m.id)}
                    className="flex-1 bg-brand-red text-white text-xs font-bold py-2 rounded-xl active:scale-95 transition-transform">
                    🔴 LIVE setzen
                  </button>
                  <button onClick={() => toggleMatchOfDay(m.id, m.isMatchOfDay)}
                    className={`flex-1 text-xs font-bold py-2 rounded-xl border transition-colors ${
                      m.isMatchOfDay ? 'bg-brand-gold/20 border-brand-gold text-brand-gold' : 'border-white/10 text-white/40'
                    }`}>
                    {m.isMatchOfDay ? '⭐ MotD aktiv' : '⭐ MotD setzen'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── TAB: Ergebnis ── */}
        {activeTab === 'result' && (
          <div className="space-y-3">
            <div className="card">
              <label className="text-xs text-white/40 mb-2 block">Spiel auswählen</label>
              <select value={resultMatchId} onChange={(e) => setResultMatchId(e.target.value)}
                className="w-full appearance-none bg-white/10 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none">
                <option value="">— Spiel wählen —</option>
                {matches.filter((m) => m.status !== 'finished').map((m) => (
                  <option key={m.id} value={m.id}>{m.home} vs {m.away} · {m.phase}</option>
                ))}
              </select>
            </div>

            {selectedResult && (
              <div className="card space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flag code={selectedResult.homeCode} size={22} />
                    <span className="font-bold text-sm">{selectedResult.home}</span>
                  </div>
                  {selectedResult.isMatchOfDay && <span className="text-xs text-brand-gold font-bold">⭐ MotD</span>}
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">{selectedResult.away}</span>
                    <Flag code={selectedResult.awayCode} size={22} />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input type="number" min="0" max="20" placeholder="0" value={resultHome}
                    onChange={(e) => setResultHome(e.target.value)}
                    className="flex-1 bg-white/10 border border-white/10 rounded-2xl py-4 text-center text-3xl font-display text-brand-gold outline-none focus:border-brand-gold" />
                  <span className="text-white/30 text-2xl font-bold">:</span>
                  <input type="number" min="0" max="20" placeholder="0" value={resultAway}
                    onChange={(e) => setResultAway(e.target.value)}
                    className="flex-1 bg-white/10 border border-white/10 rounded-2xl py-4 text-center text-3xl font-display text-brand-gold outline-none focus:border-brand-gold" />
                </div>

                <button onClick={handleSetResult}
                  disabled={evaluating || resultHome === '' || resultAway === ''}
                  className="w-full btn-primary disabled:opacity-40">
                  {evaluating ? '⏳ Punkte werden vergeben…' : '✅ Bestätigen & Punkte vergeben'}
                </button>
                <p className="text-xs text-white/20 text-center">
                  Berechnet Punkte, Streaks, H2H und aktualisiert Ränge + Keller-Laterne automatisch.
                </p>
              </div>
            )}

            {!selectedResult && (
              <p className="text-center text-white/20 text-sm py-6">Wähle ein Spiel aus</p>
            )}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-6" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-brand-card w-full max-w-sm rounded-3xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <p className="text-center text-2xl">🗑️</p>
            <p className="text-center font-bold">Spiel wirklich löschen?</p>
            <p className="text-center text-xs text-white/40">
              {matches.find((m) => m.id === deleteConfirm)?.home} vs {matches.find((m) => m.id === deleteConfirm)?.away}
            </p>
            <p className="text-center text-xs text-brand-red">Alle abgegebenen Tipps für dieses Spiel bleiben erhalten, aber Punkte werden nicht rückgängig gemacht.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 btn-ghost">Abbrechen</button>
              <button onClick={() => handleDeleteMatch(deleteConfirm)} className="flex-1 btn-danger">Löschen</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
