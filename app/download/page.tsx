import Link from "next/link";

export default function DownloadPage() {
  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8">
      <section className="rounded-xl border border-border bg-card p-6">
        <h1 className="text-2xl font-semibold">Install Velvet Galaxy</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Velvet Galaxy is installable as a Progressive Web App. Install for faster launch and improved
          continuity when your connection is unstable.
        </p>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">iOS Safari</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Open Velvet Galaxy in Safari.</li>
          <li>Tap Share.</li>
          <li>Select Add to Home Screen.</li>
          <li>Launch from your home screen.</li>
        </ol>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Android / Chromium</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Open Velvet Galaxy in your browser.</li>
          <li>Use Install app from browser menu or the in-app prompt.</li>
          <li>Confirm and launch from your app list.</li>
        </ol>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Offline fallback</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          When network connectivity is unavailable, Velvet Galaxy can serve an offline fallback.
        </p>
        <div className="mt-4 flex gap-3">
          <Link className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" href="/">
            Back home
          </Link>
          <Link className="rounded-md border border-border px-4 py-2 text-sm font-medium" href="/offline">
            Open offline page
          </Link>
        </div>
      </section>
    </main>
  );
}
