// The page around the picture: loading text, the dialogue box, the hint line, fades, the little "Saved" note and the
// start-up choice. Everything that touches the DOM outside the battle panel lives here.

export function createUI(doc) {
  const $ = id => doc.getElementById(id),
    el = { cv: $('cv'), stage: $('stage'), load: $('load'), dlg: $('dlg'), who: $('who'), say: $('say'), hint: $('hint'), opts: $('opts'), ov: $('ov'), fade: $('fade'), toast: $('toast'), title: $('title'), tmsg: $('tmsg'), tbtn: $('tbtn'), sub: $('sub') };
  let queue = null,
    qi = 0,
    typed = 0,
    after = null,
    toastT = 0;
  const show = () => {
    const [who] = queue[qi];
    el.who.textContent = who;
    el.who.style.display = who ? 'block' : 'none';
    el.say.textContent = '';
  };
  const ui = {
    $,
    el,
    // text over the stage while something loads; null takes it away
    loading(text) {
      if (text == null) el.load.classList.add('off');
      else {
        el.load.textContent = text;
        el.load.classList.remove('off');
      }
    },
    fail(text) {
      ui.loading(text);
      window.__err = text;
    },
    talking: () => !!queue,
    // show lines ([who, text] each) one at a time; cb when the last is dismissed
    say(lines, cb) {
      if (!lines.length) return cb && cb();
      queue = lines;
      qi = 0;
      typed = 0;
      after = cb || null;
      el.dlg.classList.remove('off');
      show();
    },
    // a tap: finish the line that is typing, or move on
    advance() {
      if (!queue) return;
      const full = queue[qi][1];
      if (typed < full.length) {
        typed = full.length;
        el.say.textContent = full;
        return;
      }
      qi++;
      if (qi >= queue.length) {
        queue = null;
        el.dlg.classList.add('off');
        const a = after;
        after = null;
        if (a) a();
        return;
      }
      typed = 0;
      show();
    },
    type(dt) {
      if (!queue) return;
      const full = queue[qi][1];
      if (typed < full.length) {
        typed = Math.min(full.length, typed + dt * 46);
        el.say.textContent = full.slice(0, Math.floor(typed));
      }
    },
    hint(text) {
      el.hint.textContent = text || '';
    },
    subtitle(text) {
      el.sub.textContent = text || '';
    },
    // fade to black, call mid (which may return a promise) while it is dark, fade back, then done
    fade(mid, done) {
      el.fade.classList.add('on');
      setTimeout(async () => {
        try {
          await mid();
        } catch (e) {
          ui.fail('Something went wrong: ' + ((e && e.message) || e));
        }
        setTimeout(() => {
          el.fade.classList.remove('on');
          setTimeout(() => done && done(), 320);
        }, 60);
      }, 340);
    },
    toast(text) {
      el.toast.textContent = text;
      el.toast.classList.add('on');
      clearTimeout(toastT);
      toastT = setTimeout(() => el.toast.classList.remove('on'), 1300);
    },
    // a question over the stage with a button per answer
    choose(text, answers, cb) {
      ui.loading(null);
      el.tmsg.textContent = text;
      el.tbtn.innerHTML = '';
      answers.forEach((a, i) => {
        const b = doc.createElement('button');
        b.textContent = a;
        b.addEventListener('click', () => {
          el.title.classList.add('off');
          cb(i);
        });
        el.tbtn.appendChild(b);
      });
      el.title.classList.remove('off');
    },
    // a place on the picture (-1..1) -> pixels inside the stage, for things laid over it
    toStage(p) {
      const r = el.cv.getBoundingClientRect(),
        s = el.stage.getBoundingClientRect();
      return [r.left - s.left - el.stage.clientLeft + (p[0] * 0.5 + 0.5) * r.width, r.top - s.top - el.stage.clientTop + (0.5 - p[1] * 0.5) * r.height];
    }
  };
  return ui;
}
