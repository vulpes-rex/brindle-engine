// Timed hits: a press as a blow lands makes it count for more. A hero's blow struck on time hits harder; a foe's blow met on
// time hurts less. The press has to come shortly before the blow (the picture shows a ring closing on the target), and a
// press too soon after another does not count and puts the next one off too, so hammering the screen gains nothing.
// Pure: the battle feeds it the clock.
export const TIMED = {
  early: 0.3, // a press this long before the blow still counts
  sharp: 0.12, // and within this it is a sharp one
  lock: 0.35, // presses closer together than this spoil each other
  hit: [1, 1.25, 1.5], // a hero's blow: untimed, good, sharp
  block: [1, 0.75, 0.5], // a foe's blow on a hero
  word: ['', 'Good!', 'Sharp!'],
  cue: 0.5 // how long before the blow the ring starts to close
};

export function createTimed() {
  let at = -9,
    spent = true;
  return {
    // a press at time t
    press(t) {
      spent = t - at < TIMED.lock;
      at = t;
    },
    // a blow lands at time t: 0 untimed, 1 good, 2 sharp. A press is used up by the blow it times.
    grade(t) {
      if (spent) return 0;
      const d = t - at;
      if (d < 0 || d > TIMED.early) return 0;
      spent = true;
      return d <= TIMED.sharp ? 2 : 1;
    },
    reset() {
      at = -9;
      spent = true;
    }
  };
}

// what a blow of v does once timed: more from a hero, less to one; never under 1
export const timedDamage = (v, grade, byHero) => Math.max(1, Math.round(v * (byHero ? TIMED.hit : TIMED.block)[grade]));
