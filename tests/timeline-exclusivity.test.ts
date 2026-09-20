import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { getRipplesForDate } from '@/lib/queries/ripples';
import { asAdmin } from './as-user';

/**
 * H10: one author's top-level Ripples never overlap. The rule lives in an
 * exclusion constraint, so these go through the service role — the point is
 * what the database refuses, not what a policy hides.
 *
 * On a throwaway author rather than a seeded one. Yoonji has a timer running,
 * and a running timer holds the axis to infinity, so every future date is
 * already spoken for. That is the rule working, but it makes a shared fixture
 * useless for testing it.
 */

const DAY = '2027-03-04';
const FOCUS = '0f000000-0000-0000-0000-0000000000f1';
const LISTENING = '0f000000-0000-0000-0000-0000000000f2';

let author: string;

beforeAll(async () => {
  const admin = asAdmin();
  const { data, error } = await admin.auth.admin.createUser({
    email: `exclusivity-${Date.now()}@during.today`,
    email_confirm: true,
  });
  if (error) throw error;
  author = data.user.id;

  await admin
    .from('profiles')
    .insert({ id: author, display_name: 'Exclusivity', timezone: 'America/Vancouver' });
  await admin.from('my_categories').insert([
    { id: FOCUS, user_id: author, name: 'Focus', default_mode: 'timed', position: 0 },
    { id: LISTENING, user_id: author, name: 'Listening', default_mode: 'drop', position: 1 },
  ]);
});

afterAll(async () => {
  if (author) await asAdmin().auth.admin.deleteUser(author);
});

const written: string[] = [];

afterEach(async () => {
  if (written.length === 0) return;
  await asAdmin().from('ripples').delete().in('id', written);
  written.length = 0;
});

type Row = {
  id?: string;
  category_id?: string;
  occurred_time: string | null;
  ended_at?: string | null;
  planned?: boolean;
  parent_ripple_id?: string | null;
};

/** Vancouver is UTC-8 on this date — before DST starts — so 09:00 is 17:00Z. */
function utc(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  return new Date(Date.UTC(2027, 2, 4, h + 8, m)).toISOString();
}

async function insert(row: Row) {
  const id = row.id ?? crypto.randomUUID();
  written.push(id);

  return asAdmin()
    .from('ripples')
    .insert({
      id,
      author_id: author,
      category_id: row.category_id ?? FOCUS,
      note: 'fixture',
      occurred_on: DAY,
      occurred_time: row.occurred_time,
      ended_at: row.ended_at ?? null,
      planned: row.planned ?? false,
      parent_ripple_id: row.parent_ripple_id ?? null,
    })
    .select('id');
}

async function session(from: string, to: string) {
  const { data, error } = await insert({ occurred_time: from, ended_at: utc(to) });
  expect(error).toBeNull();
  return data![0].id;
}

describe('top-level exclusivity', () => {
  it('refuses a second record inside a timed span', async () => {
    await session('09:00', '10:30');

    const { error } = await insert({ occurred_time: '09:40', ended_at: utc('09:40') });
    expect(error?.message).toMatch(/exclusion|overlap|ripples_top_level_no_overlap/i);
  });

  it('refuses two overlapping sessions', async () => {
    await session('09:00', '10:30');

    const { error } = await insert({ occurred_time: '10:00', ended_at: utc('11:00') });
    expect(error).not.toBeNull();
  });

  it('accepts back-to-back spans, because touching is not overlapping', async () => {
    await session('09:00', '10:00');

    const { error } = await insert({ occurred_time: '10:00', ended_at: utc('11:00') });
    expect(error).toBeNull();
  });

  it('accepts the same record as an inner ripple', async () => {
    const parent = await session('09:00', '10:30');

    const { error } = await insert({
      occurred_time: '09:40',
      ended_at: utc('09:40'),
      parent_ripple_id: parent,
      category_id: LISTENING,
    });
    expect(error).toBeNull();
  });

  it('allows plans to collide, since intentions may', async () => {
    await session('09:00', '10:30');

    const { error } = await insert({
      occurred_time: '09:30',
      ended_at: utc('09:30'),
      planned: true,
    });
    expect(error).toBeNull();
  });

  it('leaves date-only records out of it entirely', async () => {
    await session('09:00', '10:30');

    const { error } = await insert({ occurred_time: null });
    expect(error).toBeNull();
  });
});

describe('at most one running timer', () => {
  it('is a consequence of the same rule, not a separate check', async () => {
    // A running timer holds the axis to infinity, so anything after it clashes
    // — including a second timer.
    const started = await insert({ occurred_time: '09:00', ended_at: null });
    expect(started.error).toBeNull();

    const { error } = await insert({ occurred_time: '11:00', ended_at: utc('11:30') });
    expect(error).not.toBeNull();
  });

  it('still admits the same record as an inner ripple of the running session', async () => {
    const started = await insert({ occurred_time: '09:00', ended_at: null });
    expect(started.error).toBeNull();

    const { error } = await insert({
      occurred_time: '11:00',
      ended_at: utc('11:00'),
      parent_ripple_id: started.data![0].id,
      category_id: LISTENING,
    });
    expect(error).toBeNull();
  });
});

describe('containment', () => {
  it('refuses an inner ripple outside its parent span', async () => {
    const parent = await session('09:00', '10:30');

    const { error } = await insert({
      occurred_time: '11:00',
      ended_at: utc('11:00'),
      parent_ripple_id: parent,
    });
    expect(error?.message).toMatch(/within its parent/i);
  });

  it('refuses an inner ripple inside an inner ripple', async () => {
    const parent = await session('09:00', '10:30');
    const { data } = await insert({
      occurred_time: '09:20',
      ended_at: utc('09:50'),
      parent_ripple_id: parent,
    });

    const { error } = await insert({
      occurred_time: '09:30',
      ended_at: utc('09:30'),
      parent_ripple_id: data![0].id,
    });
    expect(error?.message).toMatch(/cannot carry inner ripples/i);
  });
});

describe('inner ripples on the axis', () => {
  it('are not returned for the timeline: the parent owns the row', async () => {
    const parent = await session('09:00', '10:30');
    const inner = await insert({
      occurred_time: '09:40',
      ended_at: utc('09:40'),
      parent_ripple_id: parent,
      category_id: LISTENING,
    });
    expect(inner.error).toBeNull();

    const { data } = await getRipplesForDate(
      asAdmin() as unknown as Parameters<typeof getRipplesForDate>[0],
      author,
      DAY,
    ).then((rows) => ({ data: rows }));

    const ids = data.map((r) => r.id);
    expect(ids).toContain(parent);
    expect(ids).not.toContain(inner.data![0].id);
  });
});
