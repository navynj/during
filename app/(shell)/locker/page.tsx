export default function LockerPage() {
  return (
    <main className="flex flex-1 flex-col">
      <header className="py-6">
        <h1 className="text-ink text-2xl font-semibold">Locker</h1>
      </header>
      <section className="border-pool-200 flex flex-1 items-center justify-center border-t py-16">
        {/* TODO(S6): the Trail — full personal scroll, locked Ripples included. */}
        <p className="text-pool-500 text-center">Your Trail starts with your first ripple.</p>
      </section>
    </main>
  );
}
