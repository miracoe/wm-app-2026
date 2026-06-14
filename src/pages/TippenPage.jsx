import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import MatchCard from '../components/MatchCard'
import { getMatches } from '../lib/firestore'

const PHASES = ['Alle', 'Gruppe', 'Round of 32', 'Achtelfinale', 'Viertelfinale', 'Halbfinale', 'Finale']

const toDate = (v) => v?.toDate ? v.toDate() : new Date(v)

export default function TippenPage() {
  const [matches, setMatches] = useState([])
  const [filter, setFilter] = useState('Alle')
  const [showPast, setShowPast] = useState(false)

  useEffect(() => {
    const unsub = getMatches(setMatches)
    return unsub
  }, [])

  const byPhase = filter === 'Alle' ? matches : matches.filter((m) => m.phase === filter)

  const upcoming = byPhase.filter((m) => m.status === 'upcoming')
  const live = byPhase.filter((m) => m.status === 'live')
  const finished = byPhase
    .filter((m) => m.status === 'finished')
    .sort((a, b) => toDate(b.kickoff) - toDate(a.kickoff))

  return (
    <Layout title="⚽ Tippen">
      {/* Phase filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 -mx-1 px-1">
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

      {/* Status filter */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setShowPast(false)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
            !showPast ? 'bg-white/20 text-white' : 'bg-white/5 text-white/40'
          }`}
        >
          Aktuell
        </button>
        <button
          onClick={() => setShowPast(true)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
            showPast ? 'bg-white/20 text-white' : 'bg-white/5 text-white/40'
          }`}
        >
          Vergangene {finished.length > 0 && <span className="ml-1 opacity-60">({finished.length})</span>}
        </button>
      </div>

      <div className="max-w-lg mx-auto">
        {showPast ? (
          finished.length > 0 ? (
            <section>
              {finished.map((m) => <MatchCard key={m.id} match={m} />)}
            </section>
          ) : (
            <p className="text-center text-white/30 mt-20">Keine vergangenen Spiele.</p>
          )
        ) : (
          <>
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
                {finished.slice(0, 3).map((m) => <MatchCard key={m.id} match={m} />)}
                {finished.length > 3 && (
                  <button
                    onClick={() => setShowPast(true)}
                    className="w-full py-2 text-xs text-white/40 border border-white/10 rounded-xl mt-1"
                  >
                    + {finished.length - 3} weitere vergangene Spiele
                  </button>
                )}
              </section>
            )}

            {byPhase.length === 0 && (
              <p className="text-center text-white/30 mt-20">Noch keine Spiele eingetragen.</p>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}
