import BottomNav from './BottomNav'

export default function Layout({ children, title }) {
  return (
    <div className="min-h-screen flex flex-col bg-brand-dark">
      <header className="sticky top-0 z-40 bg-brand-dark/95 backdrop-blur border-b border-white/5 px-4 py-3">
        <h1 className="text-brand-gold font-display text-xl tracking-widest uppercase text-center">
          {title || 'WM 2026'}
        </h1>
      </header>

      <main className="flex-1 overflow-y-auto pb-24 px-4 py-4">
        {children}
      </main>

      <BottomNav />
    </div>
  )
}
