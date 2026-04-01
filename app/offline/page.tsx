export default function OfflinePage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <section className="rounded-xl border border-border bg-card p-6">
        <h1 className="text-2xl font-semibold">You are offline</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Velvet Galaxy cannot reach the network right now. Reconnect and refresh to continue.
        </p>
      </section>
    </main>
  );
}
