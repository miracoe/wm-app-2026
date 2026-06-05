import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import Flag from '../components/Flag'
import { useAuth } from '../context/AuthContext'
import { getBonusTips, setBonusTip } from '../lib/firestore'
import { useCountdown } from '../hooks/useCountdown'

const DEADLINE = new Date('2026-06-11T11:00:00')

// Alle 48 qualifizierten WM 2026 Länder
const TEAMS = [
  // CONMEBOL (6)
  { name: 'Argentinien', code: 'AR' },
  { name: 'Brasilien', code: 'BR' },
  { name: 'Ecuador', code: 'EC' },
  { name: 'Kolumbien', code: 'CO' },
  { name: 'Paraguay', code: 'PY' },
  { name: 'Uruguay', code: 'UY' },
  // CONCACAF (6 inkl. Gastgeber)
  { name: 'USA', code: 'US' },
  { name: 'Kanada', code: 'CA' },
  { name: 'Mexiko', code: 'MX' },
  { name: 'Costa Rica', code: 'CR' },
  { name: 'Honduras', code: 'HN' },
  { name: 'Panama', code: 'PA' },
  // UEFA (16)
  { name: 'Deutschland', code: 'DE' },
  { name: 'England', code: 'GB-ENG' },
  { name: 'Frankreich', code: 'FR' },
  { name: 'Spanien', code: 'ES' },
  { name: 'Portugal', code: 'PT' },
  { name: 'Niederlande', code: 'NL' },
  { name: 'Österreich', code: 'AT' },
  { name: 'Schweiz', code: 'CH' },
  { name: 'Türkei', code: 'TR' },
  { name: 'Dänemark', code: 'DK' },
  { name: 'Serbien', code: 'RS' },
  { name: 'Kroatien', code: 'HR' },
  { name: 'Schottland', code: 'GB-SCT' },
  { name: 'Ungarn', code: 'HU' },
  { name: 'Slowenien', code: 'SI' },
  { name: 'Ukraine', code: 'UA' },
  // AFC (8)
  { name: 'Japan', code: 'JP' },
  { name: 'Südkorea', code: 'KR' },
  { name: 'Iran', code: 'IR' },
  { name: 'Australien', code: 'AU' },
  { name: 'Saudi-Arabien', code: 'SA' },
  { name: 'Irak', code: 'IQ' },
  { name: 'Jordanien', code: 'JO' },
  { name: 'Usbekistan', code: 'UZ' },
  // CAF (9)
  { name: 'Marokko', code: 'MA' },
  { name: 'Senegal', code: 'SN' },
  { name: 'Nigeria', code: 'NG' },
  { name: 'Ägypten', code: 'EG' },
  { name: 'Elfenbeinküste', code: 'CI' },
  { name: 'Kamerun', code: 'CM' },
  { name: 'Südafrika', code: 'ZA' },
  { name: 'Mali', code: 'ML' },
  { name: 'DR Kongo', code: 'CD' },
  // OFC (1)
  { name: 'Neuseeland', code: 'NZ' },
  // Interkontinentale Playoffs (2)
  { name: 'Venezuela', code: 'VE' },
  { name: 'Indonesien', code: 'ID' },
]



function BonusCard({ icon, title, subtitle, locked, saved, savedLabel, savedCode, children }) {
  return (
    <div className={`card space-y-4 ${locked ? 'opacity-60' : ''} ${saved ? 'border-brand-green/30' : ''}`}>
      <div className="flex items-start gap-3">
        <span className="text-3xl">{icon}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-base">{title}</h3>
            {saved && <span className="text-xs bg-brand-green/20 text-brand-green px-2 py-0.5 rounded-full font-bold">✓ Abgegeben</span>}
          </div>
          <p className="text-xs text-white/40">{subtitle}</p>
        </div>
        {locked && <span className="text-xs bg-white/10 text-white/40 px-2 py-1 rounded-full shrink-0">🔒 Gesperrt</span>}
      </div>

      {/* Aktuell gespeicherter Tipp — immer sichtbar */}
      {saved && savedLabel && (
        <div className="flex items-center gap-3 bg-brand-green/10 border border-brand-green/20 rounded-xl px-4 py-3">
          {savedCode && <Flag code={savedCode} size={28} />}
          <div>
            <p className="text-xs text-brand-green/70 font-bold uppercase tracking-wider">Dein aktueller Tipp</p>
            <p className="font-bold text-sm">{savedLabel}</p>
          </div>
          {!locked && <span className="ml-auto text-xs text-white/30">änderbar</span>}
        </div>
      )}

      {!locked && children}
    </div>
  )
}

export default function BonusTipsPage() {
  const { user } = useAuth()
  const [bonusTips, setBonusTipsState] = useState(null)
  const [saving, setSaving] = useState('')
  const [saved, setSaved] = useState('')
  const [saveError, setSaveError] = useState('')

  const [champion, setChampion] = useState(TEAMS[0].name)
  const [topScorer, setTopScorer] = useState(TEAMS[0].name)
  const [topScorerGoals, setTopScorerGoals] = useState('')
  const [finalist, setFinalist] = useState(TEAMS[1].name)

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
    if (Date.now() >= DEADLINE.getTime() || bonusTips?.locked) return
    setSaving(field)
    setSaveError('')
    try {
      await setBonusTip(user.uid, { [field]: value })
      setSaved(field)
      setTimeout(() => setSaved(''), 2000)
    } catch (e) {
      setSaveError('Fehler beim Speichern. Bitte erneut versuchen.')
      setTimeout(() => setSaveError(''), 4000)
    } finally {
      setSaving('')
    }
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

        {saveError && (
          <div className="rounded-2xl px-4 py-3 text-center text-sm font-bold bg-brand-red/20 border border-brand-red/40 text-brand-red">
            {saveError}
          </div>
        )}

        {/* Weltmeister */}
        <BonusCard
          icon="🏆" title="Weltmeister" subtitle="+100 Punkte bei richtiger Vorhersage"
          locked={isLocked}
          saved={!!bonusTips?.champion}
          savedLabel={bonusTips?.champion}
          savedCode={TEAMS.find((t) => t.name === bonusTips?.champion)?.code}
        >
          <div className="space-y-3">
            <select value={champion} onChange={(e) => setChampion(e.target.value)}
              className="w-full appearance-none bg-white/10 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none">
              {TEAMS.map((t) => <option key={t.code} value={t.name}>{t.name}</option>)}
            </select>
            {selectedChampion && (
              <div className="flex items-center justify-center gap-3 py-2">
                <Flag code={selectedChampion.code} size={40} />
                <span className="font-bold">{selectedChampion.name}</span>
              </div>
            )}
            <button onClick={() => save('champion', champion)} disabled={saving === 'champion'}
              className="w-full btn-primary disabled:opacity-40">
              {saved === 'champion' ? '✅ Gespeichert!' : saving === 'champion' ? '…' : bonusTips?.champion ? 'Tipp ändern' : 'Abgeben'}
            </button>
          </div>
        </BonusCard>

        {/* Finalist */}
        <BonusCard
          icon="🥈" title="Finalist (Verlierer-Team)" subtitle="+50 Punkte bei richtiger Vorhersage"
          locked={isLocked}
          saved={!!bonusTips?.finalist}
          savedLabel={bonusTips?.finalist}
          savedCode={TEAMS.find((t) => t.name === bonusTips?.finalist)?.code}
        >
          <div className="space-y-3">
            <select value={finalist} onChange={(e) => setFinalist(e.target.value)}
              className="w-full appearance-none bg-white/10 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none">
              {TEAMS.map((t) => <option key={t.code} value={t.name}>{t.name}</option>)}
            </select>
            {selectedFinalist && (
              <div className="flex items-center justify-center gap-3 py-2">
                <Flag code={selectedFinalist.code} size={40} />
                <span className="font-bold">{selectedFinalist.name}</span>
              </div>
            )}
            <button onClick={() => save('finalist', finalist)} disabled={saving === 'finalist'}
              className="w-full btn-primary disabled:opacity-40">
              {saved === 'finalist' ? '✅ Gespeichert!' : saving === 'finalist' ? '…' : bonusTips?.finalist ? 'Tipp ändern' : 'Abgeben'}
            </button>
          </div>
        </BonusCard>

        {/* Torschützenkönig */}
        <BonusCard
          icon="⚽" title="Torschützenkönig — Land" subtitle="+75 Punkte bei richtigem Land · +25 extra für genaue Torzahl"
          locked={isLocked}
          saved={!!bonusTips?.topScorer}
          savedLabel={bonusTips?.topScorer ? `${bonusTips.topScorer}${bonusTips.topScorerGoals ? ` · ${bonusTips.topScorerGoals} Tore` : ''}` : null}
          savedCode={TEAMS.find((t) => t.name === bonusTips?.topScorer)?.code}
        >
          <div className="space-y-3">
            <select value={topScorer} onChange={(e) => setTopScorer(e.target.value)}
              className="w-full appearance-none bg-white/10 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none">
              {TEAMS.map((t) => <option key={t.code} value={t.name}>{t.name}</option>)}
            </select>
            {TEAMS.find((t) => t.name === topScorer) && (
              <div className="flex items-center justify-center gap-3 py-2">
                <Flag code={TEAMS.find((t) => t.name === topScorer).code} size={40} />
                <span className="font-bold">{topScorer}</span>
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
                if (isLocked) return
                setBonusTip(user.uid, {
                  topScorer,
                  topScorerGoals: topScorerGoals ? parseInt(topScorerGoals) : null,
                }).then(() => { setSaved('topScorer'); setTimeout(() => setSaved(''), 2000) })
              }}
              disabled={saving === 'topScorer'}
              className="w-full btn-primary disabled:opacity-40">
              {saved === 'topScorer' ? '✅ Gespeichert!' : saving === 'topScorer' ? '…' : bonusTips?.topScorer ? 'Tipp ändern' : 'Abgeben'}
            </button>
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
