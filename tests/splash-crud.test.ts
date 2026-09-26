import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { asAdmin, asUser, MINA } from './as-user';

/**
 * H20d: a Splash is a personal topic board; a Ripple belongs to at most one;
 * deleting the board DETACHES its fragments and never deletes them. The
 * detach lives in the foreign key (`on delete set null`), so this runs through
 * PostgREST against the real schema, not a mock. Owner-only RLS is checked
 * with a real user token, because the service role bypasses the policy.
 *
 * Needs the local stack; excluded from the CI config like every DB test.
 */

const PLACE = '0f000000-0000-0000-0000-0000000000a1';
let author: string;

beforeAll(async () => {
  const admin = asAdmin();
  const { data, error } = await admin.auth.admin.createUser({
    email: `splash-${Date.now()}@during.today`,
    email_confirm: true,
  });
  if (error) throw error;
  author = data.user.id;

  await admin
    .from('profiles')
    .insert({ id: author, display_name: 'Splash', timezone: 'America/Vancouver' });
  await admin.from('my_categories').insert({ id: PLACE, user_id: author, name: 'Place' });
});

afterAll(async () => {
  if (author) await asAdmin().auth.admin.deleteUser(author);
});

afterEach(async () => {
  await asAdmin().from('splashes').delete().eq('owner_id', author);
  await asAdmin().from('ripples').delete().eq('author_id', author);
});

async function board(over: { lane_ids?: string[]; declared_start?: string } = {}) {
  const { data, error } = await asUser(author)
    .from('splashes')
    .insert({ owner_id: author, title: 'Whistler', ...over })
    .select('id')
    .single();
  expect(error).toBeNull();
  return data!.id;
}

async function fragment(splashId: string | null) {
  const { data, error } = await asUser(author)
    .from('ripples')
    .insert({ author_id: author, category_id: PLACE, note: 'fixture', splash_id: splashId })
    .select('id')
    .single();
  expect(error).toBeNull();
  return data!.id;
}

describe('a splash belongs to its owner', () => {
  it('is created, read back and updated by its owner', async () => {
    const id = await board({ declared_start: '2027-03-04' });

    const { data } = await asUser(author).from('splashes').select('*').eq('id', id).single();
    expect(data?.title).toBe('Whistler');
    expect(data?.declared_start).toBe('2027-03-04');
    expect(data?.lane_ids).toEqual([]);

    const { error } = await asUser(author)
      .from('splashes')
      .update({ title: 'Whistler, two nights' })
      .eq('id', id);
    expect(error).toBeNull();
  });

  it('is invisible to anyone else, linked or not', async () => {
    const id = await board();
    const { data } = await asUser(MINA).from('splashes').select('id').eq('id', id);
    expect(data).toEqual([]);
  });

  it('cannot be created for someone else', async () => {
    const { error } = await asUser(MINA)
      .from('splashes')
      .insert({ owner_id: author, title: 'not mine' });
    expect(error).not.toBeNull();
  });

  it('refuses a declared range that ends before it starts', async () => {
    const { error } = await asUser(author).from('splashes').insert({
      owner_id: author,
      title: 'x',
      declared_start: '2027-03-04',
      declared_end: '2027-03-01',
    });
    expect(error?.message).toMatch(/splashes_declared_range/);
  });
});

describe('deleting a splash detaches, never deletes', () => {
  it('leaves every fragment in place with splash_id null', async () => {
    const id = await board();
    const a = await fragment(id);
    const b = await fragment(id);

    const { error } = await asUser(author).from('splashes').delete().eq('id', id);
    expect(error).toBeNull();

    const { data } = await asUser(author).from('ripples').select('id, splash_id').in('id', [a, b]);
    expect(data).toHaveLength(2);
    expect(data!.every((row) => row.splash_id === null)).toBe(true);
  });

  it('deleting a fragment leaves the board alone', async () => {
    const id = await board();
    const a = await fragment(id);
    await asUser(author).from('ripples').delete().eq('id', a);

    const { data } = await asUser(author).from('splashes').select('id').eq('id', id);
    expect(data).toHaveLength(1);
  });
});
