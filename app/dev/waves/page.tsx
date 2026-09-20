import { notFound } from 'next/navigation';

import { bundleLineCount, CommitRing, WaveBundle, WaveLine } from '@/components/ui/waves';
import { DURATIONS, SEED_ROWS, STATES, TONES } from './fixtures';

export const metadata = { title: 'Waves · fixture' };

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

      <Section title="Tone × state" hint="Rows are tone (live / recent / settled), columns state.">
        <table className="border-pool-200 w-full border-collapse border-t text-sm">
          <thead>
            <tr className="text-pool-500 text-left">
              <th className="w-24 py-2 font-medium">tone</th>
              {STATES.map((state) => (
                <th key={state} className="py-2 font-medium">
                  {state}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TONES.map((tone) => (
              <tr key={tone} className="border-pool-200 border-t">
                <td className="text-ink py-4 font-medium">{tone}</td>
                {STATES.map((state) => (
                  <td key={state} className="py-4">
                    <div className="flex items-center gap-6">
                      <WaveLine tone={tone} state={state} />
                      <WaveBundle
                        durationMinutes={90}
                        height={44}
                        tone={tone}
                        state={state}
                        emoji="🔍"
                      />
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section
        title="Line count by duration"
        hint="Log-scaled, capped at 10. The cap lands at 8h, so a long day reads simply as 'lots'."
      >
        <div className="flex flex-wrap items-end gap-8">
          {DURATIONS.map((minutes) => (
            <figure key={minutes} className="flex flex-col items-center gap-2">
              <WaveBundle durationMinutes={minutes} height={minutes >= 240 ? 96 : 56} tone="live" />
              <figcaption className="text-pool-500 text-xs">
                {formatDuration(minutes)} · {bundleLineCount(minutes)}
              </figcaption>
            </figure>
          ))}
        </div>
      </Section>

      <Section title="Seed rows" hint="The fixtures every later session renders against.">
        <ul className="divide-pool-200 divide-y">
          {SEED_ROWS.map((row) => (
            <li key={row.label} className="flex items-start gap-6 py-5">
              <div className="w-24 shrink-0">
                {row.durationMinutes ? (
                  <WaveBundle
                    durationMinutes={row.durationMinutes}
                    height={Math.max(32, row.durationMinutes / 2)}
                    tone={row.tone}
                    state={row.state}
                    emoji={row.emoji}
                  />
                ) : (
                  <div className="flex flex-col items-center">
                    <span
                      aria-hidden
                      className="bg-pool-100 mb-1 flex h-7 w-7 items-center justify-center rounded-full text-sm"
                    >
                      {row.emoji}
                    </span>
                    <WaveLine tone={row.tone} state={row.state} />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-pool-500 text-xs">{row.label}</p>
                <p className="text-ink">{row.note}</p>
                {row.locked ? <Tag>locked · author only</Tag> : null}
                {row.dateOnly ? <Tag>date-only · Daily Note area</Tag> : null}
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Commit ring" hint="Plays once on mount, settles to a single ring.">
        <CommitRing />
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
