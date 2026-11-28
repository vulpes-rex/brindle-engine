// Seen side-on, a figure that has a side-view set (art/pixellab/<name>-side: drawn at eye level, in profile) is drawn from
// it when it faces along the lane, with a pose for what it is doing: running, standing still, rising, falling or just
// landed. Each is an animation of the character for its two profile facings (rows 2 and 6); the run is needed, the rest
// are optional. This picks the animation and the frame of it.
import { JUMP } from './jump.js';

export const POSE = {
  run: 10, // game units one cycle of the run covers
  land: 0.16, // seconds the landing pose is held after touching down
  idle: 7 // frames a second of the standing animation
};

// The pose of a body { air, vy, moving, dist, landed } at time `clock`, where len(name) is how many frames there are of an
// animation (0: none): { anim, k }.
//   rise  plays through once as the jump slows (its last frame is the top of the jump)
//   fall  plays through once as the fall quickens (its last frame is a long drop)
//   land  plays through once over POSE.land seconds
//   idle  loops while standing
//   run   by the ground covered; and whatever else is missing falls back to it (standing: its first frame)
export function sidePose(b, clock, len) {
  const frame = (name, t) => {
    const n = len(name);
    return n ? { anim: name, k: Math.max(0, Math.min(n - 1, Math.floor(t * n))) } : null;
  };
  const run = () => {
    const n = len('run');
    return { anim: 'run', k: n && (b.moving || b.air) ? Math.floor((b.dist || 0) / (POSE.run / n)) % n : 0 };
  };
  if (b.air) {
    const up = b.vy > 0,
      t = Math.min(1, Math.abs(b.vy) / JUMP.v);
    // (a set with only one of the two keeps to it: the top of the rise while falling, the start of the fall while rising)
    return (up ? frame('rise', 1 - t) || frame('fall', 0) : frame('fall', t) || frame('rise', 1)) || run();
  }
  const since = clock - (b.landed === undefined ? -9 : b.landed);
  if (since >= 0 && since < POSE.land) {
    const p = frame('land', since / POSE.land);
    if (p) return p;
  }
  if (!b.moving) {
    const n = len('idle');
    if (n) return { anim: 'idle', k: Math.floor(clock * POSE.idle) % n };
  }
  return run();
}

// Side-on, a figure faces along the lane or straight across it: the row (0 south, then clockwise) nearest a facing among
// right, left, away and toward (a diagonal goes to the side it leans to).
export const profile = row => (row === 0 || row === 4 ? row : row < 4 ? 2 : 6);
