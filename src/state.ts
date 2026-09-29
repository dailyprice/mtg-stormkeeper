export const MANA_TYPES = ['W', 'U', 'B', 'R', 'G', 'C'] as const;
export type ManaType = (typeof MANA_TYPES)[number];
export type Counter = ManaType | 'storm' | 'lands';
export const COUNTERS: readonly Counter[] = [...MANA_TYPES, 'storm', 'lands'];
export const MAX_COUNT = 999_999_999;
export const HISTORY_LIMIT = 100;
export const STORAGE_KEY = 'stormkeeper:v1';

export interface GameState {
  mana: Record<ManaType, number>;
  storm: number;
  lands: number;
  turn: number;
}

export interface Session {
  version: 1;
  current: GameState;
  history: GameState[];
}

export type Action =
  | { type: 'adjust'; counter: Counter; delta: 1 | -1 }
  | { type: 'set'; counter: Counter; value: number }
  | { type: 'clear-mana' }
  | { type: 'new-turn' }
  | { type: 'new-game' }
  | { type: 'undo' };

export function initialState(): GameState {
  return { mana: { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 }, storm: 0, lands: 0, turn: 1 };
}

export function initialSession(): Session {
  return { version: 1, current: initialState(), history: [] };
}

export function counterValue(state: GameState, counter: Counter): number {
  return counter === 'storm' || counter === 'lands' ? state[counter] : state.mana[counter];
}

export function totalMana(state: GameState): number {
  return MANA_TYPES.reduce((total, mana) => total + state.mana[mana], 0);
}

export function transition(session: Session, action: Action): Session {
  if (action.type === 'undo') {
    const previous = session.history.at(-1);
    return previous ? { version: 1, current: previous, history: session.history.slice(0, -1) } : session;
  }

  const next = { ...session.current, mana: { ...session.current.mana } };

  switch (action.type) {
    case 'adjust':
    case 'set': {
      const value = action.type === 'set'
        ? action.value
        : counterValue(next, action.counter) + action.delta;
      if (!Number.isSafeInteger(value) || value < 0 || value > MAX_COUNT) return session;
      if (action.counter === 'storm' || action.counter === 'lands') next[action.counter] = value;
      else next.mana[action.counter] = value;
      break;
    }
    case 'clear-mana':
      next.mana = initialState().mana;
      break;
    case 'new-turn':
      Object.assign(next, initialState(), { turn: Math.min(MAX_COUNT, next.turn + 1) });
      break;
    case 'new-game':
      Object.assign(next, initialState());
      break;
  }

  if (JSON.stringify(next) === JSON.stringify(session.current)) return session;
  return {
    version: 1,
    current: next,
    history: [...session.history, session.current].slice(-HISTORY_LIMIT),
  };
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= MAX_COUNT;
}

function isGameState(value: unknown): value is GameState {
  if (!value || typeof value !== 'object') return false;
  const state = value as Partial<GameState>;
  return isCount(state.storm) && isCount(state.lands) && isCount(state.turn) && state.turn >= 1
    && !!state.mana && typeof state.mana === 'object' && MANA_TYPES.every((mana) => isCount(state.mana?.[mana]));
}

export function restoreSession(raw: string | null): Session {
  if (!raw) return initialSession();
  try {
    const parsed = JSON.parse(raw) as Partial<Session> | null;
    if (!parsed || parsed.version !== 1 || !isGameState(parsed.current) || !Array.isArray(parsed.history)) {
      return initialSession();
    }
    return { version: 1, current: parsed.current, history: parsed.history.filter(isGameState).slice(-HISTORY_LIMIT) };
  } catch {
    return initialSession();
  }
}
