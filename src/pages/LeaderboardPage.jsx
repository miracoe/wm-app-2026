import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import LeaderboardRow from '../components/LeaderboardRow'
import { getLeaderboard } from '../lib/firestore'
import { useAuth } from '../context/AuthContext'

export default function LeaderboardPage() {
  const { user } = useAuth()
  const [players, setPlayers] = useState([])

  useEffect(() => {
    const unsub = getLeaderboard(setPlayers)
    return unsub
  }, [])

  const last = players.length > 1 ? players[players.length - 1] : null
  const leader = players.length > 0 ? players[0] : null

  // Schande des Tages: letzter Platz, nur zeigen wenn >= 2 Spieler
  const showSchande = last && players.length >= 2

  return (
    <Layout title="🏆 Ranking">
      <div className="max-w-lg mx-auto">

        {/* Leader spotlight */}
        {leader && (
          <div className="card mb-4 bg-gradient-to-r from-brand-gold/10 to-transparent border-brand-gold/20 flex items-center gap-3">
            <span className="text-3xl">👑</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-brand-gold/60 uppercase tracking-wider mb-0.5">Tabellenführer</p>
              <p className="font-bold truncate">{leader.displayName}</p>
            </div>
            <p className="font-display text-2xl text-brand-gold shrink-0">{(leader.totalPoints || 0).toFixed(0)} Pkt</p>
          </div>
        )}

        {/* Schande des Tages */}
        {showSchande && (
          <div className="card mb-4 bg-gradient-to-r from-brand-red/10 to-transparent border-brand-red/20 flex items-center gap-3">
            <span className="text-3xl">🏮</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-brand-red/60 uppercase tracking-wider mb-0.5">Schande des Tages</p>
              <p className="font-bold truncate">{last.displayName}</p>
              <p className="text-xs text-white/30">Platz {players.length} · {(last.totalPoints || 0).toFixed(0)} Punkte</p>
            </div>
            <span className="text-3xl shrink-0">😢</span>
          </div>
        )}

        {/* Leaderboard */}
        {players.length === 0
          ? <p className="text-center text-white/30 mt-20">Noch keine Spieler…</p>
          : players.map((p, i) => (
            <LeaderboardRow key={p.uid} user={p} rank={i + 1} isMe={p.uid === user?.uid} />
          ))
        }
      </div>
    </Layout>
  )
}
