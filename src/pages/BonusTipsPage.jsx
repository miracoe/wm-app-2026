import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import Flag from '../components/Flag'
import { useAuth } from '../context/AuthContext'
import { getBonusTips, setBonusTip } from '../lib/firestore'
import { useCountdown } from '../hooks/useCountdown'

const DEADLINE = new Date('2026-06-11T11:00:00')

const TEAMS = [
  { name: 'Deutschland', code: 'DE' }, { name: 'Frankreich', code: 'FR' },
  { name: 'Spanien', code: 'ES' }, { name: 'England', code: 'GB-ENG' },
  { name: 'Brasilien', code: 'BR' }, { name: 'Argentinien', code: 'AR' },
  { name: 'USA', code: 'US' }, { name: 'Mexiko', code: 'MX' },
  { name: 'Portugal', code: 'PT' }, { name: 'Niederlande', code: 'NL' },
  { name: 'Belgien', code: 'BE' }, { name: 'Italien', code: 'IT' },
  { name: 'Kroatien', code: 'HR' }, { name: 'Marokko', code: 'MA' },
  { name: 'Japan', code: 'JP' }, { name: 'Senegal', code: 'SN' },
  { name: 'Kolumbien', code: 'CO' }, { name: 'Uruguay', code: 'UY' },
  { name: 'Schweiz', code: 'CH' }, { name: 'Australien', code: 'AU' },
  { name: 'Südkorea', code: 'KR' }, { name: 'Nigeria', code: 'NG' },
  { name: 'Ghana', code: 'GH' }, { name: 'Kanada', code: 'CA' },
  { name: 'Ecuador', code: 'EC' }, { name: 'Katar', code: 'QA' },
  { name: 'Saudi-Arabien', code: 'SA' }, { name: 'Iran', code: 'IR' },
  { name: 'Türkei', code: 'TR' }, { name: 'Österreich', code: 'AT' },
  { name: 'Polen', code: 'PL' }, { name: 'Serbien', code: 'RS' },
  { name: 'Dänemark', code: 'DK' }, { name: 'Schweden', code: 'SE' },
  { name: 'Ukraine', code: 'UA' }, { name: 'Tschechien', code: 'CZ' },
  { name: 'Rumänien', code: 'RO' }, { name: 'Georgien', code: 'GE' },
  { name: 'Costa Rica', code: 'CR' }, { name: 'Panama', code: 'PA' },
]



function BonusCard({ icon, title, subtitle, locked, children }) {
  return (
    <div className={`card space-y-4 ${locked ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3">
        <span className="text-3xl">{icon}</span>
        <div>
          <h3 className="font-bold text-base">{title}</h3>
          <p className="text-xs text-white/40">{subtitle}</p>
        </div>
        {locked && <span className="ml-auto text-xs bg-white/10 text-white/40 px-2 py-1 rounded-full">🔒 Gesperrt</span>}
      </div>
      {!locked && children}
    </div>
  )
}

export default function BonusTipsPage() {
  const { user } = useAuth()
  const [bonusTips, setBonusTipsState] = useState(null)
  const [saving, setSaving] = useState('')
  const [saved, setSaved] = useState('')

  const [champion, setChampion] = useState('Brasilien')
  const [topScorer, setTopScorer] = useState('Kylian Mbappé')
  const [topScorerGoals, setTopScorerGoals] = useState('')
  const [finalist, setFinalist] = useState('Frankreich')

  useEffect(() => {
    if (!user) return
    const unsub = getBonusTips(user.uid, (data) => {
      setBonusTipsState(data)
      if (data?.champion) setChampion(data.champion)
      if (data?.topScorer) setTopScorer(data.topScorer)
      if (data?.topScorerGoals) setTopScorerGoals(String(data.topScorerGoals))
      if (data?.finalist) setFinalist(data.finalist)
    })
    return unsub
  }, [user])

  async function save(field, value) {
    setSaving(field)
    await setBonusTip(user.uid, { [field]: value })
    setSaved(field)
    setTimeout(() => setSaved(''), 2000)
    setSaving('')
  }

  const deadlinePassed = Date.now() >= DEADLINE.getTime()
  const isLocked = bonusTips?.locked === true || deadlinePassed

  const countdown = useCountdown(DEADLINE)

  const selectedChampion = TEAMS.find((t) => t.name === champion)
  const selectedFinalist = TEAMS.find((t) => t.name === finalist)

  return (
    <Layout title="🎯 Bonus-Tipps">
      <div className="max-w-lg mx-auto space-y-4">

        {/* Deadline banner */}
        {!deadlinePassed ? (
          <div className="card bg-brand-gold/10 border-brand-gold/20 text-center space-y-1">
            <p className="text-sm text-brand-gold font-bold">Turnier-Vorhersagen</p>
            <p className="text-xs text-white/40">Deadline: 11. Juni 2026, 11:00 Uhr</p>
            {countdown && (
              <div className="flex items-center justify-center gap-2 mt-2">
                {[
                  { v: countdown.d, l: 'Tage' },
                  { v: countdown.h, l: 'Std' },
                  { v: countdown.m, l: 'Min' },
                  { v: countdown.s, l: 'Sek' },
                ].map(({ v, l }) => (
                  <div key={l} className="bg-brand-dark rounded-xl px-3 py-1.5 text-center min-w-[48px]">
                    <p className="font-display text-xl text-brand-gold tabular-nums">{String(v).padStart(2, '0')}</p>
                    <p className="text-xs text-white/30">{l}</p>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-white/30 mt-1">Richtige Vorhersagen geben Bonus-Punkte am Turnierende.</p>
          </div>
        ) : (
          <div className="card bg-brand-red/10 border-brand-red/20 text-center">
            <p className="text-2xl mb-1">🔒</p>
            <p className="text-sm text-brand-red font-bold">Deadline abgelaufen</p>
            <p className="text-xs text-white/40 mt-1">Bonus-Tipps konnten bis 11. Juni 2026, 11:00 Uhr abgegeben werden.</p>
          </div>
        )}

        {/* Weltmeister */}
        <BonusCard icon="🏆" title="Weltmeister" subtitle="+100 Punkte bei richtiger Vorhersage" locked={isLocked}>
          <div className="space-y-3">
            <select value={champion} onChange={(e) => setChampion(e.target.value)}
              className="w-full appearance-none bg-white/10 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none">
              {TEAMS.map((t) => <option key={t.code} value={t.name}>{t.name}</option>)}
            </select>
            {selectedChampion && (
              <div className="flex items-center justify-center gap-3 py-2">
                <Flag code={selectedChampion.code} size={48} />
                <span className="font-bold text-lg">{selectedChampion.name}</span>
              </div>
            )}
            <button onClick={() => save('champion', champion)} disabled={saving === 'champion'}
              className="w-full btn-primary disabled:opacity-40">
              {saved === 'champion' ? '✅ Gespeichert!' : saving === 'champion' ? '…' : bonusTips?.champion ? 'Ändern' : 'Abgeben'}
            </button>
            {bonusTips?.champion && (
              <p className="text-xs text-white/30 text-center">Aktuell: <b className="text-white">{bonusTips.champion}</b></p>
            )}
          </div>
        </BonusCard>

        {/* Finalist */}
        <BonusCard icon="🥈" title="Finalist (Verlierer-Team)" subtitle="+50 Punkte bei richtiger Vorhersage" locked={isLocked}>
          <div className="space-y-3">
            <select value={finalist} onChange={(e) => setFinalist(e.target.value)}
              className="w-full appearance-none bg-white/10 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none">
              {TEAMS.map((t) => <option key={t.code} value={t.name}>{t.name}</option>)}
            </select>
            {selectedFinalist && (
              <div className="flex items-center justify-center gap-3 py-2">
                <Flag code={selectedFinalist.code} size={48} />
                <span className="font-bold text-lg">{selectedFinalist.name}</span>
              </div>
            )}
            <button onClick={() => save('finalist', finalist)} disabled={saving === 'finalist'}
              className="w-full btn-primary disabled:opacity-40">
              {saved === 'finalist' ? '✅ Gespeichert!' : saving === 'finalist' ? '…' : bonusTips?.finalist ? 'Ändern' : 'Abgeben'}
            </button>
            {bonusTips?.finalist && (
              <p className="text-xs text-white/30 text-center">Aktuell: <b className="text-white">{bonusTips.finalist}</b></p>
            )}
          </div>
        </BonusCard>

        {/* Torschützenkönig */}
        <BonusCard icon="⚽" title="Torschützenkönig — Land" subtitle="+75 Punkte bei richtigem Land · +25 extra für genaue Torzahl" locked={isLocked}>
          <div className="space-y-3">
            <select value={topScorer} onChange={(e) => setTopScorer(e.target.value)}
              className="w-full appearance-none bg-white/10 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none">
              {TEAMS.map((t) => <option key={t.code} value={t.name}>{t.name}</option>)}
            </select>
            {TEAMS.find((t) => t.name === topScorer) && (
              <div className="flex items-center justify-center gap-3 py-2">
                <Flag code={TEAMS.find((t) => t.name === topScorer).code} size={48} />
                <span className="font-bold text-lg">{topScorer}</span>
              </div>
            )}
            <div>
              <label className="text-xs text-white/40 mb-1 block">Tore (optional, +25 Bonus)</label>
              <input type="number" min="0" max="20" value={topScorerGoals}
                onChange={(e) => setTopScorerGoals(e.target.value)}
                placeholder="Anzahl Tore"
                className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none text-center font-bold" />
            </div>
            <button
              onClick={() => {
                setBonusTip(user.uid, {
                  topScorer,
                  topScorerGoals: topScorerGoals ? parseInt(topScorerGoals) : null,
                }).then(() => { setSaved('topScorer'); setTimeout(() => setSaved(''), 2000) })
              }}
              disabled={saving === 'topScorer'}
              className="w-full btn-primary disabled:opacity-40">
              {saved === 'topScorer' ? '✅ Gespeichert!' : saving === 'topScorer' ? '…' : bonusTips?.topScorer ? 'Ändern' : 'Abgeben'}
            </button>
            {bonusTips?.topScorer && (
              <p className="text-xs text-white/30 text-center">
                Aktuell: <b className="text-white">{bonusTips.topScorer}</b>
                {bonusTips.topScorerGoals ? ` · ${bonusTips.topScorerGoals} Tore` : ''}
              </p>
            )}
          </div>
        </BonusCard>

        <div className="card bg-white/5 text-center space-y-1">
          <p className="text-xs text-white/30">Bonus-Punkte werden nach dem Finale vom Admin vergeben.</p>
          <p className="text-xs text-white/20">Tipps können bis Turnierbeginn geändert werden.</p>
        </div>
      </div>
    </Layout>
  )
}
