const BADGES = {
  wahrsager: '🔮',
  expert_of_doom: '💀',
  risiko_koenig: '👑',
  keller_laterne: '🏮',
}

const RANK_COLORS = ['text-brand-gold', 'text-gray-300', 'text-amber-600']

import { useNavigate } from 'react-router-dom'

export default function LeaderboardRow({ user, rank, isMe }) {
  const navigate = useNavigate()
  const rankDiff = user.lastRank - rank
  const rankArrow = rankDiff > 0
    ? <span className="text-brand-green text-xs font-bold">▲{rankDiff}</span>
    : rankDiff < 0
    ? <span className="text-brand-red text-xs font-bold">▼{Math.abs(rankDiff)}</span>
    : <span className="text-white/20 text-xs">–</span>

  const streak = user.currentStreak || 0
  const streakEl = streak >= 3
    ? <span className="text-xs text-brand-red font-bold animate-pulse">🔥{streak}</span>
    : streak <= -3
    ? <span className="text-xs text-white/40 font-bold">💀{Math.abs(streak)}</span>
    : null

  return (
    <div
      onClick={() => navigate(`/user/${user.uid}`)}
      className={`flex items-center gap-3 p-3 rounded-xl mb-2 transition-all cursor-pointer active:scale-98 ${
        isMe ? 'bg-brand-blue/20 border border-brand-blue/40' : 'bg-brand-card active:bg-white/5'
      }`}
    >
      {/* Rank */}
      <div className="w-8 text-center shrink-0">
        <span className={`font-display text-xl ${RANK_COLORS[rank - 1] || 'text-white/70'}`}>
          {rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : rank}
        </span>
      </div>

      {/* Avatar */}
      {user.photoURL
        ? <img src={user.photoURL} className="w-9 h-9 rounded-full border-2 border-white/10 shrink-0" alt="" />
        : <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-lg shrink-0">{user.displayName?.[0] || '?'}</div>
      }

      {/* Name + badges + streak */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="font-bold text-sm truncate">
            {user.displayName}
            {isMe && <span className="ml-1 text-xs text-brand-blue">(Du)</span>}
          </p>
          {streakEl}
        </div>
        <div className="flex gap-1 mt-0.5">
          {(user.badges || []).map((b) => (
            <span key={b} title={b} className="text-sm">{BADGES[b] || '🏅'}</span>
          ))}
        </div>
      </div>

      {/* Rank change */}
      <div className="shrink-0">{rankArrow}</div>

      {/* Points */}
      <div className="text-right shrink-0">
        <p className="font-display text-lg text-brand-gold">{(user.totalPoints || 0).toFixed(0)}</p>
        <p className="text-xs text-white/40">Pkt</p>
      </div>
    </div>
  )
}
