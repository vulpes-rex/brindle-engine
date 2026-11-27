// The game: its data and its art, handed to the engine. Nothing here is code the engine depends on.
import { start } from '../engine/game.js';
import game from './game.json';
import brindlebrook from './areas/brindlebrook.json';
import underhall from './areas/underhall.json';
import darkstair from './areas/darkstair.json';
import cathedral from './areas/cathedral.json';
import lighthouse from './areas/lighthouse.json';
import heroes from './heroes.json';
import skills from './skills.json';
import monsters from './monsters.json';
import foeActions from './foe-actions.json';
import battles from './battles.json';
import brindlebrookScene from './scenes/brindlebrook.js';
import underhallScene from './scenes/underhall.js';
import darkstairScene from './scenes/darkstair.js';
import cathedralScene from './scenes/cathedral.js';

start({
  game,
  areas: { brindlebrook, underhall, darkstair, cathedral, lighthouse },
  scenes: { brindlebrook: brindlebrookScene, underhall: underhallScene, darkstair: darkstairScene, cathedral: cathedralScene },
  heroes,
  skills,
  monsters,
  foeActions,
  battles
});
