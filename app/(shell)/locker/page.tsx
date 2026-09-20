export default function LockerPage() {
  return (
    <main className="flex min-h-[calc(100dvh-var(--tab-bar-h))] flex-1 flex-col">
      <header className="py-6">
        <h1 className="text-ink text-2xl font-semibold">Locker</h1>
      </header>

      <section className="border-pool-200 flex flex-1 items-center justify-center border-t py-16">
        {/* TODO(S6): the Trail — full personal scroll, locked Ripples included. */}
        <p className="text-pool-500 text-center">Your Trail starts with your first ripple.</p>
      </section>

      {/*
        The rule above the tab bar belongs to the page that needs one, not to
        the bar: on Home the Lanes strip's own ground does the separating, and
        a rule on the bar showed up there as a border under the strip.

        Sticky at the bar's height so it holds the edge once the Trail is long
        enough to scroll (S6).
      */}
      <div
        aria-hidden
        className="bg-pool-200 sticky -mx-6 mt-auto h-px"
        style={{ bottom: 'calc(var(--tab-bar-h) + env(safe-area-inset-bottom, 0px))' }}
      />
    </main>
  );
}
