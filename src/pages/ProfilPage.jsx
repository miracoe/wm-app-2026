import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { getAllUsers } from '../lib/firestore'

const BADGE_INFO = {
  wahrsager: { icon: '🔮', label: 'Wahrsager', desc: 'Exaktes Ergebnis getippt' },
  expert_of_doom: { icon: '💀', label: 'Expert of Doom', desc: '3 falsche Tipps in Folge' },
  risiko_koenig: { icon: '👑', label: 'Risiko-König', desc: 'Höchste Quote gewonnen' },
  keller_laterne: { icon: '🏮', label: 'Keller-Laterne', desc: 'Letzter Platz im Ranking' },
}

function StatBox({ value, label, color = 'text-white' }) {
  return (
    <div className="card text-center">
      <p className={`font-display text-2xl ${color}`}>{value}</p>
      <p className="text-xs text-white/40">{label}</p>
    </div>
  )
}

export default function ProfilPage() {
  const { user, userData, logout } = useAuth()
  const [allUsers, setAllUsers] = useState([])

  useEffect(() => {
    getAllUsers().then((snap) => setAllUsers(snap.docs.map((d) => d.data())))
  }, [])

  if (!user || !userData) return null

  const accuracy = (userData.stats?.correctTips || 0) + (userData.stats?.wrongTips || 0) > 0
    ? Math.round(((userData.stats.correctTips) / (userData.stats.correctTips + userData.stats.wrongTips)) * 100)
    : 0

  const streak = userData.currentStreak || 0
  const streakDisplay = streak >= 3
    ? { label: `🔥 ${streak}er Streak`, color: 'text-brand-red' }
    : streak <= -3
    ? { label: `💀 ${Math.abs(streak)}er Pechsträhne`, color: 'text-white/40' }
    : { label: `${streak >= 0 ? '+' : ''}${streak} aktuell`, color: 'text-white/60' }

  // Nemesis: find user with most h2h losses
  const h2h = userData.h2h || {}
  let nemesis = null
  let maxLosses = 0
  Object.entries(h2h).forEach(([uid, record]) => {
    if ((record.losses || 0) > maxLosses) {
      maxLosses = record.losses
      nemesis = allUsers.find((u) => u.uid === uid)
    }
  })

  // Best rival (most wins against)
  let bestRival = null
  let maxWins = 0
  Object.entries(h2h).forEach(([uid, record]) => {
    if ((record.wins || 0) > maxWins) {
      maxWins = record.wins
      bestRival = allUsers.find((u) => u.uid === uid)
    }
  })

  const topH2H = allUsers
    .filter((u) => u.uid !== user.uid && h2h[u.uid])
    .map((u) => ({ ...u, ...h2h[u.uid] }))
    .sort((a, b) => (b.wins + b.losses) - (a.wins + a.losses))
    .slice(0, 5)

  return (
    <Layout title="👤 Profil">
      <div className="max-w-lg mx-auto space-y-4">

        {/* Avatar + Name */}
        <div className="flex flex-col items-center gap-3 pt-2">
          {user.photoURL
            ? <img src={user.photoURL} className="w-20 h-20 rounded-full border-4 border-brand-gold" alt="" />
            : <div className="w-20 h-20 rounded-full bg-brand-card border-4 border-brand-gold flex items-center justify-center text-4xl">{user.displayName?.[0] || '?'}</div>
          }
          <div className="text-center">
            <h2 className="font-bold text-xl">{user.displayName}</h2>
            <p className="text-white/40 text-sm">{user.email}</p>
            <p className={`text-sm font-bold mt-1 ${streakDisplay.color}`}>{streakDisplay.label}</p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          <StatBox value={(userData.totalPoints || 0).toFixed(0)} label="Punkte" color="text-brand-gold" />
          <StatBox value={`${accuracy}%`} label="Trefferquote" color="text-brand-green" />
          <StatBox value={`#${userData.currentRank || '?'}`} label="Rang" />
        </div>

        {/* Power-Ups */}
        <div className="card">
          <h3 className="font-bold text-xs text-white/40 mb-3 uppercase tracking-wider">Power-Ups</h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { icon: '🃏', count: userData.jokersLeft ?? 0, label: 'Joker' },
              { icon: '🛡️', count: userData.insuranceLeft ?? 0, label: 'Versicherung' },
              { icon: '💥', count: userData.allInLeft ?? 0, label: 'All-In' },
              { icon: '🕵️', count: userData.spionageLeft ?? 0, label: 'Spionage' },
            ].map(({ icon, count, label }) => (
              <div key={label}>
                <p className="text-2xl">{icon}</p>
                <p className="font-bold text-lg text-brand-gold">{count}</p>
                <p className="text-xs text-white/40">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats detail */}
        <div className="card">
          <h3 className="font-bold text-xs text-white/40 mb-3 uppercase tracking-wider">Statistiken</h3>
          <div className="space-y-2">
            {[
              { label: 'Richtige Tipps', value: userData.stats?.correctTips || 0, color: 'text-brand-green' },
              { label: 'Falsche Tipps', value: userData.stats?.wrongTips || 0, color: 'text-brand-red' },
              { label: 'Beste Streak', value: userData.bestStreak || 0, color: 'text-brand-gold' },
              { label: 'Höchste Quote', value: `x${(userData.stats?.highestOddsWon || 0).toFixed(2)}`, color: 'text-brand-gold' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-white/60">{label}</span>
                <span className={`font-bold ${color}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Nemesis & Rival */}
        {(nemesis || bestRival) && (
          <div className="grid grid-cols-2 gap-3">
            {nemesis && (
              <div className="card text-center">
                <p className="text-2xl mb-1">😈</p>
                <p className="text-xs text-white/40 mb-1">Dein Nemesis</p>
                {nemesis.photoURL
                  ? <img src={nemesis.photoURL} className="w-10 h-10 rounded-full mx-auto mb-1 border-2 border-brand-red" alt="" />
                  : <div className="w-10 h-10 rounded-full bg-brand-red/20 mx-auto mb-1 flex items-center justify-center font-bold">{nemesis.displayName?.[0]}</div>
                }
                <p className="text-xs font-bold truncate">{nemesis.displayName}</p>
                <p className="text-xs text-brand-red">{maxLosses} Niederlagen</p>
              </div>
            )}
            {bestRival && (
              <div className="card text-center">
                <p className="text-2xl mb-1">🎯</p>
                <p className="text-xs text-white/40 mb-1">Dein Opfer</p>
                {bestRival.photoURL
                  ? <img src={bestRival.photoURL} className="w-10 h-10 rounded-full mx-auto mb-1 border-2 border-brand-green" alt="" />
                  : <div className="w-10 h-10 rounded-full bg-brand-green/20 mx-auto mb-1 flex items-center justify-center font-bold">{bestRival.displayName?.[0]}</div>
                }
                <p className="text-xs font-bold truncate">{bestRival.displayName}</p>
                <p className="text-xs text-brand-green">{maxWins} Siege</p>
              </div>
            )}
          </div>
        )}

        {/* H2H Table */}
        {topH2H.length > 0 && (
          <div className="card">
            <h3 className="font-bold text-xs text-white/40 mb-3 uppercase tracking-wider">Head-to-Head</h3>
            <div className="space-y-2">
              {topH2H.map((u) => {
                const total = (u.wins || 0) + (u.losses || 0)
                const winRate = total > 0 ? Math.round((u.wins / total) * 100) : 0
                return (
                  <div key={u.uid} className="flex items-center gap-3">
                    {u.photoURL
                      ? <img src={u.photoURL} className="w-7 h-7 rounded-full shrink-0" alt="" />
                      : <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs shrink-0">{u.displayName?.[0]}</div>
                    }
                    <span className="text-sm flex-1 truncate">{u.displayName}</span>
                    <span className="text-xs text-brand-green font-bold">{u.wins}W</span>
                    <span className="text-xs text-white/30">–</span>
                    <span className="text-xs text-brand-red font-bold">{u.losses}L</span>
                    <span className={`text-xs font-bold ml-1 ${winRate >= 50 ? 'text-brand-green' : 'text-brand-red'}`}>
                      {winRate}%
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Badges */}
        {(userData.badges?.length || 0) > 0 && (
          <div className="card">
            <h3 className="font-bold text-xs text-white/40 mb-3 uppercase tracking-wider">Badges</h3>
            <div className="flex flex-wrap gap-2">
              {userData.badges.map((b) => {
                const info = BADGE_INFO[b] || { icon: '🏅', label: b, desc: '' }
                return (
                  <div key={b} className="bg-white/10 rounded-xl px-3 py-2 flex items-center gap-2">
                    <span className="text-xl">{info.icon}</span>
                    <div>
                      <p className="text-xs font-bold">{info.label}</p>
                      <p className="text-xs text-white/40">{info.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <button onClick={logout} className="w-full btn-ghost text-brand-red border-brand-red/30">
          Abmelden
        </button>
      </div>
    </Layout>
  )
}
