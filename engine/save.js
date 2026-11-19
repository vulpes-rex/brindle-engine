// Saving: one slot, kept in the browser's own storage. A save is small and plain: where you are, which way the view was
// turned, the story flags and what you carry. Storage can be missing or refuse (private windows, embedded pages); then the
// game simply runs without saving.

export const SAVE_VERSION = 1;

export function makeSave(state) {
  return {
    v: SAVE_VERSION,
    area: state.area,
    x: Math.round(state.x * 100) / 100,
    z: Math.round(state.z * 100) / 100,
    yaw: Math.round(state.yaw * 1000) / 1000,
    flags: Object.keys(state.flags)
      .filter(k => state.flags[k])
      .sort(),
    items: Object.assign({}, state.items)
  };
}

// A save read back from text, or null if it is not one this version understands.
export function parseSave(text, areas) {
  let s;
  try {
    s = JSON.parse(text);
  } catch (e) {
    return null;
  }
  if (!s || s.v !== SAVE_VERSION || typeof s.area !== 'string') return null;
  if (areas && !areas.includes(s.area)) return null;
  if (![s.x, s.z, s.yaw].every(Number.isFinite)) return null;
  if (!Array.isArray(s.flags) || !s.flags.every(f => typeof f === 'string')) return null;
  if (!s.items || typeof s.items !== 'object') return null;
  const items = {};
  for (const k of Object.keys(s.items)) if (Number.isFinite(s.items[k]) && s.items[k] > 0) items[k] = Math.floor(s.items[k]);
  const flags = {};
  for (const f of s.flags) flags[f] = true;
  return { area: s.area, x: s.x, z: s.z, yaw: s.yaw, flags, items };
}

export class SaveStore {
  constructor(storage, key, areas) {
    this.storage = storage;
    this.key = key;
    this.areas = areas;
  }
  load() {
    try {
      const t = this.storage && this.storage.getItem(this.key);
      return t ? parseSave(t, this.areas) : null;
    } catch (e) {
      return null;
    }
  }
  save(state) {
    try {
      if (!this.storage) return false;
      this.storage.setItem(this.key, JSON.stringify(makeSave(state)));
      return true;
    } catch (e) {
      return false;
    }
  }
  clear() {
    try {
      if (this.storage) this.storage.removeItem(this.key);
    } catch (e) {
      /* nothing to clear */
    }
  }
}
