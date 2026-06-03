import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import MatchCard from '../components/MatchCard'
import { getMatches } from '../lib/firestore'

const PHASES = ['Alle', 'Gruppe', 'Round of 32', 'Achtelfinale', 'Viertelfinale', 'Halbfinale', 'Finale']

export default function TippenPage() {
  const [matches, setMatches] = useState([])
  const [filter, setFilter] = useState('Alle')

  useEffect(() => {
    const unsub = getMatches(setMatches)
    return unsub
  }, [])

  const filtered = filter === 'Alle' ? matches : matches.filter((m) => m.phase === filter)

  const upcoming = filtered.filter((m) => m.status === 'upcoming')
  const live = filtered.filter((m) => m.status === 'live')
  const finished = filtered.filter((m) => m.status === 'finished')

  return (
    <Layout title="⚽ Tippen">
      {/* Phase filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1">
        {PHASES.map((p) => (
          <button
            key={p}
            onClick={() => setFilter(p)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
              filter === p ? 'bg-brand-gold text-black' : 'bg-white/10 text-white/60'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="max-w-lg mx-auto">
        {live.length > 0 && (
          <section className="mb-6">
            <h2 className="text-brand-red font-bold text-sm mb-2 uppercase tracking-wider">🔴 Live</h2>
            {live.map((m) => <MatchCard key={m.id} match={m} />)}
          </section>
        )}

        {upcoming.length > 0 && (
          <section className="mb-6">
            <h2 className="text-white/50 font-bold text-sm mb-2 uppercase tracking-wider">Kommende Spiele</h2>
            {upcoming.map((m) => <MatchCard key={m.id} match={m} />)}
          </section>
        )}

        {finished.length > 0 && (
          <section className="mb-6">
            <h2 className="text-white/30 font-bold text-sm mb-2 uppercase tracking-wider">Abgeschlossen</h2>
            {finished.map((m) => <MatchCard key={m.id} match={m} />)}
          </section>
        )}

        {filtered.length === 0 && (
          <p className="text-center text-white/30 mt-20">Noch keine Spiele eingetragen.</p>
        )}
      </div>
    </Layout>
  )
}
