import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { calmSpans, getInnerRipples, runningBreak } from '@/lib/queries/compose';
import { asAdmin } from './as-user';

/**
 * H15a2: a break is a timed inner ripple. These go through the service role —
 * what is under test is the shape of the record and the order of the writes,
 * not what a policy hides.
 */

const DAY = '2027-05-04';
const FOCUS = '0e000000-0000-0000-0000-0000000000e1';
let author: string;
let breakCategory: string | null = null;

/** Vancouver is UTC-7 in May, so 09:00 local is 16:00Z. */
function utc(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  return new Date(Date.UTC(2027, 4, 4, h + 7, m)).toISOString();
}

beforeAll(async () => {
  const admin = asAdmin();
  const { data, error } = await admin.auth.admin.createUser({
    email: `break-${Date.now()}@during.today`,
    email_confirm: true,
  });
  if (error) throw error;
  author = data.user.id;

  await admin
    .from('profiles')
    .insert({ id: author, display_name: 'Break', timezone: 'America/Vancouver' });
  await admin
    .from('my_categories')
    .insert({ id: FOCUS, user_id: author, name: 'Focus', default_mode: 'timed', position: 0 });
});

afterAll(async () => {
  if (author) await asAdmin().auth.admin.deleteUser(author);
});

const written: string[] = [];
afterEach(async () => {
  if (written.length) await asAdmin().from('ripples').delete().in('id', written);
  written.length = 0;
});

async function insert(row: {
  time: string | null;
  endedAt?: string | null;
  parent?: string | null;
  category?: string;
}) {
  const id = crypto.randomUUID();
  written.push(id);

  return asAdmin()
    .from('ripples')
    .insert({
      id,
      author_id: author,
      category_id: row.category ?? FOCUS,
      occurred_on: DAY,
      occurred_time: row.time,
      ended_at: row.endedAt ?? null,
      parent_ripple_id: row.parent ?? null,
    })
    .select('id, started_at, ended_at, parent_ripple_id');
}

/** The lazily created Break category, made once and reused. */
async function ensureBreakCategory(): Promise<string> {
  if (breakCategory) return breakCategory;
  const { data } = await asAdmin()
    .from('my_categories')
    .insert({ user_id: author, name: 'Break', default_mode: 'timed', position: 1 })
    .select('id')
    .single();
  breakCategory = data!.id;
  return breakCategory;
}

describe('a break is an inner ripple', () => {
  it('lies within the parent span and keeps off the top-level axis', async () => {
    const session = await insert({ time: '09:00' });
    const inside = await insert({
      time: '09:20',
      endedAt: utc('09:35'),
      parent: session.data![0].id,
      category: await ensureBreakCategory(),
    });

    expect(inside.error).toBeNull();
    expect(inside.data![0].parent_ripple_id).toBe(session.data![0].id);

    const { data: topLevel } = await asAdmin()
      .from('ripples')
      .select('id')
      .eq('author_id', author)
      .is('parent_ripple_id', null);
    expect(topLevel!.map((r) => r.id)).not.toContain(inside.data![0].id);
  });

  it('is refused outside the parent span', async () => {
    const session = await insert({ time: '09:00', endedAt: utc('10:00') });
    const outside = await insert({
      time: '11:00',
      endedAt: utc('11:10'),
      parent: session.data![0].id,
      category: await ensureBreakCategory(),
    });

    expect(outside.error?.message).toMatch(/within its parent/i);
  });

  it('reuses the Break category rather than making a second one', async () => {
    const first = await ensureBreakCategory();
    const { data } = await asAdmin()
      .from('my_categories')
      .select('id')
      .eq('user_id', author)
      .eq('name', 'Break');

    expect(data).toHaveLength(1);
    expect(data![0].id).toBe(first);
  });
});

describe('one running break at a time', () => {
  it('is recognised from the children, so the UI can enforce it', async () => {
    const session = await insert({ time: '09:00' });
    const open = await insert({
      time: '09:20',
      parent: session.data![0].id,
      category: await ensureBreakCategory(),
    });

    const inner = await getInnerRipples(
      asAdmin() as unknown as Parameters<typeof getInnerRipples>[0],
      [session.data![0].id],
    );

    expect(runningBreak(inner)?.id).toBe(open.data![0].id);
  });

  it('reports none once the break has ended', async () => {
    const session = await insert({ time: '09:00' });
    await insert({
      time: '09:20',
      endedAt: utc('09:40'),
      parent: session.data![0].id,
      category: await ensureBreakCategory(),
    });

    const inner = await getInnerRipples(
      asAdmin() as unknown as Parameters<typeof getInnerRipples>[0],
      [session.data![0].id],
    );
    expect(runningBreak(inner)).toBeNull();
  });
});

describe('stopping during a break', () => {
  it('closes the break first, so the child stays inside the parent', async () => {
    const session = await insert({ time: '09:00' });
    const open = await insert({
      time: '09:20',
      parent: session.data![0].id,
      category: await ensureBreakCategory(),
    });

    const admin = asAdmin();
    // The order under test: child, then parent.
    await admin
      .from('ripples')
      .update({ ended_at: utc('09:50') })
      .eq('id', open.data![0].id);
    await admin
      .from('ripples')
      .update({ ended_at: utc('10:00') })
      .eq('id', session.data![0].id);

    const { data } = await admin
      .from('ripples')
      .select('id, ended_at')
      .in('id', [session.data![0].id, open.data![0].id]);

    const parent = data!.find((r) => r.id === session.data![0].id)!;
    const child = data!.find((r) => r.id === open.data![0].id)!;

    expect(child.ended_at).not.toBeNull();
    expect(Date.parse(child.ended_at!)).toBeLessThanOrEqual(Date.parse(parent.ended_at!));
  });
});

describe('the parent keeps gross time', () => {
  it('is untouched by the break inside it', async () => {
    const session = await insert({ time: '09:00', endedAt: utc('10:00') });
    await insert({
      time: '09:20',
      endedAt: utc('09:40'),
      parent: session.data![0].id,
      category: await ensureBreakCategory(),
    });

    const { data } = await asAdmin()
      .from('ripples')
      .select('started_at, ended_at')
      .eq('id', session.data![0].id)
      .single();

    // One hour of wall clock, not forty minutes of "real" work. The moment the
    // app subtracts, it has started keeping score (H15a2).
    const minutes = (Date.parse(data!.ended_at!) - Date.parse(data!.started_at!)) / 60_000;
    expect(minutes).toBe(60);
  });
});

describe('calm water', () => {
  it('maps a break onto the fraction of the session it covered', () => {
    const spans = calmSpans(utc('09:00'), utc('10:00'), new Date(), [
      {
        started_at: utc('09:15'),
        ended_at: utc('09:30'),
      } as never,
    ]);

    expect(spans).toEqual([{ from: 0.25, to: 0.5 }]);
  });

  it('runs a still-open break to now, so the tail goes flat', () => {
    const now = new Date(Date.parse(utc('09:40')));
    const spans = calmSpans(utc('09:00'), null, now, [
      { started_at: utc('09:20'), ended_at: null } as never,
    ]);

    expect(spans[0].from).toBeCloseTo(0.5, 5);
    expect(spans[0].to).toBe(1);
  });

  it('ignores a drop, which is a point and not a stretch', () => {
    const spans = calmSpans(utc('09:00'), utc('10:00'), new Date(), [
      { started_at: utc('09:15'), ended_at: utc('09:15') } as never,
    ]);

    expect(spans).toEqual([]);
  });
});
