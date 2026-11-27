// An analog stick: where a thumb is on the stick drawn on the picture, or where a controller's stick is, as a push of 0..1
// in some direction. The field walks by it: gently for a small push, at full pace at the rim.

export const STICK = {
  dead: 0.18, // a push smaller than this is none (a thumb resting, a worn stick),
  vert: 0.6, // side-on, a push this far up or down is a change of lane,
  lean: 1.2 // if it is that much more up or down than across
};

// a raw push (x across, y up, each -1..1) with the dead middle taken out and its length kept to 1
export function push(x, y) {
  const l = Math.hypot(x, y);
  if (!(l > STICK.dead)) return { x: 0, y: 0 };
  const k = Math.min(1, (l - STICK.dead) / (1 - STICK.dead)) / l;
  return { x: x * k, y: y * k };
}

// A thumb (dx, dy) from the middle of a stick of radius r, dy down the page: the push it makes, and where the knob is
// drawn (kept inside the rim).
export function stickAt(dx, dy, r) {
  const l = Math.hypot(dx, dy),
    k = l > r ? r / l : 1;
  return Object.assign(push(dx / r, -dy / r), { knob: [dx * k, dy * k] });
}

// Side-on along a lane a push is a walk along it or a change of lane, never both: which way across (kx), or which way
// up or down (ky), and how hard (amt, 0..1; a change of lane is always made at a walk).
export function laneIntent(x, y) {
  if (Math.abs(y) > STICK.vert && Math.abs(y) > Math.abs(x) * STICK.lean) return { kx: 0, ky: Math.sign(y), amt: 1 };
  return { kx: Math.sign(x), ky: 0, amt: Math.abs(x) };
}
