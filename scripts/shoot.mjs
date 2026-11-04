#!/usr/bin/env node
/**
 * Drives the local app in headless Chrome, signed in, for screenshots and
 * probes — touch included — at a given viewport:
 *
 *   node scripts/shoot.mjs <width> <height> <plan.json>
 *
 * Local only. It mints a session with the service role key (magic link,
 * no email sent), so it refuses unless NEXT_PUBLIC_SUPABASE_URL is a local
 * Supabase. The app it opens is NEXT_PUBLIC_SITE_URL (a running `pnpm dev`).
 * Signs in as SHOOT_EMAIL, else the seed's own account.
 *
 * The local database holds real records (CLAUDE.md, "Data is real now").
 * A plan that touches anything that saves should block writes first:
 * `{ "blockWrites": true }` as a step stops every request to the app and
 * to Supabase from then on, so nothing the page does can land.
 *
 * plan: {
 *   path?: '/',                 // opened first
 *   settle?: 6000,              // ms after opening
 *   reducedMotion?: boolean,
 *   steps: [{
 *     eval?: string,            // page JavaScript; awaited; `log` prints its value
 *     cdp?: string,             // a DevTools Protocol method, e.g. 'Input.dispatchTouchEvent'
 *     params?: object,          //   its params,
 *     paramsEval?: string,      //   or page JavaScript returning them (a target found at run time)
 *     touch?: boolean,          // turn touch emulation on (pointerType 'touch', real touch-action)
 *     blockWrites?: boolean,    // block the app and Supabase from here on
 *     wait?: number,            // ms
 *     shot?: string,            // a PNG path; `clip` optional
 *     log?: string,
 *   }]
 * }
 *
 * A held touch, for instance (never ended, so nothing is released):
 *   { "touch": true }, { "blockWrites": true },
 *   { "cdp": "Input.dispatchTouchEvent", "paramsEval":
 *     "({ type: 'touchStart', touchPoints: [{ x: 120, y: 400, id: 1 }] })" },
 *   { "wait": 350 },
 *   { "cdp": "Input.dispatchTouchEvent", "params":
 *     { "type": "touchMove", "touchPoints": [{ "x": 150, "y": 440, "id": 1 }] } }
 */
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const site = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '');
const local = (u) => /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?/.test(u);
if (!local(url) || !local(site)) {
  console.error('✖ shoot.mjs runs against a local Supabase and a local app only.');
  process.exit(1);
}
const email = process.env.SHOOT_EMAIL ?? 'yoonji@during.today';
const chromePath =
  process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email });
if (error) throw error;
const res = await fetch(data.properties.action_link, { redirect: 'manual' });
const hash = new URLSearchParams(res.headers.get('location').split('#')[1]);
const session = {
  access_token: hash.get('access_token'),
  refresh_token: hash.get('refresh_token'),
  token_type: 'bearer',
  expires_in: Number(hash.get('expires_in')),
  expires_at: Number(hash.get('expires_at')),
  user: (await admin.auth.getUser(hash.get('access_token'))).data.user,
};
const cookie = 'base64-' + Buffer.from(JSON.stringify(session)).toString('base64url');
const ref = new URL(url).hostname.split('.')[0];

const chrome = spawn(
  chromePath,
  [
    '--headless=new',
    '--remote-debugging-port=9333',
    '--no-first-run',
    '--user-data-dir=/tmp/during-cdp',
    'about:blank',
  ],
  { stdio: 'ignore' },
);
let webSocketDebuggerUrl;
for (let i = 0; i < 40 && !webSocketDebuggerUrl; i++) {
  await new Promise((r) => setTimeout(r, 500));
  try {
    ({ webSocketDebuggerUrl } = await (await fetch('http://127.0.0.1:9333/json/version')).json());
  } catch {
    // Not up yet.
  }
}
if (!webSocketDebuggerUrl) throw new Error('chrome did not open its debug port');
const ws = new WebSocket(webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pending = new Map();
ws.onmessage = (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id) pending.get(msg.id)?.(msg);
};
const send = (method, params = {}, sessionId) =>
  new Promise((resolve) => {
    const i = ++id;
    pending.set(i, resolve);
    ws.send(JSON.stringify({ id: i, method, params, sessionId }));
  });
const {
  result: { targetId },
} = await send('Target.createTarget', { url: 'about:blank' });
const {
  result: { sessionId },
} = await send('Target.attachToTarget', { targetId, flatten: true });
const s = (m, p) => send(m, p, sessionId);
await s('Network.enable');
await s('Page.enable');
await s('Runtime.enable');
await s('Network.setCookie', { name: `sb-${ref}-auth-token`, value: cookie, url: site, path: '/' });

const [w, h] = [Number(process.argv[2] ?? 390), Number(process.argv[3] ?? 844)];
const plan = JSON.parse(readFileSync(process.argv[4], 'utf8'));
await s('Emulation.setDeviceMetricsOverride', {
  width: w,
  height: h,
  deviceScaleFactor: 2,
  mobile: true,
});
if (plan.reducedMotion)
  await s('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  });
await s('Page.navigate', { url: site + (plan.path ?? '/') });
await new Promise((r) => setTimeout(r, plan.settle ?? 6000));

const evaluate = async (expression) =>
  s('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });

for (const step of plan.steps ?? []) {
  if (step.touch)
    await s('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  if (step.blockWrites) {
    const app = new URL(site);
    const api = new URL(url);
    await s('Network.setBlockedURLs', {
      urls: [`*${app.hostname}:${app.port}*`, `*${api.hostname}:${api.port}*`],
    });
  }
  if (step.eval) {
    const ev = await evaluate(step.eval);
    if (step.log)
      console.log(
        step.log,
        JSON.stringify(
          ev.result?.result?.value ?? ev.result?.exceptionDetails?.text ?? ev,
          null,
          1,
        ),
      );
  }
  if (step.cdp) {
    let params = step.params ?? {};
    if (step.paramsEval) params = (await evaluate(step.paramsEval)).result?.result?.value ?? {};
    const r = await s(step.cdp, params);
    if (step.log && !step.eval) console.log(step.log, JSON.stringify(r.error ?? 'ok'));
  }
  if (step.wait) await new Promise((r) => setTimeout(r, step.wait));
  if (step.shot) {
    const shot = await s('Page.captureScreenshot', {
      format: 'png',
      ...(step.clip ? { clip: step.clip } : {}),
    });
    writeFileSync(step.shot, Buffer.from(shot.result.data, 'base64'));
    console.log('shot', step.shot);
  }
}
ws.close();
chrome.kill();
