import { notFound } from 'next/navigation';

import {
  bundleLineCount,
  CommitRing,
  stateOpacity,
  WaveBundle,
  WaveLine,
} from '@/components/ui/waves';
import { DURATIONS, SEED_ROWS, STATES } from './fixtures';

export const metadata = { title: 'Waves · fixture' };

const STATE_HINT: Record<string, string> = {
  planned: 'not yet — reduced opacity',
  active:
    'in progress — the bundle grows its last line. A drop has no duration, so a lone line never animates.',
  done: 'finished — still, full strength',
};

/**
 * Every wave state on one page, for eyeballing against _docs/mockups/.
 * Dev-only: it renders the grammar, not the product, and a tab must never
 * appear for it (D3).
 */
export default function WavesFixturePage() {
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-main-900 text-2xl font-semibold">Wave grammar</h1>
      <p className="text-pool-500 mt-1 text-sm">
        Compare against <code>_docs/mockups/Home - Daily.png</code> and{' '}
        <code>Home - Lanes.png</code>. Nothing here touches the database.
      </p>

      <Section
        title="State"
        hint="One tone for every wave. Vitality is state, not color: past sinks through the section background, never by draining the wave."
      >
        <div className="border-pool-200 flex flex-wrap gap-12 border-t pt-6">
          {STATES.map((state) => (
            <figure key={state} className="flex w-40 flex-col items-center gap-4">
              <WaveLine state={state} />
              <WaveBundle durationMinutes={120} state={state} emoji="🔍" />
              <figcaption className="text-center">
                <span className="text-ink text-sm font-medium">{state}</span>
                <span className="text-pool-500 block text-xs">{STATE_HINT[state]}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </Section>

      <Section
        title="Line count by duration"
        hint="Constant gap, only the count varies. Log-scaled and capped at 10, so 8h and 24h read alike."
      >
        <div className="border-pool-200 flex flex-wrap items-start gap-10 border-t pt-6">
          {DURATIONS.map((minutes) => (
            <figure key={minutes} className="flex w-20 flex-col items-center gap-3">
              <WaveBundle durationMinutes={minutes} />
              <figcaption className="text-pool-500 text-center text-xs">
                {formatDuration(minutes)} · {bundleLineCount(minutes)}
              </figcaption>
            </figure>
          ))}
        </div>
      </Section>

      <Section title="Seed rows" hint="The fixtures every later session renders against.">
        <ul className="divide-pool-200 border-pool-200 divide-y border-t">
          {SEED_ROWS.map((row) => (
            <li key={row.label} className="flex items-start gap-6 py-5">
              {/* Every row centres its wave in the same column, so drops and
                  bundles line up on one axis rather than drifting apart. */}
              <div className="flex w-24 shrink-0 flex-col items-center">
                {row.durationMinutes ? (
                  <WaveBundle
                    durationMinutes={row.durationMinutes}
                    state={row.state}
                    emoji={row.emoji}
                  />
                ) : (
                  // A drop fades as one piece too: badge and line share the
                  // wrapper's opacity rather than each applying their own.
                  <span
                    className="flex flex-col items-center"
                    style={{ opacity: stateOpacity(row.state) }}
                  >
                    <Badge emoji={row.emoji} />
                    <WaveLine />
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-pool-500 text-xs">{row.label}</p>
                <p className="text-ink">{row.note}</p>
                {row.tag ? <Tag>{row.tag}</Tag> : null}
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        title="Ripple"
        hint="Concentric rings spreading from a commit, staggered so they read as one disturbance travelling outward."
      >
        <div className="border-pool-200 flex flex-wrap items-center gap-16 border-t pt-8">
          <CommitRing>
            <span className="bg-pool-100 flex h-12 w-12 items-center justify-center rounded-full text-xl">
              +
            </span>
          </CommitRing>
          <CommitRing rings={4} size={120}>
            <span className="bg-pool-100 text-pool-500 flex h-14 w-14 items-center justify-center rounded-full text-sm">
              YL
            </span>
          </CommitRing>
        </div>
      </Section>
    </main>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12">
      <h2 className="text-ink text-lg font-semibold">{title}</h2>
      <p className="text-pool-500 mb-4 text-sm">{hint}</p>
      {children}
    </section>
  );
}

function Badge({ emoji }: { emoji: string }) {
  return (
    <span
      aria-hidden
      className="bg-pool-100 mb-1 flex h-7 w-7 items-center justify-center rounded-full text-sm"
    >
      {emoji}
    </span>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-pool-100 text-pool-500 mt-1 inline-block rounded px-2 py-0.5 text-xs">
      {children}
    </span>
  );
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = minutes / 60;
  return Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1)}h`;
}
