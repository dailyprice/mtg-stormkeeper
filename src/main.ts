import './style.css';
import { icon } from './icons.ts';
import {
  COUNTERS, MANA_TYPES, MAX_COUNT, STORAGE_KEY, counterValue,
  initialSession, restoreSession, totalMana, transition,
  type Action, type Counter, type ManaType,
} from './state.ts';

const manaLabels: Record<ManaType, string> = { W: 'White', U: 'Blue', B: 'Black', R: 'Red', G: 'Green', C: 'Colorless' };
const manaIcons: Record<ManaType, string> = { W: 'sun', U: 'drop', B: 'skull', R: 'flame', G: 'leaf', C: 'diamond' };
const labels: Record<Counter, string> = { ...manaLabels, storm: 'Storm count', lands: 'Lands played' };
let storageAvailable = true;
let session = initialSession();
try {
  session = restoreSession(localStorage.getItem(STORAGE_KEY));
} catch {
  storageAvailable = false;
}

function controls(counter: Counter): string {
  return `<div class="counter-controls">
    <button class="step" data-counter="${counter}" data-delta="-1" aria-label="Decrease ${labels[counter].toLowerCase()}">${icon('minus')}</button>
    <button class="count" data-edit="${counter}" aria-label="Set ${labels[counter].toLowerCase()}">0</button>
    <button class="step step-plus" data-counter="${counter}" data-delta="1" aria-label="Increase ${labels[counter].toLowerCase()}">${icon('plus')}</button>
  </div>`;
}

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <main class="tracker">
    <header class="app-header">
      <div class="brand"><span class="brand-mark">${icon('bolt')}</span><div><h1>Stormkeeper<span class="brand-dot">.</span></h1><p>A LITTLE FOCUS FOR BIG TURNS</p></div></div>
      <button class="icon-button help-button" id="help-button" aria-label="Help and settings">${icon('info')}</button>
    </header>

    <div class="turn-bar"><span class="turn-label"><span class="live-dot"></span>YOUR TABLETOP COMPANION</span><span class="turn-badge">TURN <span id="turn-number">01</span></span></div>

    <section class="mana-section" aria-labelledby="mana-heading">
      <div class="section-heading"><h2 id="mana-heading">Floating mana</h2><span class="mana-total"><span id="mana-total">0</span> TOTAL</span></div>
      <div class="mana-grid">${MANA_TYPES.map((mana) => `
        <article class="mana-card mana-${mana}" aria-label="${manaLabels[mana]} mana">
          <div class="card-heading"><span class="mana-symbol">${icon(manaIcons[mana])}</span><h3>${manaLabels[mana]}</h3><span class="mana-letter">${mana}</span></div>
          ${controls(mana)}
        </article>`).join('')}
      </div>
      <p class="input-hint">Tap a number to enter an amount</p>
    </section>

    <section class="turn-section" aria-labelledby="turn-heading">
      <div class="section-heading"><h2 id="turn-heading">This turn</h2><span class="section-note">MAKE IT COUNT</span></div>
      <div class="turn-grid">
        <article class="turn-card storm-card" aria-label="Storm count"><div class="card-heading"><span class="counter-symbol">${icon('bolt')}</span><h3>Storm</h3></div>${controls('storm')}<p>Spells cast by all players</p></article>
        <article class="turn-card lands-card" aria-label="Lands played"><div class="card-heading"><span class="counter-symbol">${icon('land')}</span><h3>Lands played</h3></div>${controls('lands')}<p>Your land plays this turn</p></article>
      </div>
    </section>

    <footer class="toolbar" aria-label="Turn actions">
      <button id="undo" class="toolbar-button" disabled>${icon('undo')}<span>Undo</span></button>
      <button id="clear-mana" class="toolbar-button" disabled>${icon('clear')}<span>Clear mana</span></button>
      <button id="new-turn" class="new-turn"><span>New turn</span>${icon('arrow')}</button>
    </footer>
    <div class="save-status"><span id="save-icon">${icon('check')}</span><span id="save-status">Saved on this device</span></div>
  </main>
  <div class="toast" id="toast" role="status" aria-live="polite"></div>
  <div class="sr-only" id="announcement" role="status" aria-live="polite" aria-atomic="true"></div>

  <dialog id="edit-dialog" aria-labelledby="edit-title" aria-describedby="edit-description">
    <form id="edit-form" novalidate>
      <div class="dialog-heading"><h2 id="edit-title">Set amount</h2><button class="icon-button" type="button" data-close aria-label="Close amount editor">${icon('close')}</button></div>
      <p id="edit-description">Enter the new amount.</p>
      <label class="sr-only" for="amount">New amount</label>
      <input id="amount" name="amount" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off" enterkeyhint="done" maxlength="9" aria-describedby="amount-error" />
      <p class="form-error" id="amount-error" role="alert"></p>
      <div class="dialog-actions"><button type="button" class="secondary-button" data-close>Cancel</button><button type="submit" class="primary-button">Save amount</button></div>
    </form>
  </dialog>

  <dialog id="help-dialog" aria-labelledby="help-title">
    <div class="dialog-heading"><h2 id="help-title">A little help.</h2><button class="icon-button" data-close aria-label="Close help">${icon('close')}</button></div>
    <div class="help-content">
      <p>Keep your focus on the game. Use <strong>+ / −</strong> to count, or tap any number to enter an amount.</p>
      <dl>
        <dt>Floating mana</dt><dd>Mana available to spend. Clear it when your pool empties; this tracker doesn't advance phases automatically.</dd>
        <dt>Storm</dt><dd>Count spells cast by all players this turn, including countered spells. Copies put on the stack without being cast don't count.</dd>
        <dt>Lands played</dt><dd>Count only your land plays. Lands put onto the battlefield by fetches, ramp, or other effects don't count.</dd>
        <dt>New turn & undo</dt><dd>New turn clears all counters and advances the turn number. Undo reverses your last action, including resets. Up to 100 actions are saved.</dd>
      </dl>
      <div class="install-note"><span>${icon('download')}</span><div><h3>Keep it close</h3><p id="install-description">Add Stormkeeper to your home screen from your browser's menu. On iPhone, use Share → Add to Home Screen.</p><p id="offline-status">Preparing offline access…</p><button id="install-button" class="secondary-button" hidden>Install app</button></div></div>
      <button class="reset-game secondary-button" id="new-game">${icon('reset')}Start a new game</button>
      <p class="help-footnote">A personal companion for Magic: The Gathering. Not affiliated with Wizards of the Coast.</p>
    </div>
  </dialog>
`;

function element<T extends HTMLElement>(selector: string): T {
  return document.querySelector<T>(selector)!;
}

const editDialog = element<HTMLDialogElement>('#edit-dialog');
const helpDialog = element<HTMLDialogElement>('#help-dialog');
const amountInput = element<HTMLInputElement>('#amount');
let editingCounter: Counter | null = null;
let toastTimer: ReturnType<typeof setTimeout>;

function announce(message: string): void {
  element('#announcement').textContent = message;
}

function toast(message: string): void {
  clearTimeout(toastTimer);
  element('#toast').textContent = message;
  element('#toast').classList.add('visible');
  toastTimer = setTimeout(() => element('#toast').classList.remove('visible'), 2200);
}

function render(): void {
  for (const counter of COUNTERS) {
    const value = counterValue(session.current, counter);
    const count = element<HTMLButtonElement>(`[data-edit="${counter}"]`);
    count.textContent = String(value);
    count.setAttribute('aria-label', `Set ${labels[counter].toLowerCase()}, currently ${value}`);
    count.style.setProperty('--digits', String(String(value).length));
    element<HTMLButtonElement>(`[data-counter="${counter}"][data-delta="-1"]`).disabled = value === 0;
    element<HTMLButtonElement>(`[data-counter="${counter}"][data-delta="1"]`).disabled = value === MAX_COUNT;
    count.closest('article')!.classList.toggle('has-value', value > 0);
  }
  element('#mana-total').textContent = totalMana(session.current).toLocaleString('en-US');
  element('#turn-number').textContent = String(session.current.turn).padStart(2, '0');
  element<HTMLButtonElement>('#undo').disabled = session.history.length === 0;
  element<HTMLButtonElement>('#clear-mana').disabled = totalMana(session.current) === 0;
  element('#save-status').textContent = storageAvailable ? 'Saved on this device' : 'Saving unavailable · keep this tab open';
  element('#save-icon').hidden = !storageAvailable;
}

function act(action: Action): void {
  const next = transition(session, action);
  if (next === session) return;
  session = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
  render();
  if (action.type === 'adjust' || action.type === 'set') {
    announce(`${labels[action.counter]}: ${counterValue(session.current, action.counter)}`);
  } else {
    const messages = {
      undo: 'Last action undone',
      'clear-mana': 'Mana cleared · Undo to restore',
      'new-turn': `Turn ${session.current.turn} · Counters reset`,
      'new-game': 'New game · Undo to restore',
    };
    toast(messages[action.type]);
  }
}

document.querySelectorAll<HTMLButtonElement>('[data-counter]').forEach((button) => {
  button.addEventListener('click', () => act({ type: 'adjust', counter: button.dataset.counter as Counter, delta: Number(button.dataset.delta) as 1 | -1 }));
});

document.querySelectorAll<HTMLButtonElement>('[data-edit]').forEach((button) => {
  button.addEventListener('click', () => {
    editingCounter = button.dataset.edit as Counter;
    element('#edit-title').textContent = MANA_TYPES.includes(editingCounter as ManaType) ? `${labels[editingCounter]} mana` : labels[editingCounter];
    amountInput.value = String(counterValue(session.current, editingCounter));
    element('#amount-error').textContent = '';
    amountInput.removeAttribute('aria-invalid');
    editDialog.showModal();
    amountInput.focus();
    amountInput.select();
  });
});

element<HTMLFormElement>('#edit-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const raw = amountInput.value.trim();
  const value = Number(raw);
  if (!/^\d+$/.test(raw) || !Number.isSafeInteger(value) || value > MAX_COUNT) {
    element('#amount-error').textContent = 'Enter a whole number from 0 to 999,999,999.';
    amountInput.setAttribute('aria-invalid', 'true');
    amountInput.focus();
    return;
  }
  if (editingCounter) act({ type: 'set', counter: editingCounter, value });
  editDialog.close();
});

document.querySelectorAll<HTMLButtonElement>('[data-close]').forEach((button) => {
  button.addEventListener('click', () => button.closest('dialog')!.close());
});
for (const dialog of [editDialog, helpDialog]) {
  dialog.addEventListener('click', (event) => {
    const bounds = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
  });
}

element('#undo').addEventListener('click', () => act({ type: 'undo' }));
element('#clear-mana').addEventListener('click', () => act({ type: 'clear-mana' }));
element('#new-turn').addEventListener('click', () => act({ type: 'new-turn' }));
element('#help-button').addEventListener('click', () => helpDialog.showModal());
element('#new-game').addEventListener('click', () => {
  act({ type: 'new-game' });
  helpDialog.close();
});

document.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && !event.shiftKey && !editDialog.open && !helpDialog.open) {
    event.preventDefault();
    act({ type: 'undo' });
  }
});

window.addEventListener('storage', (event) => {
  if (event.key === STORAGE_KEY || event.key === null) {
    session = restoreSession(event.newValue);
    editDialog.close();
    render();
    toast('Updated from another tab');
  }
});

interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
let installPrompt: InstallPrompt | null = null;
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  installPrompt = event as InstallPrompt;
  element('#install-button').hidden = false;
});
element('#install-button').addEventListener('click', async () => {
  if (!installPrompt) return;
  await installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null;
  element('#install-button').hidden = true;
});
window.addEventListener('appinstalled', () => {
  element('#install-button').hidden = true;
  element('#install-description').textContent = 'Stormkeeper is on your home screen.';
});

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`)
      .then(() => navigator.serviceWorker.ready)
      .then(() => { element('#offline-status').textContent = 'Ready to use offline.'; })
      .catch(() => { element('#offline-status').textContent = 'Offline access unavailable. Reconnect and reload to try again.'; });
  });
} else {
  element('#offline-status').textContent = import.meta.env.DEV ? 'Offline access is available in the built app.' : 'This browser does not support offline access.';
}

render();
