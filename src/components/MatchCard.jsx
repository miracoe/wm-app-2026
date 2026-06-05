import { useState, useEffect } from 'react'
import Flag from './Flag'
import CountdownTimer from './CountdownTimer'
import {
  getUserTipsForMatch, setTip, getAllTipsForMatch,
  getReactions, addReaction,
} from '../lib/firestore'
import { useAuth } from '../context/AuthContext'
import { updateDoc, doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'

const REACTION_EMOJIS = ['🔥', '💀', '😂', '💩', '😭', '🤡', '👻', '🤌']

function isTippable(match) {
  if (match.status !== 'upcoming') return false
  const kickoff = match.kickoff?.toDate ? match.kickoff.toDate() : new Date(match.kickoff)
  return new Date() < kickoff
}

function TippReveal({ matchId, currentUid }) {
  const [tips, setTips] = useState([])
  const [users, setUsers] = useState({})

  useEffect(() => {
    getAllUsers().then((snap) => {
      const map = {}
      snap.docs.forEach((d) => { map[d.id] = d.data() })
      setUsers(map)
    })
    const unsub = getAllTipsForMatch(matchId, setTips)
    return unsub
  }, [matchId])

  if (tips.length === 0) return <p className="text-xs text-white/30 text-center py-2">Noch keine Tipps</p>

  return (
    <div className="space-y-1.5">
      {tips.map((t) => {
        const u = users[t.uid]
        const isMe = t.uid === currentUid
        return (
          <div key={t.uid} className={`flex items-center gap-2 rounded-xl px-3 py-2 ${isMe ? 'bg-brand-blue/20 border border-brand-blue/30' : 'bg-white/5'}`}>
            {u?.photoURL
              ? <img src={u.photoURL} className="w-6 h-6 rounded-full" alt="" />
              : <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs">{u?.displayName?.[0] || '?'}</div>
            }
            <span className="text-xs font-bold flex-1 truncate">{u?.displayName || '???'}{isMe && ' (Du)'}</span>
            {t.joker && <span title="Joker">🃏</span>}
            {t.insurance && <span title="Versicherung">🛡️</span>}
            {t.allIn && <span title="All-In">💥</span>}
            <span className="text-sm font-display text-brand-gold">{t.home}:{t.away}</span>
          </div>
        )
      })}
    </div>
  )
}

function ReactionBar({ matchId }) {
  const { user, userData } = useAuth()
  const [reactions, setReactions] = useState([])
  const [text, setText] = useState('')
  const [selectedEmoji, setSelectedEmoji] = useState('🔥')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const unsub = getReactions(matchId, setReactions)
    return unsub
  }, [matchId])

  async function handleSend() {
    if (!text.trim() && !selectedEmoji) return
    await addReaction(matchId, {
      uid: user.uid,
      displayName: userData?.displayName || user.displayName,
      photoURL: userData?.photoURL || user.photoURL,
      emoji: selectedEmoji,
      text: text.trim(),
    })
    setText('')
    setOpen(false)
  }

  return (
    <div className="mt-3 border-t border-white/5 pt-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-white/30 uppercase tracking-wider">Reaktionen</span>
        <button onClick={() => setOpen(!open)} className="text-xs text-brand-gold font-bold">
          {open ? 'Abbrechen' : '+ Reaktion'}
        </button>
      </div>

      {open && (
        <div className="mb-3 space-y-2">
          <div className="flex gap-1.5 flex-wrap">
            {REACTION_EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => setSelectedEmoji(e)}
                className={`text-xl p-1.5 rounded-lg transition-all ${selectedEmoji === e ? 'bg-brand-gold/30 scale-125' : 'bg-white/5'}`}
              >
                {e}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Trash-Talk eingeben…"
              maxLength={80}
              className="flex-1 bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-brand-gold"
            />
            <button onClick={handleSend} className="bg-brand-gold text-black font-bold px-4 rounded-xl text-sm active:scale-95">
              OK
            </button>
          </div>
        </div>
      )}

      <div className="space-y-1.5 max-h-32 overflow-y-auto">
        {reactions.map((r) => (
          <div key={r.id} className="flex items-start gap-2">
            <span className="text-lg shrink-0">{r.emoji}</span>
            <div>
              <span className="text-xs text-white/40 font-bold">{r.displayName} </span>
              <span className="text-xs text-white/70">{r.text}</span>
            </div>
          </div>
        ))}
        {reactions.length === 0 && <p className="text-xs text-white/20">Noch keine Reaktionen — seid ihr alle stumm?</p>}
      </div>
    </div>
  )
}

function SpionageConfirm({ onConfirm, onClose, spending }) {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-6" onClick={onClose}>
      <div className="bg-brand-card w-full max-w-sm rounded-3xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="text-center space-y-1">
          <p className="text-3xl">🕵️</p>
          <p className="font-bold text-lg">Spionage einsetzen?</p>
          <p className="text-sm text-white/50">
            Du siehst alle Tipps für dieses Spiel — dauerhaft, auch wenn Mitspieler ihren Tipp noch ändern.
          </p>
          <p className="text-brand-red font-bold text-sm">Kostet 5 Punkte · 1 Spionage-Token</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 btn-ghost">Abbrechen</button>
          <button onClick={onConfirm} disabled={spending} className="flex-1 btn-primary disabled:opacity-40">
            {spending ? '…' : 'Einsetzen'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MatchCard({ match }) {
  const { user, userData } = useAuth()
  const [tip, setTipState] = useState(null)
  const [home, setHome] = useState('')
  const [away, setAway] = useState('')
  const [useJoker, setUseJoker] = useState(false)
  const [useInsurance, setUseInsurance] = useState(false)
  const [useAllIn, setUseAllIn] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showReveal, setShowReveal] = useState(false)
  const [showSpionageConfirm, setShowSpionageConfirm] = useState(false)
  const [spionageSpending, setSpionageSpending] = useState(false)

  const hasSpied = userData?.spiedMatches?.includes(match.id) ?? false

  const canTip = isTippable(match)
  const isAfterKickoff = !canTip && match.status === 'upcoming'

  useEffect(() => {
    if (!user) return
    const unsub = getUserTipsForMatch(match.id, user.uid, (t) => {
      setTipState(t)
      if (t) {
        setHome(String(t.home))
        setAway(String(t.away))
        setUseJoker(t.joker || false)
        setUseInsurance(t.insurance || false)
        setUseAllIn(t.allIn || false)
      }
    })
    return unsub
  }, [match.id, user])

  async function handleSave() {
    if (!user || !canTip) return
    const h = parseInt(home), a = parseInt(away)
    if (isNaN(h) || isNaN(a)) return
    setSaving(true)
    try {
      await setTip(match.id, user.uid, { home: h, away: a, joker: useJoker, insurance: useInsurance, allIn: useAllIn })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally { setSaving(false) }
  }

  async function handleSpionageConfirm() {
    if (!user || !userData) return
    setSpionageSpending(true)
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        totalPoints: Math.max(0, (userData.totalPoints || 0) - 5),
        spionageLeft: Math.max(0, (userData.spionageLeft || 0) - 1),
        spiedMatches: [...(userData.spiedMatches || []), match.id],
      })
      setShowSpionageConfirm(false)
      // userData wird durch onSnapshot reaktiv aktualisiert → hasSpied wird true
    } finally {
      setSpionageSpending(false)
    }
  }

  const statusBadge = match.status === 'live'
    ? <span className="text-xs bg-brand-red text-white px-2 py-0.5 rounded-full animate-pulse font-bold">LIVE</span>
    : match.status === 'finished'
    ? <span className="text-xs bg-white/10 text-white/50 px-2 py-0.5 rounded-full">Beendet</span>
    : null

  return (
    <div className={`card mb-3 ${match.isMatchOfDay ? 'border-brand-gold/50 bg-brand-gold/5' : ''}`}>
      {/* Match of Day badge */}
      {match.isMatchOfDay && (
        <div className="flex items-center gap-1.5 mb-2 text-brand-gold">
          <span className="text-sm">⭐</span>
          <span className="text-xs font-bold uppercase tracking-wider">Match of the Day — 2x Punkte</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-white/40">{match.phase}</span>
        <div className="flex items-center gap-2">
          {canTip && <CountdownTimer kickoff={match.kickoff} />}
          {statusBadge}
        </div>
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col items-center gap-1 flex-1">
          <Flag code={match.homeCode} size={36} />
          <span className="text-xs font-bold text-center leading-tight">{match.home}</span>
        </div>

        <div className="flex items-center gap-2">
          {match.status === 'finished' ? (
            <div className="flex items-center gap-2">
              <span className="text-3xl font-display text-brand-gold">{match.result?.home}</span>
              <span className="text-white/40">:</span>
              <span className="text-3xl font-display text-brand-gold">{match.result?.away}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input type="number" min="0" max="20" value={home} onChange={(e) => setHome(e.target.value)}
                disabled={!canTip}
                className="w-12 h-12 bg-white/10 text-center text-xl font-bold rounded-xl border border-white/20 focus:border-brand-gold outline-none disabled:opacity-40" />
              <span className="text-white/40 text-xl">:</span>
              <input type="number" min="0" max="20" value={away} onChange={(e) => setAway(e.target.value)}
                disabled={!canTip}
                className="w-12 h-12 bg-white/10 text-center text-xl font-bold rounded-xl border border-white/20 focus:border-brand-gold outline-none disabled:opacity-40" />
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-1 flex-1">
          <Flag code={match.awayCode} size={36} />
          <span className="text-xs font-bold text-center leading-tight">{match.away}</span>
        </div>
      </div>

      {/* Odds */}
      {match.odds && (
        <div className="flex justify-between mt-3 text-xs text-white/50">
          <span>1: <b className="text-white">{match.odds.home}</b></span>
          {match.phase === 'Gruppe' && <span>X: <b className="text-white">{match.odds.draw}</b></span>}
          <span>2: <b className="text-white">{match.odds.away}</b></span>
        </div>
      )}

      {/* Power-up toggles */}
      {canTip && (
        <div className="grid grid-cols-3 gap-2 mt-3">
          {[
            { key: 'joker', state: useJoker, set: setUseJoker, left: userData?.jokersLeft, icon: '🃏', label: 'Joker', color: 'brand-gold' },
            { key: 'insurance', state: useInsurance, set: setUseInsurance, left: userData?.insuranceLeft, icon: '🛡️', label: 'Versich.', color: 'brand-blue' },
            { key: 'allIn', state: useAllIn, set: setUseAllIn, left: userData?.allInLeft, icon: '💥', label: 'All-In', color: 'brand-red' },
          ].map(({ key, state, set, left, icon, label, color }) => (
            <button
              key={key}
              onClick={() => set(!state)}
              disabled={!left && !state}
              className={`py-2 rounded-xl text-xs font-bold border transition-colors disabled:opacity-30 ${
                state ? `bg-${color} text-${color === 'brand-gold' ? 'black' : 'white'} border-${color}` : 'border-white/20 text-white/50'
              }`}
            >
              {icon} {label}<br />
              <span className="text-xs opacity-60">({left ?? 0} übrig)</span>
            </button>
          ))}
        </div>
      )}

      {/* Spionage button */}
      {canTip && !hasSpied && (userData?.spionageLeft ?? 0) > 0 && (
        <button
          onClick={() => setShowSpionageConfirm(true)}
          className="w-full mt-2 py-2 rounded-xl text-xs font-bold border border-white/10 text-white/40 active:bg-white/5"
        >
          🕵️ Spionage einsetzen ({userData?.spionageLeft} übrig)
        </button>
      )}
      {canTip && hasSpied && (
        <div className="mt-2 py-2 rounded-xl text-xs font-bold text-center border border-brand-gold/20 text-brand-gold/60">
          🕵️ Spionage aktiv — alle Tipps sichtbar
        </div>
      )}

      {/* Tip result */}
      {tip && match.status === 'finished' && (
        <div className="mt-3 p-2 rounded-xl bg-white/5 text-center text-sm">
          Dein Tipp: <b>{tip.home}:{tip.away}</b>
          {tip.joker && ' 🃏'}{tip.insurance && ' 🛡️'}{tip.allIn && ' 💥'}
        </div>
      )}

      {/* Save button */}
      {canTip && (
        <button onClick={handleSave} disabled={saving || !home || !away} className="w-full mt-3 btn-primary disabled:opacity-40">
          {saved ? '✅ Gespeichert!' : saving ? '…' : tip ? 'Tipp ändern' : 'Tipp abgeben'}
        </button>
      )}

      {/* Tipp-Enthüllung: auto wenn Spionage aktiv, sonst toggle nach Anstoß */}
      {hasSpied && canTip && (
        <div className="mt-2">
          <TippReveal matchId={match.id} currentUid={user?.uid} />
        </div>
      )}

      {(match.status === 'live' || match.status === 'finished' || isAfterKickoff) && (
        <button
          onClick={() => setShowReveal(!showReveal)}
          className="w-full mt-2 py-2 rounded-xl text-xs font-bold border border-white/10 text-white/40"
        >
          {showReveal ? '▲ Tipps ausblenden' : '👁 Alle Tipps anzeigen'}
        </button>
      )}

      {showReveal && (
        <div className="mt-2">
          <TippReveal matchId={match.id} currentUid={user?.uid} />
        </div>
      )}

      {/* Reactions */}
      {match.status === 'finished' && <ReactionBar matchId={match.id} />}

      {/* Spionage confirm modal */}
      {showSpionageConfirm && (
        <SpionageConfirm
          onConfirm={handleSpionageConfirm}
          onClose={() => setShowSpionageConfirm(false)}
          spending={spionageSpending}
        />
      )}
    </div>
  )
}
