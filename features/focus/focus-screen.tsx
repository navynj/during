'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { ChevronDown, Pause, Play, Plus } from 'lucide-react';

import { WaveLine } from '@/components/ui/waves';
import { StopControl } from '@/features/home-daily/stop-control';
import { endBreak, startBreak } from './break';
import { formatStopwatch, useElapsedSeconds } from '@/features/home-daily/use-elapsed';
import type { RippleWithCategory } from '@/lib/queries/ripples';

/**
 * H15a: a running timed, at full size. A solid #0507C9 surface — which law 5
 * now reads as "a live session" rather than "a Swim or Splash card" — with the
 * elapsed time at display size and slow white water crossing it.
 *
 * Absent on purpose, and not to be added back without revisiting H15: no goal
 * duration, no percent, no progress bar (gauges and targets, rejected by F2
 * and the no-guilt hypothesis); no pause (`ended_at` is a single instant —
 * a pausable timer needs intervals and invites the accounting this app
 * exists to avoid); no co-swimmers row until people exist, in P2.
 *
 * Type sizes and the band positions are eyed from
 * _docs/mockups/timer-focus.png, not exported.
 */
export function FocusScreen({
  ripple,
  startedAt,
  initialSeconds,
  openBreak,
  breakStartedAt,
  breakInitialSeconds,
}: {
  ripple: RippleWithCategory;
  startedAt: string;
  initialSeconds: number;
  /** The break running inside this session, if one is (H15a2). */
  openBreak?: string | null;
  breakStartedAt?: string | null;
  breakInitialSeconds?: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const seconds = useElapsedSeconds(startedAt, initialSeconds);
  const category = ripple.category?.name ?? 'Focus';
  const onBreak = Boolean(openBreak);

  return (
    <main className="live-surface flex min-h-dvh flex-col px-6 py-5">
      <header className="flex items-start justify-between gap-4">
        <Link href="/" className="flex items-center gap-1 text-sm text-white/80">
          <ChevronDown aria-hidden size={16} />
          Collapse
        </Link>

        {/* SPEC 7's display format, carried onto the live surface. */}
        <span className="flex max-w-[60%] items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm text-white">
          {ripple.category?.icon ? <span aria-hidden>{ripple.category.icon}</span> : null}
          <span className="truncate">
            {category}
            {ripple.note ? ` · ${ripple.note}` : ''}
          </span>
        </span>
      </header>

      <div className="relative flex flex-1 flex-col items-center justify-center">
        {/* The water crosses the whole surface, behind the clock. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 flex flex-col gap-10 opacity-40"
        >
          {/* Law 2: rest is the same channel at its low value, so the water
              stops moving rather than turning into something else. */}
          <FullWidthWave still={onBreak} />
          <FullWidthWave still={onBreak} />
          <FullWidthWave still={onBreak} />
        </div>

        <p className="relative text-xs tracking-[0.35em] text-white/70 uppercase">{category}</p>
        <p className="relative text-7xl font-light text-white tabular-nums">
          {formatStopwatch(seconds)}
        </p>

        {/* Beside the session's clock, never subtracted from it: the session
            keeps gross wall-clock time, and no net figure is shown anywhere
            (H15a2). */}
        {onBreak && breakStartedAt ? (
          <BreakClock since={breakStartedAt} initialSeconds={breakInitialSeconds ?? 0} />
        ) : null}
      </div>

      <div className="flex items-center justify-center gap-6 pb-4">
        <RoundAction
          href={`/?session=${ripple.id}`}
          label="Add to this session"
          onNavigate={() => router.push(`/?session=${ripple.id}`)}
        >
          <Plus aria-hidden size={18} />
        </RoundAction>

        <StopControl
          rippleId={ripple.id}
          since={startedAt}
          initialMinutes={Math.round(seconds / 60)}
          tone="on-live"
          openBreakId={openBreak ?? null}
          onStopped={() => router.push('/')}
        />

        <button
          type="button"
          disabled={pending}
          aria-label={onBreak ? 'Resume' : 'Take a break'}
          onClick={() =>
            startTransition(async () => {
              if (onBreak && openBreak) await endBreak(openBreak);
              else await startBreak(ripple.id);
              router.refresh();
            })
          }
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/40 text-white disabled:opacity-50"
        >
          {onBreak ? <Play aria-hidden size={18} /> : <Pause aria-hidden size={18} />}
        </button>
      </div>
    </main>
  );
}

/**
 * One wave line stretched across the surface. Built from the same component as
 * every other wave — only the ink inverts, from `--wave-ink` on .live-surface.
 */
function FullWidthWave({ still = false }: { still?: boolean }) {
  return (
    <span className="flex justify-center overflow-hidden">
      <WaveLine width={440} travelling={!still} />
    </span>
  );
}

/** How long the break has run. Beside the session's clock, never subtracted. */
function BreakClock({ since, initialSeconds }: { since: string; initialSeconds: number }) {
  const seconds = useElapsedSeconds(since, initialSeconds);
  return (
    <p className="relative mt-3 rounded-full bg-white/15 px-3 py-1 text-sm text-white">
      On a break · {formatStopwatch(seconds)}
    </p>
  );
}

function RoundAction({
  href,
  label,
  onNavigate,
  children,
}: {
  href: string;
  label: string;
  onNavigate: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onNavigate}
      data-href={href}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-white/40 text-white"
    >
      {children}
    </button>
  );
}
