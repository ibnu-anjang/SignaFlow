export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-4 rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <h1 className="text-2xl font-semibold tracking-tight">SignaFlow</h1>
        <p className="text-sm text-neutral-400">
          Platform Digital Signage Offline-First untuk Layar Kiosk Vertikal 9:16.
        </p>
        <div className="flex flex-wrap gap-3 pt-2 text-sm">
          <a
            href="/admin"
            className="rounded-lg bg-white px-4 py-2 font-medium text-neutral-950 hover:bg-neutral-200"
          >
            Admin CMS
          </a>
          <a
            href="/player"
            className="rounded-lg border border-neutral-700 px-4 py-2 font-medium hover:bg-neutral-800"
          >
            Kiosk Player
          </a>
          <a
            href="/api/v1/health"
            className="rounded-lg border border-neutral-800 px-4 py-2 text-neutral-400 hover:text-neutral-200"
          >
            API Health
          </a>
        </div>
      </div>
    </main>
  );
}
