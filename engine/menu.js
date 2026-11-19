// The field menu, in the battle's blue windows over the picture: what the party carries, who they are, and saving. The
// world holds still while it is open. Everything shown comes from the game's data: items (name, about, heal), heroes
// (name, sprite, stats, skills) and skills (name, mp, target, about).
import { tile, row } from './icons.js';

const AIM = { foe: 'One foe', foes: 'Every foe', ally: 'One ally', self: 'Themself' };

export function createMenu(g, save) {
  const ui = g.ui,
    el = ui.$('menu'),
    SP = g.SP,
    faces = {};
  let tab = 'items',
    sel = 0, // the item or hero picked
    skill = -1; // the skill picked on the party page

  const items = () => {
      const all = g.content.game.items || {};
      return Object.keys(g.items)
        .filter(id => g.items[id] > 0 && all[id])
        .map(id => Object.assign({ id, n: g.items[id] }, all[id]));
    },
    heroes = () => g.content.game.party.map(id => Object.assign({ id }, g.content.heroes[id])),
    aboutItem = it => it.about || (it.heal ? 'Restores ' + it.heal + ' HP.' : ''),
    aboutSkill = s => s.about || AIM[s.target] || '';

  // a hero's portrait: head and shoulders of the front-facing standing frame from the sprite sheet, as an image (made once),
  // shown at whole multiples of its pixels
  function face(sprite) {
    if (faces[sprite]) return faces[sprite];
    const [x0, y0, w] = SP.frame(SP.names.indexOf(sprite), 0, false, 0),
      top = Math.max(0, SP.SH + SP.offY - SP.tall - 1),
      tall = Math.round(SP.tall * 0.66),
      k = Math.max(1, Math.round(48 / w)),
      c = document.createElement('canvas'),
      img = new ImageData(w, tall);
    c.width = w;
    c.height = tall;
    for (let y = 0; y < tall; y++) {
      const from = ((y0 + top + y) * SP.w + x0) * 4;
      img.data.set(SP.data.subarray(from, from + w * 4), y * w * 4);
    }
    c.getContext('2d').putImageData(img, 0, 0);
    return (faces[sprite] = '<img class="face" alt="" style="width:' + w * k + 'px;height:' + tall * k + 'px" src="' + c.toDataURL() + '">');
  }

  function render() {
    const tabs =
      tile('bag', 'data-m="items"', 'Items') + tile('party', 'data-m="party"', 'Party') + tile('save', 'data-m="save"', 'Save') + tile('close', 'data-m="close"', 'Close');
    let body = '',
      note = '';
    if (tab === 'items') {
      const list = items();
      if (!list.length) body = '<p class="mnone">You carry nothing.</p>';
      else {
        sel = Math.min(sel, list.length - 1);
        body = list.map((it, k) => row('data-i="' + k + '"', it.name, '×' + it.n, false, k === sel)).join('');
        note = aboutItem(list[sel]);
      }
    } else {
      const hs = heroes(),
        h = hs[Math.min(sel, hs.length - 1)],
        stat = (k, v) => '<span><i>' + k + '</i>' + v + '</span>';
      body =
        '<div class="mwho">' + hs.map((x, k) => '<button class="chip' + (x === h ? ' sel' : '') + '" data-h="' + k + '">' + face(x.sprite) + x.name + '</button>').join('') + '</div>' +
        '<div class="mstat">' + stat('HP', h.mhp) + stat('MP', h.mmp) + stat('Attack', h.atk) + stat('Magic', h.mag || h.atk) + stat('Defence', h.def) + stat('Resist', h.mdf) + stat('Speed', h.spd) + '</div>' +
        '<div class="mskills">' + h.skills.map((id, k) => row('data-s="' + k + '"', g.content.skills[id].name, g.content.skills[id].mp + ' MP', false, k === skill)).join('') + '</div>';
      note = skill >= 0 && h.skills[skill] ? aboutSkill(g.content.skills[h.skills[skill]]) : 'Tap a skill to read about it.';
    }
    el.innerHTML = '<div class="gs mtabs" data-on="' + tab + '">' + tabs + '</div><div class="gs mbody">' + body + '</div><div class="gs mnote" role="status">' + note + '</div>';
    const on = el.querySelector('.mtabs [data-m="' + tab + '"]');
    if (on) on.classList.add('on');
  }

  const m = {
    open: false,
    // only in the field, between scripts
    canOpen: () => g.mode === 'field' && !g.busy && !ui.talking(),
    show() {
      if (m.open || !m.canOpen()) return false;
      m.open = true;
      tab = 'items';
      sel = 0;
      skill = -1;
      render();
      el.classList.remove('off');
      const b = el.querySelector('.mtabs button');
      if (b) b.focus({ preventScroll: true });
      return true;
    },
    hide() {
      if (!m.open) return;
      m.open = false;
      el.classList.add('off');
      el.innerHTML = '';
    },
    toggle: () => (m.open ? m.hide() : m.show())
  };

  el.addEventListener('click', e => {
    if (e.target === el) return m.hide(); // the dimmed picture around the windows
    const b = e.target.closest('button');
    if (!b) return;
    const d = b.dataset;
    if (d.m === 'close') return m.hide();
    if (d.m === 'save') {
      m.hide();
      if (!save(true)) ui.toast('Not just now');
      return;
    }
    if (d.m) {
      tab = d.m;
      sel = 0;
      skill = -1;
    } else if (d.i !== undefined) sel = +d.i;
    else if (d.h !== undefined) {
      sel = +d.h;
      skill = -1;
    } else if (d.s !== undefined) skill = +d.s;
    render();
    const again = el.querySelector(d.m ? '.mtabs [data-m="' + d.m + '"]' : '.sel');
    if (again) again.focus({ preventScroll: true });
  });
  return m;
}
