import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { getAllUsers } from '../lib/firestore'

const BADGE_INFO = {
  wahrsager: { icon: '🔮', label: 'Wahrsager', desc: 'Exaktes Ergebnis getippt' },
  expert_of_doom: { icon: '💀', label: 'Expert of Doom', desc: '3 falsche Tipps in Folge' },
  risiko_koenig: { icon: '👑', label: 'Risiko-König', desc: 'Höchste Quote gewonnen' },
  keller_laterne: { icon: '🏮', label: 'Keller-Laterne', desc: 'Letzter Platz im Ranking' },
}

export default function UserProfilePage() {
  const { uid } = useParams()
  const { user: currentUser, userData: currentUserData } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [allUsers, setAllUsers] = useState([])

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'users', uid), (snap) => {
      if (snap.exists()) setProfile(snap.data())
    })
    getAllUsers().then((snap) => setAllUsers(snap.docs.map((d) => d.data())))
    return unsub
  }, [uid])

  if (!profile) return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const isMe = uid === currentUser?.uid
  const accuracy = (profile.stats?.correctTips || 0) + (profile.stats?.wrongTips || 0) > 0
    ? Math.round(((profile.stats.correctTips) / (profile.stats.correctTips + profile.stats.wrongTips)) * 100)
    : 0

  const streak = profile.currentStreak || 0
  const streakDisplay = streak >= 3
    ? { label: `🔥 ${streak}er Streak`, color: 'text-brand-red' }
    : streak <= -3
    ? { label: `💀 ${Math.abs(streak)}er Pechsträhne`, color: 'text-white/40' }
    : null

  // H2H gegen aktuellen User
  const myH2H = currentUserData?.h2h?.[uid]
  const theirH2H = profile.h2h?.[currentUser?.uid]

  // Nemesis & Opfer des angezeigten Users
  const h2h = profile.h2h || {}
  let nemesis = null, maxLosses = 0, bestRival = null, maxWins = 0
  Object.entries(h2h).forEach(([id, record]) => {
    if ((record.losses || 0) > maxLosses) { maxLosses = record.losses; nemesis = allUsers.find((u) => u.uid === id) }
    if ((record.wins || 0) > maxWins) { maxWins = record.wins; bestRival = allUsers.find((u) => u.uid === id) }
  })

  return (
    <Layout title={isMe ? '👤 Profil' : '👤 Spielerprofil'}>
      <div className="max-w-lg mx-auto space-y-4">

        {/* Back button */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/40 text-sm">
          ← Zurück zur Rangliste
        </button>

        {/* Avatar + Name */}
        <div className="flex flex-col items-center gap-3 pt-2">
          {profile.photoURL
            ? <img src={profile.photoURL} className="w-20 h-20 rounded-full border-4 border-brand-gold" alt="" />
            : <div className="w-20 h-20 rounded-full bg-brand-card border-4 border-brand-gold flex items-center justify-center text-4xl">{profile.displayName?.[0] || '?'}</div>
          }
          <div className="text-center">
            <h2 className="font-bold text-xl">{profile.displayName}</h2>
            <p className="text-white/40 text-sm">Rang #{profile.currentRank || '?'}</p>
            {streakDisplay && <p className={`text-sm font-bold mt-1 ${streakDisplay.color}`}>{streakDisplay.label}</p>}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card text-center">
            <p className="font-display text-2xl text-brand-gold">{(profile.totalPoints || 0).toFixed(0)}</p>
            <p className="text-xs text-white/40">Punkte</p>
          </div>
          <div className="card text-center">
            <p className="font-display text-2xl text-brand-green">{accuracy}%</p>
            <p className="text-xs text-white/40">Trefferquote</p>
          </div>
          <div className="card text-center">
            <p className="font-display text-2xl">#{profile.currentRank || '?'}</p>
            <p className="text-xs text-white/40">Rang</p>
          </div>
        </div>

        {/* H2H gegen mich */}
        {!isMe && (myH2H || theirH2H) && (
          <div className="card">
            <h3 className="font-bold text-xs text-white/40 mb-3 uppercase tracking-wider">Head-to-Head gegen dich</h3>
            <div className="flex items-center justify-around">
              <div className="text-center">
                {currentUserData?.photoURL
                  ? <img src={currentUserData.photoURL} className="w-10 h-10 rounded-full mx-auto mb-1 border-2 border-brand-green" alt="" />
                  : <div className="w-10 h-10 rounded-full bg-white/10 mx-auto mb-1 flex items-center justify-center">{currentUserData?.displayName?.[0]}</div>
                }
                <p className="text-xs font-bold">Du</p>
                <p className="text-2xl font-display text-brand-green">{myH2H?.wins || 0}</p>
                <p className="text-xs text-white/40">Siege</p>
              </div>
              <div className="text-center">
                <p className="text-2xl text-white/20 font-bold">VS</p>
                <p className="text-xs text-white/30 mt-1">
                  {(myH2H?.wins || 0) + (myH2H?.losses || 0)} Spiele
                </p>
              </div>
              <div className="text-center">
                {profile.photoURL
                  ? <img src={profile.photoURL} className="w-10 h-10 rounded-full mx-auto mb-1 border-2 border-brand-red" alt="" />
                  : <div className="w-10 h-10 rounded-full bg-white/10 mx-auto mb-1 flex items-center justify-center">{profile.displayName?.[0]}</div>
                }
                <p className="text-xs font-bold truncate max-w-[70px]">{profile.displayName}</p>
                <p className="text-2xl font-display text-brand-red">{myH2H?.losses || 0}</p>
                <p className="text-xs text-white/40">Siege</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats detail */}
        <div className="card">
          <h3 className="font-bold text-xs text-white/40 mb-3 uppercase tracking-wider">Statistiken</h3>
          <div className="space-y-2">
            {[
              { label: 'Richtige Tipps', value: profile.stats?.correctTips || 0, color: 'text-brand-green' },
              { label: 'Falsche Tipps', value: profile.stats?.wrongTips || 0, color: 'text-brand-red' },
              { label: 'Beste Streak', value: profile.bestStreak || 0, color: 'text-brand-gold' },
              { label: 'Höchste Quote', value: `x${(profile.stats?.highestOddsWon || 0).toFixed(2)}`, color: 'text-brand-gold' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-white/60">{label}</span>
                <span className={`font-bold ${color}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Nemesis & Opfer */}
        {(nemesis || bestRival) && (
          <div className="grid grid-cols-2 gap-3">
            {nemesis && (
              <div className="card text-center">
                <p className="text-2xl mb-1">😈</p>
                <p className="text-xs text-white/40 mb-1">Nemesis</p>
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
                <p className="text-xs text-white/40 mb-1">Opfer</p>
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

        {/* Badges */}
        {(profile.badges?.length || 0) > 0 && (
          <div className="card">
            <h3 className="font-bold text-xs text-white/40 mb-3 uppercase tracking-wider">Badges</h3>
            <div className="flex flex-wrap gap-2">
              {profile.badges.map((b) => {
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

        {isMe && (
          <p className="text-center text-xs text-white/20">Das bist du — vollständiges Profil unter 👤 Profil</p>
        )}
      </div>
    </Layout>
  )
}
