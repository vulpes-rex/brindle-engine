// Little pixel-art icons for the menus, drawn as SVG: one character a pixel, '.' clear. Shared by the battle commands and
// the field menu.

const INK = {
  k: '#1a1430', // outline
  w: '#fff',
  s: '#c8d4e8', // steel
  y: '#ffd860', // gold
  b: '#8a5a3a', // wood
  t: '#d8a868', // leather
  o: '#a06a34', // dark leather
  p: '#c49cff', // Psynergy violet
  c: '#8ff0ff', // Psynergy cyan
  g: '#6ee08a', // tonic
  G: '#2f9a58',
  B: '#6aa8ff', // shield and coat
  N: '#2c4ab0',
  S: '#f0c4a0', // skin
  R: '#d04a5a', // journal
  r: '#ff8a8a'
};

const ICON = {
  attack: ['..........kk', '.........kwk', '........kwsk', '.......kwsk.', '......kwsk..', '..kk.kwsk...', '..kykwsk....', '...kysk.....', '..kbkyyk....', '.kbk.kyk....', 'kbk...kk....', 'kk..........'],
  skill: ['.....k.....', '....kck....', '....kck....', '...kpwpk...', '.kkpwwwpkk.', 'kcwwwwwwwck', '.kkpwwwpkk.', '...kpwpk...', '....kck....', '....kck....', '.....k.....'],
  item: ['...kkkkk...', '...kbbbk...', '....ksk....', '....ksk....', '...kswsk...', '..kgwgggk..', '.kgggggggk.', '.kgGgggggk.', '.kgGGgggGk.', '..kGGGGGk..', '...kkkkk...'],
  guard: ['kkkkkkkkkkk', 'kBBBBwBBBNk', 'kBBBBwBBBNk', 'kBBBBwBBBNk', 'kwwwwywwwwk', 'kBBBBwBBBNk', '.kBBBwBBNk.', '.kBBBwBBNk.', '..kBBwBNk..', '...kBwNk...', '....kkk....'],
  bag: ['....kkk....', '...kyyyk...', '....kyk....', '...kttttk..', '..kttttttk.', '.kttwttttok', '.ktttttttok', '.ktttttttok', '.kttttttook', '..kttttook.', '...kkkkkk..'],
  party: ['...kkk.....', '..kSSSk....', '..kSSSk.kkk', '...kkk.kSSS', '.kBBBBkkSSS', 'kBBBBBBkkk.', 'kBBBBBBkNNk', 'kBBBBBBkNNk', 'kBkBBkBkNNk', '.k.kk.k.kk.'],
  save: ['.kkkkkkkkk.', '.kRRRRRRRkk', '.kRyyyyyRkw', '.kRRRRRRRkw', '.kRRRRRRRkw', '.kRRRRRRRkw', '.kRRRRRRRkw', '.kRRRRRRRkw', '.kwwwwwwwkk', '.kkkkkkkkk.'],
  close: ['kk.....kk', 'krk...krk', '.krk.krk.', '..krkrk..', '...krk...', '..krkrk..', '.krk.krk.', 'krk...krk', 'kk.....kk']
};

export function icon(name) {
  const rows = ICON[name];
  if (!rows) throw new Error('Unknown icon: ' + name);
  let r = '';
  rows.forEach((line, y) => {
    for (let x = 0; x < line.length; ) {
      const c = line[x];
      let n = 1;
      while (line[x + n] === c) n++;
      if (c !== '.') r += '<rect x="' + x + '" y="' + y + '" width="' + n + '" height="1" fill="' + INK[c] + '"/>';
      x += n;
    }
  });
  return '<svg viewBox="0 0 ' + rows[0].length + ' ' + rows.length + '" shape-rendering="crispEdges" aria-hidden="true">' + r + '</svg>';
}

// a command tile (an icon over its label) and a list row (with a note on the right; sel marks the one picked), as the
// windows show them
export const tile = (name, attrs, label, off) => '<button class="tile" ' + attrs + (off ? ' disabled' : '') + '>' + icon(name) + '<span>' + label + '</span></button>';
export const row = (attrs, label, note, off, sel) =>
  '<button class="row' + (sel ? ' sel' : '') + '" ' + attrs + (off ? ' disabled' : '') + '><span>' + label + '</span>' + (note ? '<small>' + note + '</small>' : '') + '</button>';
