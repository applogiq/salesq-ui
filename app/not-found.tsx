import AppShell from '@/components/AppShell';

export default function NotFound() {
  return (
    <AppShell>
      <div className="flex flex-col items-center justify-center h-full text-center py-24">
        <div className="w-14 h-14 bg-cyan-500/10 rounded-2xl flex items-center justify-center mb-4">
          <span className="text-3xl">🚧</span>
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Coming Soon</h2>
        <p className="text-slate-400 text-sm max-w-xs mb-6">
          This section is under construction. Use the links below to explore the live demo.
        </p>
        <div className="flex gap-3">
          <a
            href="/dashboard"
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            Dashboard
          </a>
          <a
            href="/dialpad"
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium transition-colors"
          >
            Dialpad
          </a>
        </div>
      </div>
    </AppShell>
  );
}
