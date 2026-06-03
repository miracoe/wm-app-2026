import { useCountdown } from '../hooks/useCountdown'

export default function CountdownTimer({ kickoff }) {
  const t = useCountdown(kickoff)
  if (!t) return null

  const parts = t.d > 0
    ? [{ v: t.d, l: 'T' }, { v: t.h, l: 'Std' }, { v: t.m, l: 'Min' }]
    : t.h > 0
    ? [{ v: t.h, l: 'Std' }, { v: t.m, l: 'Min' }, { v: t.s, l: 'Sek' }]
    : [{ v: t.m, l: 'Min' }, { v: t.s, l: 'Sek' }]

  const urgent = t.total < 3600000 // < 1h = rot

  return (
    <div className={`flex items-center gap-1.5 ${urgent ? 'text-brand-red' : 'text-white/40'}`}>
      <span className="text-xs">⏱</span>
      {parts.map(({ v, l }) => (
        <span key={l} className="text-xs font-bold tabular-nums">
          {String(v).padStart(2, '0')}{l}
        </span>
      ))}
    </div>
  )
}
