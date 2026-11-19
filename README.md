# Brindle engine

A small JRPG engine for the browser: 2D pixel sprites walking in 3D worlds drawn from splats. It grew out of the
Brindlebrook prototype and now runs that game from data.

Milestone 1 is one thin playable slice:

- walk and talk in **Brindlebrook** (an area generated in the browser),
- take the shore road, a door between areas, to **Lighthouse rock** (an area sculpted in Ink Studio and baked),
- climb to the keeper, row back,
- fight one battle under the bluff,
- and carry on from a save after closing the page.

Everything the slice does is written as data in `game/`; `engine/` knows nothing about this particular game.

## Run it

```sh
npm install
npm run build        # checks the game data, writes dist/index.html and dist/packs/
npm run serve        # http://localhost:8080
npm test             # unit tests: scripts, saving, walk maps, game data
```

`npm run e2e` plays the whole slice in a headless browser. It needs Playwright and Chrome, which are not installed by
`npm install`; point `PLAYWRIGHT` at the module and `CHROME` at the binary if they are not found:

```sh
PLAYWRIGHT=/path/to/playwright CHROME=/usr/bin/google-chrome node test/e2e/slice.mjs http://localhost:8080/index.html
```

The build is a single page with its script inline, plus a `packs/` folder it fetches from. It runs from any static host.

## Layout

```
engine/            the runtime; plain ES modules, no dependencies
  game.js          front door: start(content). Areas, modes, scripts, saving, the frame loop
  field.js         walking, talking, using things
  battle.js        turn-based battles, played from data
  script.js        the script runner (pure; also checks scripts at build time)
  save.js          one save slot in the browser's storage (pure)
  nav.js           walk maps: blocked cells, ground height, routes
  look-gen.js      the "gen" look and its shaders (shaders-gen.js)
  look-ink.js      the "ink" look and its shaders (shaders-ink.js)
  gen/             the scene generator used by the gen look, and the kit of shapes scenes are built with
  monsters.js      decoding and skinning of baked monsters
  png.js, gl.js, ui.js
game/              one game: data and art only
  game.json        party, starting place, items, which packs to fetch
  areas/*.json     an area: its look, people, things, exits, hints and scripts
  scenes/*.js      the generated scenes the gen areas are built from
  heroes.json, skills.json, monsters.json, foe-actions.json, battles.json
  art/sprites.js   the sprite sheet, drawn by code
  index.html       the page shell
scenes/ink/        Ink Studio sources for the baked area and the monsters
scenes/gen/        generated scenes from the prototype that this game does not use; not bundled
packs/             baked output, committed, so a build does not need Ink Studio
tools/             build, content check, bakers, map printers, a static server
test/              unit tests, and e2e/ for the browser run
```

## Two looks

An area chooses how it is drawn with `"look"`.

**`gen`** areas are built in the browser by the scene generator (signed-distance scenes turned into soft round splats, with a
walk map and light map), from one of the game's scenes in `game/scenes/` named by `"scene"`. The camera is orthographic with
a fixed tilt and turns in eighths. A Pixel switch chooses between a small buffer shown in whole device pixels and a large
smooth one.

**`ink`** areas are sculpted with [Ink Studio](https://github.com/siliconjungle/shapeshift-labs-ink-studio) and baked by
`tools/bake-ink-area.cjs` into a pack: the dabs that can ever be seen, a table of colour by light level, and a walk map. The
engine draws the dabs into a buffer of who-is-in-front and colours it with a port of Ink Studio's pixel stage (smoothed
light, ramp or pattern colour, one-pixel cell edges, outlines, creases, light shafts, clean-up). It is always pixel art.
Ink Studio ships no browser viewport, so this drawing is the engine's own; against Ink Studio's offline renderer, a
standalone viewer built on the same shaders matched 96 to 98 percent of pixels at five test views.

The game itself never deals with the difference. It works in **game units** (one walk-map cell; a sprite pixel is a fifth of
one) and asks the current look four things: which way the camera faces (`axes`), where a point lands on the picture
(`project`), what ground a tap hits (`pick`), and to draw a list of sprites, shadows and rings (`draw`). An ink area names
its `scale` (world units per game unit) when baked; a gen area's scale is 1.

## Writing the game

An area file, trimmed:

```json
{
  "name": "Lighthouse rock",
  "look": "ink",
  "pack": "packs/lighthouse",
  "camera": { "pitch": 0.62, "dist": 8, "yaw": 0.7 },
  "spawns": { "jetty": { "at": [3.1, 1.4], "face": [-1, 0] } },
  "actors": [{ "id": "keeper", "sprite": "keeper", "name": "Keeper Ansel", "at": [0.6, 0.86], "script": "keeper" }],
  "props": [{ "id": "boat", "at": [3.1, 1.92], "y": 0.1, "h": 2.5, "r": 4, "script": "boat", "icon": "exit" }],
  "hints": [["oil", "The rowboat goes back."], [null, "Tap the ground to walk."]],
  "scripts": {
    "boat": [["", "You row back to the shore road."], { "go": "brindlebrook", "at": "gate" }]
  }
}
```

Places are either `"at"` (the area's own world units) or `"poi"` (a named place a generated scene exports).

A script is a list of steps:

| step | what it does |
| --- | --- |
| `["Name", "Text"]` | a line of speech; an empty name is narration; lines in a row are one conversation |
| `{"case": [[cond, script], ..., [null, script]]}` | the first branch whose condition holds |
| `{"if": cond, "then": script, "else": script}` | |
| `{"set": "flag"}`, `{"unset": "flag"}` | story flags |
| `{"give": "item", "n": 2}` | add to (or with a negative `n`, take from) what the party carries |
| `{"battle": "id"}` | fight; the battle's own `won` / `lost` script runs afterwards |
| `{"go": "area", "at": "spawn"}` | travel to another area |
| `{"stop": true}` | end the script |

A condition is a flag (`"key"`), its negation (`"!key"`), `{"all": [...]}`, `{"any": [...]}` or `{"has": "item", "n": 1}`.
The engine sets one flag itself: `moved`, the first time the leader walks.

Battles are data too. A skill or foe action is a move plus timed hits:

```json
"spark": { "name": "Spark", "mp": 4, "target": "foe", "move": ["step", 1.4], "dur": 0.95,
           "text": "{user} calls a Spark down on the {target}!",
           "hits": [{ "at": 0.36, "power": 1.5, "magic": true, "fx": "burst", "color": "#7ff" }] }
```

The build refuses data that points at something missing (an unknown item, spawn, sprite, battle, skill, scene or pack file).

### Generated scenes

A gen area names a scene: `"scene": "brindlebrook"` is `game/scenes/brindlebrook.js`, handed to the engine by `game/main.js`. A
scene is a function that takes the generator's kit (the grid, noise, shapes such as `box`, `cyl`, `cap` and `crag`, and a few
shared props) and returns its ground, its materials and a `build` that places everything:

```js
export default function (K) {
  const { C, G0, pillar } = K;
  return {
    name: 'Cellar', bg: [10, 13, 24], LD: [-0.4, 0.75, -0.52], amb: [0.31, 0.35, 0.5], sun: [0.66, 0.72, 0.95],
    level: null,                                      // no water
    pv: [0.04, 0.5, 0.03], pcol: [120, 255, 226], pn: 26,  // drifting motes: speed, colour, how many
    foot: (x, z) => Math.hypot(x - C, z - C) - 33,    // the footprint: negative inside
    h: (x, z) => G0 + 1,                              // ground height
    bot: (x, z) => G0 - 6,                            // the underside
    top: () => 97, side: () => 98,                    // materials of the ground's top and sides
    build() { this.lights = []; pillar(C - 13, C + 21, G0 + 1, 13); }
  };
}
```

The generator runs in a Web Worker and receives the scene as text, so a scene must be self-contained: it may use only what it
takes from `K`, never an import or anything else in its module. `npm test` runs every scene in `game/scenes/` that way. A
scene with `walk: true` gets a walk map, and its `poi` are the named places areas can put people and things at.

`scenes/gen/` keeps the prototype's other scenes (a lighthouse, a desert oasis, a shipwreck, clockworks and more). They are
not part of this game or its build; copy one into `game/scenes/` to use it, or look at it with `tools/genmap.mjs`.

## Baking

Baking needs a checkout of Ink Studio; it is not a dependency of the engine or the build.

```sh
node tools/bake-ink-area.cjs <ink-studio dir> scenes/ink/lighthouse.cjs packs/lighthouse 0.05 [debug-map.png]
node tools/bake-monsters.cjs <ink-studio dir> packs/monsters.json
node tools/navcheck.cjs packs/lighthouse 1.0,0.5,4.1,1.75 3.1,1.4 0.6,0.86   # print the walk map, check routes
node tools/genmap.mjs game/scenes/brindlebrook.js                            # places and walk map of a generated scene
```

The walk map of an ink area is worked out from the dabs: ground is the lowest seen, up-facing, dry surface in a column,
climbed up small steps; a column is an obstacle when something stands in body height above it; a cell is blocked when it has
no ground, holds an obstacle, or steps too far to its neighbour.

## What is not here yet

- No menus, inventory screen, choices in dialogue, shops or sound.
- Battles are only drawn by the gen look; monsters are not drawn in ink areas.
- The ink look redraws every dab whenever the camera moves; it has no culling yet.
- One save slot.

## Tested

Unit tests cover scripts, saving, walk maps and the game data. The end-to-end run plays the slice in headless Chrome at
phone size, including real taps, both looks, a reload and Continue, and a full battle. That browser draws in software:
nothing here has been run on a real phone, so frame rates on one are unknown.

## Credits

See [THIRD-PARTY.md](THIRD-PARTY.md). All sprites, scenes and writing are original to this project.
