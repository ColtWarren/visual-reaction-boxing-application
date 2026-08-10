import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { JSDOM, VirtualConsole } from 'jsdom';
import indexHtml from '../../index.html?raw';

/**
 * Coverage for the inline boot guard shipped in frontend/index.html.
 *
 * The guard is not a module — it is an inline <script> that must run before any
 * bundle exists, so there is nothing to import. These tests read the SHIPPED
 * index.html, cut the guard out between its literal comment markers, and eval
 * the extracted source verbatim inside a throwaway JSDOM realm. Nothing here
 * copies the guard; if index.html changes, these tests exercise the change.
 *
 * WHY `?raw` AND NOT readFileSync: tsconfig.app.json compiles src/ with
 * `types: ["vite/client"]` and no "node" entry, so `import ... from 'node:fs'`
 * fails `npm run build` (TS2591). Adding @types/node to the app program would
 * put Node globals in front of every app source file. Vite's `?raw` needs no
 * config change and is typed by vite/client already.
 *
 * WHY A FRESH REALM PER TEST: the guard installs a capture-phase window error
 * listener, a watchdog timer and a MutationObserver, and exposes no handle to
 * remove any of them. A shared window would stack ~30 listeners across this
 * file and leak state between cases. A new JSDOM per test is cheaper than
 * building a teardown framework around code that offers nothing to tear down.
 *
 * WHY vitest.config.ts STAYS `environment: 'node'`: JSDOM is imported directly
 * rather than installed as the vitest environment, so the other suites keep
 * running DOM-free and this file owns its realm lifecycle explicitly.
 */

// Mirrors the guard's own constants. Kept as literals so a drift in index.html
// shows up as a failing test rather than being silently absorbed.
const WATCHDOG_MS = 10_000;
const RESET_UI_TIMEOUT_MS = 15_000;
const DIAG_TIMEOUT_MS = 3_000;
const PROBE_TIMEOUT_MS = 5_000;

const ORIGIN = 'https://reactiondefense.test';
const GUARD_START = '<!-- RD_BOOT_GUARD_START -->';
const GUARD_END = '<!-- RD_BOOT_GUARD_END -->';

// The two strings probeOrigin() looks for in the fetched body. If either drifts
// out of index.html the reset path fails closed and silently stops working.
const SHELL_MARKER_TITLE = '<title>Reaction Defense Training</title>';
const SHELL_MARKER_ROOT = 'id="root"';

function countOccurrences(haystack: string, needle: string): number {
  let count = 0;
  for (
    let at = haystack.indexOf(needle);
    at !== -1;
    at = haystack.indexOf(needle, at + needle.length)
  ) {
    count += 1;
  }
  return count;
}

/**
 * Cut the guard's JS out of index.html. Throws loudly rather than returning a
 * partial string — a silently empty guard would make every test below pass for
 * the wrong reason.
 */
function extractGuardSource(html: string): string {
  const starts = countOccurrences(html, GUARD_START);
  const ends = countOccurrences(html, GUARD_END);
  if (starts !== 1 || ends !== 1) {
    throw new Error(
      `index.html must contain exactly one boot-guard marker pair; found ` +
        `${starts} start marker(s) and ${ends} end marker(s).`,
    );
  }
  const from = html.indexOf(GUARD_START);
  const to = html.indexOf(GUARD_END);
  if (to <= from) {
    throw new Error('index.html boot-guard markers are out of order.');
  }
  const block = html.slice(from + GUARD_START.length, to);
  if (countOccurrences(block, '<script>') !== 1 || countOccurrences(block, '</script>') !== 1) {
    throw new Error('boot-guard block must contain exactly one <script> element.');
  }
  const open = block.indexOf('<script>') + '<script>'.length;
  const close = block.indexOf('</script>');
  const source = block.slice(open, close);
  if (source.trim().length === 0) {
    throw new Error('boot-guard <script> is empty.');
  }
  return source;
}

// Extracted once at module scope and reused by every harness.
const GUARD_SOURCE = extractGuardSource(indexHtml);

type TimerId = ReturnType<typeof globalThis.setTimeout>;

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
}

function deferred<T>(): Deferred<T> {
  let resolve: (value: T) => void = () => {};
  let reject: (reason?: unknown) => void = () => {};
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** A promise that never settles — models a hung storage/SW API. */
function pending<T>(): Promise<T> {
  return new Promise<T>(() => {});
}

function must<T>(value: T | null | undefined, what: string): T {
  if (value === null || value === undefined) {
    throw new Error(`expected ${what} to exist`);
  }
  return value;
}

interface ProbeResponseInit {
  ok?: boolean;
  url?: string;
  contentType?: string | null;
  body?: string;
}

/** Minimal Response shape — the guard reads ok, url, headers.get and text(). */
function probeResponse(init: ProbeResponseInit = {}): unknown {
  const {
    ok = true,
    url = `${ORIGIN}/__rd-reset-probe__`,
    contentType = 'text/html; charset=utf-8',
    body = indexHtml,
  } = init;
  return {
    ok,
    url,
    headers: {
      get: (name: string) => (name.toLowerCase() === 'content-type' ? contentType : null),
    },
    text: () => Promise.resolve(body),
  };
}

interface RegistrationStub {
  scope: string;
  active: { scriptURL: string } | null;
  waiting: null;
  installing: null;
  unregister: Mock;
}

interface ServiceWorkerStub {
  controller: { scriptURL: string } | null;
  getRegistrations: Mock;
}

interface NavigatorStub {
  userAgent: string;
  onLine: boolean;
  serviceWorker?: ServiceWorkerStub;
}

interface LocationStub {
  href: string;
  origin: string;
  reload: Mock;
  replace: Mock;
}

interface CachesStub {
  keys: Mock;
  delete: Mock;
}

/** Only the slice of the JSDOM window these tests touch. */
interface HarnessWindow {
  document: Document;
  Event: typeof Event;
  MutationObserver: typeof MutationObserver;
  console: Console;
  eval: (code: string) => void;
  close: () => void;
  fetch: Mock;
  caches?: CachesStub;
  speechSynthesis?: { getVoices: Mock };
  setTimeout: (handler: () => void, ms?: number) => TimerId;
  clearTimeout: (id?: TimerId) => void;
  __rdNavigator: NavigatorStub;
  __rdLocation: LocationStub;
}

interface HarnessOptions {
  /** navigator.onLine at boot. Mutable afterwards via harness.nav.onLine. */
  onLine?: boolean;
  /** Omit navigator.serviceWorker entirely (unsupported-browser path). */
  withServiceWorker?: boolean;
  /** Omit window.caches entirely (unsupported-browser path). */
  withCaches?: boolean;
  /** Pre-existing cache keys returned by caches.keys(). */
  cacheKeys?: string[];
}

interface Harness {
  win: HarnessWindow;
  doc: Document;
  nav: NavigatorStub;
  loc: LocationStub;
  fetchMock: Mock;
  cachesKeys: Mock;
  cachesDelete: Mock;
  getRegistrations: Mock;
  unregister: Mock;
  registration: RegistrationStub;
  /** Uncaught exceptions escaping the guard, as seen by jsdom. */
  jsdomErrors: unknown[];
  /** Every window.setTimeout(...) the guard scheduled, in order. */
  scheduled: Array<{ id: TimerId; ms: number }>;
  /** Every timer id passed to window.clearTimeout. */
  cleared: TimerId[];
  /** Evaluate the extracted guard source in this realm. */
  boot: () => void;
  close: () => void;
}

let active: Harness | null = null;

function createHarness(options: HarnessOptions = {}): Harness {
  const { onLine = true, withServiceWorker = true, withCaches = true, cacheKeys = [] } = options;

  const jsdomErrors: unknown[] = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', (err) => jsdomErrors.push(err));

  const dom = new JSDOM(indexHtml, {
    url: `${ORIGIN}/`,
    runScripts: 'outside-only',
    virtualConsole,
  });
  const win = dom.window as unknown as HarnessWindow;
  const doc = win.document;

  // The guard's own logging is not under test; keep it out of the run output.
  win.console.error = vi.fn();

  // The guard reaches every timer through `window.`, so redirecting these two
  // properties at the faked Node globals puts all four of its timers (watchdog,
  // diagnostics cap, probe cap, reset UI cap) under vi's control. Recording the
  // ids is what lets the diagnostics tests prove clearTimeout actually ran.
  const scheduled: Array<{ id: TimerId; ms: number }> = [];
  const cleared: TimerId[] = [];
  win.setTimeout = (handler: () => void, ms = 0) => {
    const id = globalThis.setTimeout(handler, ms);
    scheduled.push({ id, ms });
    return id;
  };
  win.clearTimeout = (id?: TimerId) => {
    if (id !== undefined) cleared.push(id);
    globalThis.clearTimeout(id);
  };

  const fetchMock = vi.fn();
  win.fetch = fetchMock;

  win.speechSynthesis = {
    getVoices: vi.fn(() => [
      { name: 'Test Voice', lang: 'en-US', localService: true, default: true },
    ]),
  };

  const cachesKeys = vi.fn(() => Promise.resolve(cacheKeys));
  const cachesDelete = vi.fn(() => Promise.resolve(true));
  if (withCaches) {
    win.caches = { keys: cachesKeys, delete: cachesDelete };
  }

  const unregister = vi.fn(() => Promise.resolve(true));
  const registration: RegistrationStub = {
    scope: `${ORIGIN}/`,
    active: { scriptURL: `${ORIGIN}/sw.js` },
    waiting: null,
    installing: null,
    unregister,
  };
  const getRegistrations = vi.fn(() => Promise.resolve([registration]));

  const nav: NavigatorStub = {
    userAgent: 'rd-boot-guard-test',
    onLine,
    // navigator.clipboard is deliberately absent: the guard guards on it, and
    // leaving it undefined keeps the diagnostics assertions about the textarea
    // rather than about clipboard side effects.
  };
  if (withServiceWorker) {
    nav.serviceWorker = { controller: { scriptURL: `${ORIGIN}/sw.js` }, getRegistrations };
  }

  const loc: LocationStub = {
    href: `${ORIGIN}/`,
    origin: ORIGIN,
    // jsdom does not navigate, so these assert the CALL, not a page change.
    reload: vi.fn(),
    replace: vi.fn(),
  };

  win.__rdNavigator = nav;
  win.__rdLocation = loc;

  const harness: Harness = {
    win,
    doc,
    nav,
    loc,
    fetchMock,
    cachesKeys,
    cachesDelete,
    getRegistrations,
    unregister,
    registration,
    jsdomErrors,
    scheduled,
    cleared,
    boot: () => {
      // GUARD_SOURCE is interpolated verbatim. The wrapper shadows only the two
      // globals jsdom cannot make observable: navigator (no serviceWorker, and
      // onLine is a non-writable prototype getter) and location (reload/replace
      // are "not implemented" and location itself is non-configurable).
      win.eval(
        `(function (navigator, location) {\n${GUARD_SOURCE}\n})(window.__rdNavigator, window.__rdLocation);`,
      );
    },
    close: () => dom.window.close(),
  };
  active = harness;
  return harness;
}

interface ScriptErrorInit {
  type?: string | null;
  src?: string | null;
}

/**
 * Dispatch a resource `error` at a <script> in the document. Resource errors do
 * not bubble, which is exactly why the guard listens in the capture phase —
 * dispatching on an attached element reproduces that propagation path.
 */
function dispatchScriptError(h: Harness, init: ScriptErrorInit): void {
  const el = h.doc.createElement('script');
  if (init.type !== null && init.type !== undefined) el.setAttribute('type', init.type);
  if (init.src !== null && init.src !== undefined) el.setAttribute('src', init.src);
  h.doc.head.appendChild(el);
  el.dispatchEvent(new h.win.Event('error'));
}

function fillRoot(h: Harness): void {
  must(h.doc.getElementById('root'), '#root').appendChild(h.doc.createElement('div'));
}

function emptyRoot(h: Harness): void {
  must(h.doc.getElementById('root'), '#root').innerHTML = '';
}

function host(h: Harness): HTMLElement | null {
  return h.doc.getElementById('rd-boot-failure');
}

function noteText(h: Harness): string {
  return must(h.doc.getElementById('rd-note'), '#rd-note').textContent ?? '';
}

function resetButton(h: Harness): HTMLButtonElement {
  return must(
    h.doc.getElementById('rd-reset'),
    '#rd-reset',
  ) as HTMLButtonElement;
}

function retryButton(h: Harness): HTMLButtonElement {
  return must(h.doc.getElementById('rd-retry'), '#rd-retry') as HTMLButtonElement;
}

/** Boot, run the watchdog out, and assert the panel is up. */
async function showPanel(h: Harness): Promise<void> {
  h.boot();
  await vi.advanceTimersByTimeAsync(WATCHDOG_MS);
  expect(host(h)).not.toBeNull();
}

/** Click through the confirmation gate so the probe fires. */
async function confirmReset(h: Harness): Promise<HTMLButtonElement> {
  const reset = resetButton(h);
  reset.click(); // arms the gate
  reset.click(); // confirms → onLine re-check → probeOrigin()
  await vi.advanceTimersByTimeAsync(0);
  return reset;
}

/** Nothing destructive ran. */
function expectNothingDeleted(h: Harness): void {
  expect(h.unregister).not.toHaveBeenCalled();
  expect(h.cachesDelete).not.toHaveBeenCalled();
  expect(h.loc.replace).not.toHaveBeenCalled();
}

function diagSnapshot(h: Harness): Record<string, unknown> {
  const out = must(h.doc.getElementById('rd-diag-out'), '#rd-diag-out') as HTMLTextAreaElement;
  return JSON.parse(out.value) as Record<string, unknown>;
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  active?.close();
  active = null;
  vi.useRealTimers();
});

describe('bootPanel — index.html contract', () => {
  it('ships both app-shell markers probeOrigin() matches', () => {
    expect(indexHtml).toContain(SHELL_MARKER_TITLE);
    expect(indexHtml).toContain(SHELL_MARKER_ROOT);
  });

  it('ships exactly one correctly ordered guard marker pair', () => {
    expect(countOccurrences(indexHtml, GUARD_START)).toBe(1);
    expect(countOccurrences(indexHtml, GUARD_END)).toBe(1);
    expect(indexHtml.indexOf(GUARD_START)).toBeLessThan(indexHtml.indexOf(GUARD_END));
    expect(GUARD_SOURCE.length).toBeGreaterThan(0);
  });
});

interface DetectionCase {
  scenario: string;
  type: string | null;
  src: string | null;
  panel: boolean;
}

// isAppEntry(): SCRIPT + type="module" + same-origin src. The app emits exactly
// one such tag; everything else on the page must be ignored.
const DETECTION_CASES: DetectionCase[] = [
  { scenario: 'same-origin module script', type: 'module', src: '/src/main.tsx', panel: true },
  {
    scenario: 'cross-origin module script',
    type: 'module',
    src: 'https://cdn.example.com/widget.js',
    panel: false,
  },
  { scenario: 'same-origin classic script', type: null, src: '/legacy.js', panel: false },
  { scenario: 'module script with no src', type: 'module', src: null, panel: false },
  { scenario: 'module script with malformed src', type: 'module', src: 'http://[', panel: false },
];

describe('bootPanel — entry-script error detection', () => {
  it.each(DETECTION_CASES)('$scenario → panel=$panel', async ({ type, src, panel }) => {
    const h = createHarness();
    h.boot();
    dispatchScriptError(h, { type, src });
    await vi.advanceTimersByTimeAsync(0);

    if (panel) {
      expect(host(h)).not.toBeNull();
    } else {
      expect(host(h)).toBeNull();
    }
    // The malformed-src row also proves new URL() throwing inside isAppEntry()
    // is swallowed rather than escaping the capture-phase listener.
    expect(h.jsdomErrors).toEqual([]);
  });
});

describe('bootPanel — panel lifecycle', () => {
  it('root filled before the watchdog → no panel', async () => {
    const h = createHarness();
    h.boot();
    fillRoot(h);
    await vi.advanceTimersByTimeAsync(WATCHDOG_MS);
    expect(host(h)).toBeNull();
  });

  it('root still empty at the watchdog → panel appears', async () => {
    const h = createHarness();
    h.boot();
    expect(host(h)).toBeNull();
    await vi.advanceTimersByTimeAsync(WATCHDOG_MS);
    expect(host(h)).not.toBeNull();
  });

  it('root already filled when the observer attaches → retired immediately, no mutation needed', async () => {
    const h = createHarness();
    fillRoot(h);
    const observe = vi.spyOn(h.win.MutationObserver.prototype, 'observe');
    const disconnect = vi.spyOn(h.win.MutationObserver.prototype, 'disconnect');

    h.boot();

    // startObs() saw a mounted app on attach, so it disconnected without ever
    // subscribing — a mutation was never required to retire the guard.
    expect(observe).not.toHaveBeenCalled();
    expect(disconnect).toHaveBeenCalledTimes(1);

    // ...and `settled` latched: emptying root afterwards must not resurrect it.
    emptyRoot(h);
    await vi.advanceTimersByTimeAsync(WATCHDOG_MS);
    expect(host(h)).toBeNull();
  });

  it('late mount well past 30s → panel removed', async () => {
    const h = createHarness();
    await showPanel(h);
    await vi.advanceTimersByTimeAsync(35_000); // t = 45s, far beyond any cutoff
    expect(host(h)).not.toBeNull();

    fillRoot(h);
    await vi.advanceTimersByTimeAsync(0);
    expect(host(h)).toBeNull();
  });

  it('document.body absent at the watchdog → attaches to documentElement, no throw', async () => {
    const h = createHarness();
    h.boot();
    h.doc.documentElement.removeChild(must(h.doc.body, 'document.body'));
    await vi.advanceTimersByTimeAsync(WATCHDOG_MS);

    const panel = must(host(h), '#rd-boot-failure');
    expect(panel.parentNode).toBe(h.doc.documentElement);
    expect(h.jsdomErrors).toEqual([]);
  });

  it('entry error and watchdog both fire → exactly one panel', async () => {
    const h = createHarness();
    h.boot();
    dispatchScriptError(h, { type: 'module', src: '/src/main.tsx' });
    await vi.advanceTimersByTimeAsync(0);
    expect(h.doc.querySelectorAll('#rd-boot-failure')).toHaveLength(1);

    await vi.advanceTimersByTimeAsync(WATCHDOG_MS);
    expect(h.doc.querySelectorAll('#rd-boot-failure')).toHaveLength(1);
  });
});

describe('bootPanel — offline behaviour', () => {
  it('offline at render → reset control absent and nothing destructive is reachable', async () => {
    const h = createHarness({ onLine: false });
    await showPanel(h);

    expect(h.doc.getElementById('rd-reset')).toBeNull();
    expect(noteText(h)).toContain('Do not clear cached files until you reconnect');
    // diagnostics() still READS getRegistrations()/caches.keys() on the failure
    // path; what must never happen offline is a destructive call.
    expectNothingDeleted(h);
    expect(h.fetchMock).not.toHaveBeenCalled();
  });

  it('online at render → reset control present', async () => {
    const h = createHarness({ onLine: true });
    await showPanel(h);

    expect(h.doc.getElementById('rd-reset')).not.toBeNull();
    expect(noteText(h)).toContain('Removes downloaded app files');
  });

  it('online at render, offline at confirm → nothing deleted, control re-arms', async () => {
    const h = createHarness({ onLine: true });
    await showPanel(h);

    const reset = resetButton(h);
    reset.click();
    expect(reset.textContent).toBe('Tap again to confirm');

    h.nav.onLine = false; // connectivity dropped between render and confirm
    reset.click();
    await vi.advanceTimersByTimeAsync(0);

    expect(h.fetchMock).not.toHaveBeenCalled();
    expectNothingDeleted(h);
    expect(noteText(h)).toContain('You are offline');
    expect(reset.disabled).toBe(false);
    expect(retryButton(h).disabled).toBe(false);
    expect(reset.dataset.confirmed).toBe('');
    expect(reset.textContent).toBe('Clear cached app files');
  });
});

describe('bootPanel — reset chain', () => {
  it('first click only arms the confirmation gate', async () => {
    const h = createHarness();
    await showPanel(h);

    const reset = resetButton(h);
    reset.click();
    await vi.advanceTimersByTimeAsync(0);

    expect(reset.textContent).toBe('Tap again to confirm');
    expect(noteText(h)).toContain('This deletes downloaded app files');
    expect(h.fetchMock).not.toHaveBeenCalled();
    expectNothingDeleted(h);
  });

  it('probe rejects → nothing deleted', async () => {
    const h = createHarness();
    h.fetchMock.mockRejectedValue(new Error('network down'));
    await showPanel(h);
    const reset = await confirmReset(h);

    expect(h.fetchMock).toHaveBeenCalledTimes(1);
    expectNothingDeleted(h);
    expect(noteText(h)).toContain('were NOT deleted');
    expect(reset.disabled).toBe(false);
  });

  it('probe returns captive-portal HTML (200, wrong markers) → nothing deleted', async () => {
    const h = createHarness();
    h.fetchMock.mockResolvedValue(
      probeResponse({ body: '<!doctype html><title>Hotel Wi-Fi</title><p>Sign in</p>' }),
    );
    await showPanel(h);
    await confirmReset(h);

    expectNothingDeleted(h);
    expect(noteText(h)).toContain('were NOT deleted');
  });

  it('probe returns 404 → nothing deleted', async () => {
    const h = createHarness();
    h.fetchMock.mockResolvedValue(probeResponse({ ok: false }));
    await showPanel(h);
    await confirmReset(h);

    expectNothingDeleted(h);
    expect(noteText(h)).toContain('were NOT deleted');
  });

  it('probe redirects off-origin → nothing deleted', async () => {
    const h = createHarness();
    h.fetchMock.mockResolvedValue(probeResponse({ url: 'https://portal.example.net/login' }));
    await showPanel(h);
    await confirmReset(h);

    expectNothingDeleted(h);
    expect(noteText(h)).toContain('were NOT deleted');
  });

  it('probe returns a non-HTML content-type → nothing deleted', async () => {
    const h = createHarness();
    h.fetchMock.mockResolvedValue(probeResponse({ contentType: 'application/json' }));
    await showPanel(h);
    await confirmReset(h);

    expectNothingDeleted(h);
    expect(noteText(h)).toContain('were NOT deleted');
  });

  it(`probe never settles → times out at ${PROBE_TIMEOUT_MS}ms, nothing deleted`, async () => {
    const h = createHarness();
    h.fetchMock.mockReturnValue(pending());
    await showPanel(h);
    await confirmReset(h);

    expect(noteText(h)).toContain('Checking connection');
    await vi.advanceTimersByTimeAsync(PROBE_TIMEOUT_MS);

    expectNothingDeleted(h);
    expect(noteText(h)).toContain('were NOT deleted');
  });

  it('probe returns the real shell → proceeds to clear', async () => {
    const h = createHarness({ cacheKeys: ['rd-precache-v1', 'workbox-runtime'] });
    h.fetchMock.mockResolvedValue(probeResponse()); // body is the shipped index.html
    await showPanel(h);
    await confirmReset(h);

    expect(h.unregister).toHaveBeenCalledTimes(1);
    expect(h.cachesDelete).toHaveBeenCalledWith('rd-precache-v1');
    expect(h.cachesDelete).toHaveBeenCalledWith('workbox-runtime');
    expect(h.loc.replace).toHaveBeenCalledTimes(1);
    expect(String(h.loc.replace.mock.calls[0][0])).toMatch(/^\/\?rd-reset=/);
  });

  it('awaits unregister, THEN calls location.replace', async () => {
    const h = createHarness();
    const gate = deferred<boolean>();
    h.unregister.mockReturnValue(gate.promise);
    h.fetchMock.mockResolvedValue(probeResponse());
    await showPanel(h);
    await confirmReset(h);

    expect(h.unregister).toHaveBeenCalledTimes(1);
    expect(noteText(h)).toContain('Clearing cached files');
    expect(h.loc.replace).not.toHaveBeenCalled(); // still pending — must not navigate

    gate.resolve(true);
    await vi.advanceTimersByTimeAsync(0);
    expect(h.loc.replace).toHaveBeenCalledTimes(1);
  });

  it('unregister rejects → failure text, no navigation', async () => {
    const h = createHarness();
    h.unregister.mockRejectedValue(new Error('unregister failed'));
    h.fetchMock.mockResolvedValue(probeResponse());
    await showPanel(h);
    await confirmReset(h);

    expect(h.loc.replace).not.toHaveBeenCalled();
    expect(noteText(h)).toContain('Reset failed');
    expect(retryButton(h).disabled).toBe(false);
  });

  it(`unregister never settles → ${RESET_UI_TIMEOUT_MS}ms UI timeout text, no navigation`, async () => {
    const h = createHarness();
    h.unregister.mockReturnValue(pending());
    h.fetchMock.mockResolvedValue(probeResponse());
    await showPanel(h);
    await confirmReset(h);

    expect(noteText(h)).toContain('Clearing cached files');
    await vi.advanceTimersByTimeAsync(RESET_UI_TIMEOUT_MS);

    expect(noteText(h)).toContain('Automatic reset did not finish');
    expect(h.loc.replace).not.toHaveBeenCalled();
    expect(retryButton(h).disabled).toBe(false);
  });

  it('unregister resolves after the UI timeout → still no navigation (abandoned)', async () => {
    const h = createHarness();
    const gate = deferred<boolean>();
    h.unregister.mockReturnValue(gate.promise);
    h.fetchMock.mockResolvedValue(probeResponse());
    await showPanel(h);
    await confirmReset(h);

    await vi.advanceTimersByTimeAsync(RESET_UI_TIMEOUT_MS);
    expect(noteText(h)).toContain('Automatic reset did not finish');

    gate.resolve(true); // late success must not drop the user into a half-cleared app
    await vi.advanceTimersByTimeAsync(0);

    expect(h.loc.replace).not.toHaveBeenCalled();
    expect(noteText(h)).toContain('Automatic reset did not finish');
  });

  it('double click after confirming → one operation only', async () => {
    const h = createHarness({ cacheKeys: ['rd-precache-v1'] });
    const gate = deferred<unknown>();
    h.fetchMock.mockReturnValue(gate.promise);
    await showPanel(h);

    const reset = resetButton(h);
    reset.click(); // arm
    reset.click(); // confirm → disables the control and starts the probe
    reset.click(); // ignored: disabled controls have no activation behaviour
    reset.click();
    await vi.advanceTimersByTimeAsync(0);

    expect(reset.disabled).toBe(true);
    expect(h.fetchMock).toHaveBeenCalledTimes(1);

    gate.resolve(probeResponse());
    await vi.advanceTimersByTimeAsync(0);

    expect(h.unregister).toHaveBeenCalledTimes(1);
    expect(h.cachesDelete).toHaveBeenCalledTimes(1);
    expect(h.loc.replace).toHaveBeenCalledTimes(1);
  });

  it('no serviceWorker and no caches support → does not throw, still navigates', async () => {
    const h = createHarness({ withServiceWorker: false, withCaches: false });
    h.fetchMock.mockResolvedValue(probeResponse());
    await showPanel(h);
    await confirmReset(h);

    // Promise.all([]) resolves immediately: nothing to clear, so navigate.
    expect(h.loc.replace).toHaveBeenCalledTimes(1);
    expect(h.jsdomErrors).toEqual([]);
  });
});

describe('bootPanel — diagnostics', () => {
  /** Open the panel, click "Copy diagnostic details", let `ms` elapse. */
  async function collectDiagnostics(h: Harness, ms = 0): Promise<void> {
    must(h.doc.getElementById('rd-diag'), '#rd-diag').click();
    await vi.advanceTimersByTimeAsync(ms);
  }

  it(`a collector never settles → returns at ${DIAG_TIMEOUT_MS}ms with partial: true`, async () => {
    const h = createHarness();
    h.cachesKeys.mockReturnValue(pending());
    await showPanel(h);
    await collectDiagnostics(h, DIAG_TIMEOUT_MS);

    const snapshot = diagSnapshot(h);
    expect(snapshot.partial).toBe(true);
    expect(snapshot.caches).toEqual([]);
    expect(snapshot.trigger).toBe('watchdog');
  });

  it('all collectors resolve in time → partial stays false past the cap (timer cleared)', async () => {
    const h = createHarness({ cacheKeys: ['rd-precache-v1'] });
    await showPanel(h);
    await collectDiagnostics(h);

    // The diagnostics cap must be CLEARED on success, not merely out-raced.
    const capTimer = h.scheduled.filter((t) => t.ms === DIAG_TIMEOUT_MS).pop();
    expect(capTimer).toBeDefined();
    expect(h.cleared).toContain(must(capTimer, 'diagnostics cap timer').id);

    await vi.advanceTimersByTimeAsync(DIAG_TIMEOUT_MS + 1_000);

    const snapshot = diagSnapshot(h);
    expect(snapshot.partial).toBe(false);
    expect(snapshot.caches).toEqual(['rd-precache-v1']);
    expect(snapshot.voices).toEqual([
      { name: 'Test Voice', lang: 'en-US', local: true, def: true },
    ]);
  });

  it('a timed-out job resolving later → returned snapshot does not change', async () => {
    const h = createHarness();
    const gate = deferred<string[]>();
    h.cachesKeys.mockReturnValue(gate.promise);
    await showPanel(h);
    await collectDiagnostics(h, DIAG_TIMEOUT_MS);

    const out = must(h.doc.getElementById('rd-diag-out'), '#rd-diag-out') as HTMLTextAreaElement;
    const captured = out.value;
    expect(JSON.parse(captured).partial).toBe(true);
    expect(JSON.parse(captured).caches).toEqual([]);

    gate.resolve(['arrived-too-late']);
    await vi.advanceTimersByTimeAsync(1_000);

    // The capped result is final: the late collector must neither rewrite the
    // rendered snapshot nor re-fire the copy handler.
    expect(out.value).toBe(captured);

    // ...and the emptiness above was genuinely a timeout, not missing data — a
    // fresh collection now completes with the value that arrived too late.
    await collectDiagnostics(h);
    const fresh = diagSnapshot(h);
    expect(fresh.caches).toEqual(['arrived-too-late']);
    expect(fresh.partial).toBe(false);
  });

  it('a collector rejects → partial: true', async () => {
    const h = createHarness();
    h.cachesKeys.mockRejectedValue(new Error('storage unavailable'));
    await showPanel(h);
    await collectDiagnostics(h);

    const snapshot = diagSnapshot(h);
    expect(snapshot.partial).toBe(true);
    expect(h.jsdomErrors).toEqual([]);
  });
});
