# Brindle engine

A small JRPG engine for the browser: 2D pixel sprites walking in 3D worlds drawn from splats. It grew out of the
Brindlebrook prototype and now runs a game from data. That game is **Underhymn** (working title): the Lastmade, an
angelic gatherer, is sent by the Answer to go down under the village of Lastlea and bring back the purest souls of the
land. The premise and the souls are written up in the project's story bible.

The playable slice is one soul, Wren:

- walk and talk in **Lastlea** (an area generated in the browser), where his story is told warmly,
- fight a wisp where it is met and a battle in the hall under the bluff, alone,
- go down the **Dark Stair** (a dungeon walked side-on, all platforming: pits, slabs that glide, planks that give way),
  where what was left behind tells his story otherwise,
- find the feather: his echo joins the party and lends a second jump, and fights beside her on the balcony,
- take the pilgrim road to the **Cathedral of the Answer** and offer him up or keep him; the village answers to each,
- and carry on from a save after closing the page.

The shore road still leads to **Lighthouse rock** (an area sculpted in Ink Studio and baked), which is no part of the story.

Everything the slice does is written as data in `game/`; `engine/` knows nothing about this particular game.

## Run it

```sh
npm install
npm run build        # checks the game data, writes dist/index.html and dist/packs/
npm run serve        # http://localhost:8080
npm test             # unit tests: scripts, saving, walk maps, effects, scenes, game data
npm run e2e          # plays the whole slice in a headless browser (with npm run serve running)
```

`npm run e2e` drives the Chrome installed on the machine through playwright-core, a dev dependency, at phone size. If
Chrome is somewhere unusual, point `CHROME` at it; `PLAYWRIGHT` picks another Playwright module; `SHOTS=dir` saves
screenshots along the way:

```sh
CHROME=/usr/bin/google-chrome SHOTS=/tmp/shots node test/e2e/slice.mjs http://localhost:8080/index.html
```

The build is a single page with its script inline, plus a `packs/` folder it fetches from. It runs from any static host.

## Layout

```
engine/            the runtime; plain ES modules, no dependencies
  game.js          front door: start(content). Areas, modes, scripts, saving, the frame loop
  field.js         walking, talking, using things
  battle.js        turn-based battles, played from data, and the battle camera
  fx.js            battle effects: glows, sparks, lightning, crystals, glyphs (pure; the gen look draws them)
  script.js        the script runner (pure; also checks scripts at build time)
  save.js          one save slot in the browser's storage (pure)
  nav.js           walk maps: blocked cells, ground height, routes
  look-gen.js      the "gen" look and its shaders (shaders-gen.js)
  look-ink.js      the "ink" look and its shaders (shaders-ink.js)
  gen/             the scene generator used by the gen look, and the kit of shapes scenes are built with
  monsters.js      decoding and skinning of baked monsters
  menu.js          the field menu: items, the party, saving
  icons.js         the little pixel-art icons the menus use
  sprites.js       the cast's sprite pack: eight facings, a walk, a knocked-out frame
  png.js, gl.js, ui.js
game/              one game: data and art only
  game.json        party, starting place, items (name, heal, about), which packs to fetch
  areas/*.json     an area: its look, people, things, exits, hints and scripts
  scenes/*.js      the generated scenes the gen areas are built from
  heroes.json, skills.json, monsters.json, foe-actions.json, battles.json
  art/sprites.js   the cast as first drawn by code (baked into the sprite pack when there is no generated art)
  index.html       the page shell
scenes/ink/        Ink Studio sources for the baked area and the monsters
scenes/gen/        generated scenes from the prototype that this game does not use; not bundled
art/pixellab/      the cast generated with PixelLab: prompts (cast.json) and the frames it made
packs/             baked output, committed, so a build does not need Ink Studio or PixelLab
tools/             build, content check, bakers, map printers, a static server
test/              unit tests, and e2e/ for the browser run
```

## Two looks

An area chooses how it is drawn with `"look"`.

**`gen`** areas are built in the browser by the scene generator (signed-distance scenes turned into soft round splats, with a
walk map and light map), from one of the game's scenes in `game/scenes/` named by `"scene"`. The camera is orthographic with
a fixed tilt and turns in eighths. A Pixel switch chooses between a pixel-art picture about 46 game units across and a large
smooth one. Both looks show their pixel art crisp at any screen size: in whole device pixels where those come close, and
with sharp-bilinear scaling where they do not, so every screen sees about as much of the world.

**`ink`** areas are sculpted with [Ink Studio](https://github.com/siliconjungle/shapeshift-labs-ink-studio) and baked by
`tools/bake-ink-area.cjs` into a pack: the dabs that can ever be seen, a table of colour by light level, and a walk map. The
engine draws the dabs into a buffer of who-is-in-front and colours it with a port of Ink Studio's pixel stage (smoothed
light, ramp or pattern colour, one-pixel cell edges, outlines, creases, light shafts, clean-up). It is always pixel art.
Ink Studio ships no browser viewport, so this drawing is the engine's own; against Ink Studio's offline renderer, a
standalone viewer built on the same shaders matched 96 to 98 percent of pixels at five test views.

The game itself never deals with the difference. It works in **game units** (one walk-map cell; a sprite pixel is 1/ppu of
one, where the sprite pack sets ppu and both looks draw the world at that scale, so sprites stay whole pixels) and asks the
current look four things: which way the camera faces (`axes`), where a point lands on the picture (`project`), what ground a
tap hits (`pick`), and to draw a list of sprites, shadows and rings (`draw`). An ink area names its `scale` (world units per
game unit) when baked; a gen area's scale is 1.

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

A foe can live on the map, as in Chrono Trigger: `"foes": [{ "id": "doorwisp", "type": "wisp", "at": [-18.5, 6.5],
"roam": 2.5, "battle": "doorwisp", "show": "!wisp" }]` (optionally `"sight"` and `"speed"`). It wanders about its place,
comes for the leader on seeing them, and where they meet its battle is fought on the spot: a battle marked `"here": true`
in `battles.json`, with no arena. The area stays on screen with its people (whoever wanders there steps out of the way),
the party runs out from its leader and the foe to its place, and the camera comes down from the field's view to the
battle's, Golden Sun's, and goes back up afterwards. `engine/ground.js` finds the ground: the battle's layout is drawn in
(the two sides 0.7 as far apart as in an arena, closer where it is tight) and set down where everyone has least far to go,
on free and level ground with no wall to go through. `"fight": { "from": [1, 0] }` tells an area's fights which side the
camera sits on (here the east: everything tall in Brindlebrook stands to the west); without it the party simply faces the
way it met the foe. Winning sets whatever the battle's `won` script sets (a flag the foe's `"show"` tests, to be rid of it
for good); losing puts the party back where it stood and sends the foe home for a while. Only generated areas can be
fought in. `test/ground.test.js` checks that each such foe can be fought wherever it may be met.

Side-on, an area can have jumping (a trial, after Castlevania by way of Valkyrie Profile): `"side": { "jump": true, ... }`.
Then the leader is a body that rises and falls (`engine/jump.js`): the ground is solid, a wall where it rises more than a
step (a cliff, a terrace's riser, a shelf of rock; not a stair or a hillside), and the scene's ledges can be stood on. A
scene gives its ledges as `this.ledges = [[x0, x1, z0, z1, y], ...]`, the flat tops of things it has built, in the area's
own units and in the order they are climbed; one lands on a ledge from above and passes up through it from below. A jump
tops out 5.2 up, a little over a body's height, and goes across at 8 a second, slower than a walk, so that a running jump
lands on a ledge and not past it; it counts if asked for just before landing or just after walking off an edge. A lane or column that runs over ledges or up a cliff is marked `"ledge": true`, and the arrows that
change lane are offered only where the change can be walked from the height one is at. From up a climb the view cannot be
changed nor the game saved: the other views walk the ground only. `test/jump.test.js` checks the jumping, and that an
area's ledges can be climbed one from another on its real ground, with headroom between them, to whatever is at the top.

A ledge may do something, said in a sixth entry: `{ move: [axis, reach, period, phase] }` glides it to and fro along
`'x'`, `'y'` or `'z'` (a slab over a chasm, a lift), carrying whoever stands on it; `{ crumble: seconds, back: seconds }`
lets it fall away under whoever stands on it and come back later. They go by the area's own clock, which stops with the
game. Such ledges are not built into the scene: the area names a mesh for each kind, `{ "mesh": "slab", "part": "move" }`
and `{ "mesh": "plank", "part": "crumble" }` (5 by 5, top at 0, about their own middle), and the field draws one where each
ledge is at the moment. `"side": { "double": "flag" }` gives the leader a second jump in the air once that flag is set
(0.9 of the first, so two rise 9.5), and `"kill": height` says how far down is out of the world: fallen below it the leader
is gone for a moment and then stands, flickering, on the last firm ground (the ground itself, level for 1.2 each way). A
walk asked for with a tap stops short of such a drop; a push of the stick does not. Coming down, a ledge whose top is
within 0.35 above the feet is still landed on, so a gap of a unit between two ledges is run across. Ground comes as heights
half a unit apart with slopes between, so a cliff would be a ramp half a unit long, something to land on half-way up: where
the ground differs by more than 3 within half a unit its face counts as its foot, and a cliff is upright.

An area may be seen side-on and no other way, `"side": { "only": true }` (it needs its `"world"` mesh): the view button is
not offered there and the choice it holds is kept for the areas that have one; any ground is somewhere to stand and to take
a save up again. `"roll": 0` makes the ground flat instead of rolling away, `"sky": "cave"` puts rock behind it instead
of an evening sky, and `"ceil": height` stops the camera following the leader higher than that (a wall goes only so high). The Dark Stair (`game/areas/darkstair.json`, `game/scenes/darkstair.js`) is such an area; its scene
says, in `mesh`, how the mesh that stands in for it is made: in blocks (each cell of the ground flat, an upright face
wherever two neighbours differ, tiled in step with the world), lit dimly (`amb`) and by its torches (a mesh is lit by the
six lamps nearest where the camera looks, and a thing standing in a scene by the six nearest itself).
`test/course.test.js` plays such an area through on its real ground, as someone would who walks, jumps where the floor
ends and waits for what moves: every pit is cleared from a unit short of its edge, the jump between the gliding slabs is
on for a good part of each round and not all of it, the planks leave time to cross, and what the second jump is for
cannot be reached without it.

Side-on, a controller is drawn on the picture (`engine/stick.js`, and the pad in `engine/game.js`): an analog stick on the
left, which walks as hard as it is pushed (a dead middle, full pace at the rim) and, pushed well up or down, changes lane;
and on the right A, which jumps where there is jumping, and B, the act button, which walks up to and talks to or uses
whatever is nearest (the field rings it). From part-way along a column a push across heads for the nearest lane that runs
that way. A real controller does the same in any view through the Gamepad API (left stick or d-pad, A, and B or X), walks
any way over open ground in the top-down views, takes talk on and answers what is asked; battles are still tapped. A
keyboard has the arrows, the space bar to jump and E to act.

An area that can be seen side-on (the Side view trial) may say which lines are walked there, after Another Eden:
`"side": { "hint": "...", "lanes": [{ "name": "road", "x": 0, "z": [-55, 29.5] }], "columns": [{ "name": "south", "z": -40.5, "x": [-13, 26.5] }] }`.
A lane holds `x` and runs along `z`, across the picture; a column holds `z` and runs along `x`, into it. In that view the
leader keeps to these lines: a tap walks along the lane one is on, and the arrows drawn where a column meets it (or the up
and down keys, or a swipe) change lane. From any other view the ground is free as before. `test/lanes.test.js` checks that
every line is walkable, that they all join up, and that each person and thing can be reached from one.

A script is a list of steps:

| step | what it does |
| --- | --- |
| `["Name", "Text"]` | a line of speech; an empty name is narration; lines in a row are one conversation |
| `{"case": [[cond, script], ..., [null, script]]}` | the first branch whose condition holds |
| `{"if": cond, "then": script, "else": script}` | |
| `{"set": "flag"}`, `{"unset": "flag"}` | story flags |
| `{"give": "item", "n": 2}` | add to (or with a negative `n`, take from) what the party carries |
| `{"battle": "id"}` | fight (a battle with an arena); the battle's own `won` / `lost` script runs afterwards |
| `{"go": "area", "at": "spawn"}` | travel to another area |
| `{"choose": [["Answer", script], ["Answer", script, cond]]}` | ask: the line just before is the question and stays up while the answers are offered; each answer runs its own script, and one with a condition is offered only while it holds |
| `{"stop": true}` | end the script |

A condition is a flag (`"key"`), its negation (`"!key"`), `{"all": [...]}`, `{"any": [...]}` or `{"has": "item", "n": 1}`.
The engine sets one flag itself: `moved`, the first time the leader walks.

**The party is read off the flags** (`engine/party.js`); nothing of it is saved by itself. In `game.json`, `"party"`
lists heroes: one written `{ "id": "wren", "if": { "all": ["feather", "!offered"] } }` is in it only while the condition
holds (the first is the leader and is always in it). In `heroes.json`, `"boons": [{ "if": "offered", "mhp": 40, "atk": 4 }]`
adds to a hero's numbers while a condition holds, `"tint": [r, g, b]` colours their sprite, and `"halo": true` gives them
a thin ring of light over their head, in the field and in battle (neither is used now that the Lastmade and Wren have
sprites of their own, but both remain for a stand-in). So a story choice
is a flag, and who fights, how strong they are and what people say all follow from it.

The Menu button (or M, or Esc) opens the field menu over the picture, in the same blue windows as the battles, and the
world holds still while it is open. It shows what the party carries (an item's `about`, or what it heals), each hero's
portrait, stats and skills (a skill's `about`, or whom it aims at), and saves.

Battles are data too. A skill or foe action is a move plus timed hits:

```json
"spark": { "name": "Spark", "mp": 4, "target": "foe", "move": ["step", 1.4], "dur": 1.9, "cast": "#b48cff",
           "text": "{user} calls a Spark down on the {target}!",
           "hits": [{ "at": 0.75, "fx": "bolts", "color": "#b48cff", "screen": 0.35 },
                    { "at": 0.95, "power": 1.5, "magic": true, "flash": [0.75, 0.55, 1] }] }
```

Battles are shown the way Golden Sun shows its own. The camera sits low behind the party with the foes up and to the left,
and swings to whoever acts, then to what they act on. An action with a `cast` colour has its user gather power (a turning
glyph underfoot, a column of light, rising sparks) until its first hit, and the scene dims while it plays out. A hit's `fx`
is one of the engine's effects, tinted by `color`: `slash`, `burst`, `bolts` (lightning and crystals of light), `heal`
(a column, falling sparkles, rising rings), `ward`, `shard` (a bolt from the user), or `quake` and `hum`, which play once
for all the targets. `screen` flashes the whole picture and `flash` tints the one hit. Blows with no effect of their own
get a small spray of sparks; a beaten foe flickers, flares and comes apart. The panel uses Golden Sun's blue windows too:
a status window for each hero over the top of the picture, a message window, and commands as pixel-art icons.

The build refuses data that points at something missing (an unknown item, spawn, sprite, battle, skill, effect, scene or pack file).

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

The cast's sprites are a pack too (`packs/sprites`: `sheet.png` and `sheet.json`), baked by `tools/bake-sprites.mjs` from the
art PixelLab generated (`art/pixellab/<name>/`) or, for anyone without it, from the cast drawn by code. Generating needs a
PixelLab account and its API token, in `PIXELLAB_API_KEY` or a file `.pixellab-token` (which git ignores):

```sh
node tools/pixellab.mjs balance                      # what the account has left
node tools/pixellab.mjs make hero guard              # a character in 8 directions with an 8-way walk, from art/pixellab/cast.json
node tools/pixellab.mjs animate hero guard           # its battle animations: idle, attack, cast and hurt
node tools/bake-sprites.mjs                          # bake the pack (--code: the drawn cast only; --ppu n: the scale)
```

The Lastmade and Wren were made another way: through PixelLab's connector, in its Pro mode, each designed from its concept
art and in the style of an existing character (Tam for her, Pip for him), then animated there. Their walk is PixelLab's V3
walking action, which starts from the standing sprite (the walk template redrew her without her cape, sword and bell);
their battle animations are custom actions. A few things PixelLab left out were put back by hand: her halo and pauldron
in the frames that see her from behind, the feather in Wren's front view. Their frames sit in `art/pixellab/lastmade/` and
`art/pixellab/wren/` like the rest, with a `meta.json` saying how each was made and what was fixed. A character with a
`"scale"` in `art/pixellab/cast.json` (Wren, a child: 0.74) is drawn that much smaller by the game, from art the same size
as everyone's.

A walk may have more frames than the rest of the cast's (theirs has eight, the others six) and may be drawn on a larger
canvas than the standing sprite: the baker cuts it to the standing sprite's width and gives that character's cells more
rows where a step lifts the head past the standing canvas, so nothing is cut off.

**Side-view sets.** A character may also have a side-view set, a folder `art/pixellab/<name>-side/`: drawn at eye level, in
profile, for the views that look at the world side-on (the Side view, and areas that are side-on only). The baker adds its
two profile facings, east and west, to `<name>` as animations: `run` (its `walk/<direction>/` frames) and whichever of
`idle`, `rise`, `fall` and `land` it has in `anims/`. Side-on, a leader who has them is drawn from them whenever she faces
along the lane (`engine/pose.js`): standing she breathes, pushed she runs, going up she plays `rise` through once as the
jump slows, coming down `fall` as the fall quickens, and touching down she holds `land` for a moment. Facing toward or
away from the camera (changing lane), and in every other view, she is her usual sprite. `rise` and `fall` are poses in the
air: their frames must be drawn with the figure centred on where it stands, because the game moves a jumping figure itself;
the baker takes the ground under them from the set's standing sprite. The Lastmade has such a set: a run, an idle, and one
PixelLab jump animation whose frames were sorted into rise, fall and land (`art/pixellab/lastmade-side/meta.json`).

Battle animations are drawn only for the facings a battle shows (north and north-west: the camera sits behind the party),
from cast.json's `battle` prompts, each character's own where it has them. In a fight the party breathe while they wait,
swing as a blow lands, raise their hands or staff while gathering power (and when using an item), and flinch when hit; any
facing without an animation falls back to the standing frame.

The prompts follow one art direction: Xenogears-era field sprites (soft painted shading, no black outlines) in fantasy class
costumes. The baker makes sure of the outlines: a near-black line pixel takes a deep shade of the colour beside it.

The walk map of an ink area is worked out from the dabs: ground is the lowest seen, up-facing, dry surface in a column,
climbed up small steps; a column is an obstacle when something stands in body height above it; a cell is blocked when it has
no ground, holds an obstacle, or steps too far to its neighbour.

### Sculpting for the game's camera

The game draws 9 pixels to a game unit: 180 to a world unit of Lighthouse rock, where the diorama itself was sculpted at 34. Seen
that close, a diorama is large flat patches. Its sizes are right (a character stands 6.4 game units, 0.32 world units there,
and the keeper's door is 0.34 tall); what it lacks is detail. The keeper's house and yard (`scenes/ink/lighthouse.cjs`,
"sculpted for the game camera") show how to give it some: dabs laid about 2.5 times closer (`res` of a third of a diorama
pixel, and a `px` of half a diorama pixel handed to `S.window`, `S.door`, `S.barrel`, `S.crate` and `S.canopy`), patterns
with cells of 1 to 4 diorama pixels (`tile: [2, 2]`, `stone: [3, 2]`, `width: 1`, a lawn with `cell: 2`), and more small
things a screen: a timber frame on the walls, a well, a kitchen garden, pots, a lamp post. That patch added about three
tenths to the area's dabs.

Two things the baker needs to know about such a place:

- On the walk map anything up to 0.095 world units high is a step (that is what lets the party climb the stairs), so low
  things standing together are climbed like a stair: flowers beside a fence's rails, a pot, the frame of a garden bed. A
  scene marks the places it furnished this closely with `W.navFine = [{ at: [x, z], r, step, low }]` (world units): inside
  one, a step is `step` high and anything standing `low` above the ground blocks. Keep stairs outside them.
- A pack holds 31 ramps at most (a dab's ramp shares a byte with its flags). The baker stops if a scene uses more: give
  materials that share colours the same `r`.

## What is not here yet

- Only the keeper's yard on Lighthouse rock has the detail the close camera wants; the rest of the islet is still a diorama
  seen close.

- Offering or keeping a soul changes the party, her strength and what Lastlea says. The Answer's favour cooling is not played yet.
- No shops or sound.
- A fall in the Dark Stair costs nothing but the ground lost, and there is nothing to fight down there yet.
- Only the Lastmade has a side-view set. Anyone else, and she too when facing toward or away from the camera, is drawn mid-stride in the air.
- Items can only be used in battle: HP and MP are full again at the start of every fight, so there is nothing to mend
  in the field.
- Battles are only drawn by the gen look; monsters are not drawn in ink areas.
- The ink look redraws every dab whenever the camera moves; it has no culling yet.
- One save slot.

## Tested

Unit tests cover scripts, saving, walk maps and the game data. The end-to-end run plays the slice in headless Chrome at
phone size, including real taps, both looks, a reload and Continue, and a full battle. That browser draws in software:
nothing here has been run on a real phone, so frame rates on one are unknown.

## Credits

See [THIRD-PARTY.md](THIRD-PARTY.md). The cast's sprites were generated with PixelLab from this project's own prompts
(`art/pixellab/cast.json`); the first drawn cast, the scenes and the writing are original to this project.
