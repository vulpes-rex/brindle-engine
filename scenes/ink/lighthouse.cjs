// Lighthouse rock, rebuilt as an Ink Studio scene (sculpt -> bake -> finish). The layout is ported from our own HD scene at one
// tenth scale: islet in tiers, striped lighthouse, keeper's house, shed, wall, steps, jetty, two boats, buoy, sea stacks, bent tree.
// The keeper's house and its yard are the exception: they are sculpted for the game's camera, at the hero's size (see there).
module.exports = ({ KIT: K, makeBuilder, makeSculpt }) => ({
  id: 'lighthouse-rock',
  name: 'Lighthouse rock',
  seed: 5,
  build(seed) {
    const PAL = [
      0x0a0e1c,
      0x1b2233, 0x2c3650, 0x44506e, 0x66728c, 0x8f98ab, // 1-5 rock
      0x16302c, 0x245040, 0x3a7a4c, 0x6aa85a, // 6-9 grass
      0x0d1a33, 0x13294a, 0x1b3f66, 0x2c6288, 0x5a9fb4, 0xbfe6e6, // 10-15 sea, glint, foam
      0x4a5372, 0x8088a6, 0xc4c4d2, 0xf2ead8, // 16-19 plaster
      0x4a1626, 0x8a2230, 0xc8383a, 0xee6a4e, // 20-23 red
      0x2a1c1e, 0x4c3028, 0x7a4e34, 0xa87648, // 24-27 wood
      0xe08a2e, 0xffc65a, 0xfff0b8, // 28-30 lamp light
      0x6e6452, 0xa89a74, // 31-32 sand
      0x1e3a44, 0x2f6068, 0x4f9390, // 33-35 copper green
      0x1e1e23, 0x36322c, 0x584f38, 0x857348, 0xc2a65d // 36-40 the beam against the night sky, faint to bright
    ];
    const B = makeBuilder(seed, PAL),
      S = K.sculpt(makeSculpt(B)),
      DETAIL = 34,
      TAU = Math.PI * 2,
      YAW = 0.7;
    S.pixelSize(DETAIL);
    S.pixel = true;
    S.wob = 0;
    S.amb = 0.2;
    S.sky = 0.26;
    S.sunK = 0.62;
    S.sun = K.V.norm([-0.5, 0.62, 0.6]);
    const px = S.px,
      fine = { res: px * 0.8 },
      thin = { res: px * 0.6 },
      rock = { r: [1, 2, 3, 4, 5] },
      moss = { r: [6, 7, 8] },
      leaf = { r: [6, 7, 8, 9] },
      lawn = K.pixel.lawn({ r: [6, 7, 8, 9], tufts: 0.24, flowers: [[19, 0.02], [23, 0.012]] }),
      plaster = { r: [16, 17, 18, 19] },
      red = { r: [20, 21, 22, 23] },
      stone = K.pixel.masonry({ r: [1, 2, 3, 4], stone: [7, 4] }),
      wood = { r: [24, 25, 26, 27] },
      boards = along => K.pixel.planks({ r: [24, 25, 26, 27], width: 3, along }),
      tiles = K.pixel.tiles({ r: [20, 21, 22], tile: [5, 4] }),
      dark = { r: [1, 1, 2] },
      copper = { r: [33, 34, 35] },
      lit = { r: [29, 30], em: true },
      amber = { r: [28, 29], em: true },
      unlit = { r: [10, 11, 12] },
      sand = { r: [31, 32, 32] },
      white = { r: [17, 18, 19] };
    const F = yaw => B.frame(-yaw, 0, 0),
      bx = (c, h, m, yaw, o) => S.box(c, h, m, Object.assign({ res: px * 0.8 }, yaw ? { ax: F(yaw) } : null, o)),
      post = (x, z, y0, y1, r, m) => S.tube([[x, y0, z], [x, y1, z]], r, r, m || wood, thin),
      lamp = (p, r, s) => S.lights.push({ p, r, s });
    const P0 = [0.1, 0],
      /* every tier is the same wandering shape at a smaller size, with a little variation of its own, so none overhangs the one below */
      outline = (R0, sd) => a => R0 * (1 + 0.1 * Math.sin(2 * a + 1.3) + 0.07 * Math.sin(3 * a + 3) + 0.045 * Math.sin(5 * a + 2.2)) * (1 + 0.028 * Math.sin(4 * a + sd) + 0.018 * Math.sin(7 * a + sd * 2.1));
    // a tier of the islet: an upright slab with a wandering outline, its top at y, and a thin cap of another material on it
    const tier = (y, h, R0, sd, mat, cap) => {
      const rf = outline(R0, sd),
        ext = R0 * 1.3;
      S.solid([P0[0], y - h / 2, P0[1]], ext + h, (x, yy, z) => Math.max((Math.hypot(x, z) - rf(Math.atan2(z, x))) * 0.8, Math.abs(yy) - h / 2),
        (res, f) => {
          for (let z = -ext; z <= ext; z += res * 0.87) for (let x = -ext; x <= ext; x += res) if (Math.hypot(x, z) < rf(Math.atan2(z, x))) f(x, h / 2, z);
          const n = Math.ceil((TAU * R0) / res);
          for (let k = 0; k < n; k++) { const a = (k / n) * TAU, r = rf(a); for (let yy = -h / 2; yy <= h / 2; yy += res * 0.87) f(r * Math.cos(a), yy, r * Math.sin(a)); }
        }, mat, { res: px * 0.9, reach: px * 3 });
      const rc = a => rf(a) - px * 1.2, t = px * 1.4;
      S.solid([P0[0], y + t / 2 - px * 0.4, P0[1]], ext + h, (x, yy, z) => Math.max((Math.hypot(x, z) - rc(Math.atan2(z, x))) * 0.8, Math.abs(yy) - t / 2),
        (res, f) => { for (let z = -ext; z <= ext; z += res * 0.87) for (let x = -ext; x <= ext; x += res) if (Math.hypot(x, z) < rc(Math.atan2(z, x))) f(x, t / 2, z); },
        cap, { res: px * 0.9, reach: px * 3 });
      return rf;
    };
    const inside = (rf, x, z, m) => Math.hypot(x - P0[0], z - P0[1]) < rf(Math.atan2(z - P0[1], x - P0[0])) - (m || 0);
    const shelf = tier(0.16, 0.7, 2.85, 1.3, rock, sand);
    const t1 = tier(0.6, 0.5, 2.5, 4.1, rock, lawn);
    const mid = tier(1.0, 0.45, 2.15, 2.2, rock, lawn);
    const plat = tier(1.4, 0.45, 1.8, 5.7, rock, lawn);
    const TOP = 1.4 + px;
    // grass hanging over the edge of the top two tiers
    for (const [rf, y, sd] of [[plat, TOP, 31], [mid, 1.0 + px, 47]]) { const pts = [], n = 90; for (let k = 0; k <= n; k++) { const a = (k / n) * TAU; pts.push([P0[0] + (rf(a) - px) * Math.cos(a), y, P0[1] + (rf(a) - px) * Math.sin(a)]); }
      S.lip(pts, { mat: { r: [7, 8, 9] }, drop: 3, tuft: 4, depth: 2, seed: sd, out: i => { const a = (i / n) * TAU; return [Math.cos(a), Math.sin(a)]; } }); }
    // boulders hugging the tiers
    [[-1.6, 0.7, -1.0, 0.42, 0.6, 0.38, 2], [-1.3, 0.5, 1.5, 0.36, 0.5, 0.36, 5], [1.4, 0.5, -1.55, 0.4, 0.5, 0.34, 7], [-1.9, 0.3, 0.3, 0.36, 0.42, 0.4, 9], [0.4, 0.4, -1.9, 0.44, 0.44, 0.32, 11], [2.0, 0.25, -0.3, 0.34, 0.38, 0.36, 13],
     [2.3, 0.3, 0.9, 0.3, 0.3, 0.3, 15], [-0.3, 0.3, 2.3, 0.34, 0.3, 0.3, 17], [1.2, 0.3, 2.3, 0.3, 0.3, 0.32, 19], [-2.3, 0.2, -1.2, 0.3, 0.3, 0.3, 21]]
      .forEach(q => S.facet({ at: [q[0], q[1], q[2]], size: [q[3], q[4], q[5]], faces: 9, seed: q[6], mat: rock, top: moss }));

    // ---------------- the lighthouse ----------------
    const cx = -0.4, cz = -0.2, by = TOP;
    S.lathe([cx, by - 0.2, cz], 0.26, [0.7, 0.66], stone, fine);
    S.lathe([cx, by + 0.06, cz], 0.08, [0.62, 0.6], stone, fine);
    const rAt = y => 0.5 - 0.17 * ((y - by - 0.14) / 2.86), bands = 5;
    for (let k = 0; k < bands; k++) { const y0 = by + 0.14 + (2.86 * k) / bands, y1 = by + 0.14 + (2.86 * (k + 1)) / bands; S.lathe([cx, y0, cz], y1 - y0 + 0.002, [rAt(y0), rAt(y1)], k % 2 ? red : plaster, fine); }
    const win = (a, y, on) => { const r = rAt(y) + px * 0.2, c = Math.cos(a), s = Math.sin(a);
      bx([cx + r * c, y, cz + r * s], [0.05, 0.085, px], on ? lit : unlit, a + Math.PI / 2, thin);
      bx([cx + (r + px * 0.6) * c, y - 0.105, cz + (r + px * 0.6) * s], [0.07, px * 0.6, px * 1.2], { r: [3, 4, 5] }, a + Math.PI / 2, thin);
      if (on) lamp([cx + (r + 0.22) * c, y, cz + (r + 0.22) * s], 0.7, 0.5); };
    win(0.785, by + 0.95, true); win(2.4, by + 1.3, false); win(-0.6, by + 1.75, false); win(0.785, by + 2.2, true); win(3.7, by + 2.45, false); win(-2.2, by + 0.9, false); win(4.6, by + 1.5, true);
    { const a = 0.785, r = 0.515, c = Math.cos(a), s = Math.sin(a);
      S.door({ at: [cx + r * c, by + 0.12, cz + r * s], face: [c, s], w: 0.2, h: 0.42, mat: boards('y'), frame: { r: [3, 4, 5] }, iron: dark });
      S.ball([cx + 0.6 * c, by + 0.7, cz + 0.6 * s], 0.04, lit, thin); lamp([cx + 0.8 * c, by + 0.6, cz + 0.8 * s], 0.9, 0.6);
      bx([cx + 0.74 * c, by + 0.03, cz + 0.74 * s], [0.16, 0.035, 0.1], stone, a + Math.PI / 2); }
    const gy = by + 3.0;
    for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU; bx([cx + 0.42 * Math.cos(a), gy - 0.11, cz + 0.42 * Math.sin(a)], [0.075, 0.075, 0.03], { r: [16, 17, 18] }, a, thin); }
    S.lathe([cx, gy - 0.04, cz], 0.07, [0.57, 0.57], dark, fine);
    for (let k = 0; k < 16; k++) { const a = (k / 16) * TAU; post(cx + 0.535 * Math.cos(a), cz + 0.535 * Math.sin(a), gy + 0.03, gy + 0.27, 0.014, dark); }
    S.torus([cx, gy + 0.15, cz], 0.535, 0.012, dark, thin); S.torus([cx, gy + 0.27, cz], 0.535, 0.016, dark, thin);
    S.lathe([cx, gy + 0.03, cz], 0.1, [0.295, 0.295], plaster, fine);
    S.lathe([cx, gy + 0.13, cz], 0.37, [0.25, 0.25], lit, fine);
    for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU + 0.39; post(cx + 0.262 * Math.cos(a), cz + 0.262 * Math.sin(a), gy + 0.13, gy + 0.5, 0.016, dark); }
    S.torus([cx, gy + 0.31, cz], 0.262, 0.012, dark, thin);
    S.lathe([cx, gy + 0.5, cz], 0.07, [0.34, 0.34], dark, fine);
    S.lathe([cx, gy + 0.57, cz], 0.43, t => 0.35 * Math.pow(1 - t, 0.75) + 0.03, copper, fine);
    S.ball([cx, gy + 1.03, cz], 0.055, amber, thin); post(cx, cz, gy + 1.03, gy + 1.4, 0.013, dark);
    bx([cx + 0.1, gy + 1.22, cz], [0.1, 0.012, 0.012], dark, 0, thin); bx([cx + 0.15, gy + 1.33, cz], [0.12, 0.05, 0.012], red, 0, thin);
    lamp([cx, gy + 0.3, cz], 2.6, 0.75);
    const LANTERN = [cx, gy + 0.31, cz];
    // the shed beside it
    bx([-0.96, by + 0.26, -0.66], [0.26, 0.26, 0.21], plaster, 0.66); bx([-0.985, by + 0.55, -0.68], [0.31, 0.03, 0.26], dark, 0.66);
    bx([-0.96 + 0.265 * Math.cos(0.66) + 0.0, by + 0.19, -0.66 + 0.265 * Math.sin(0.66)], [px, 0.17, 0.07], boards('y'), 0.66, thin);

    // ---------------- the keeper's house and yard, sculpted for the game camera ----------------
    // The game draws 9 pixels to a game unit (0.05 world units): 180 pixels a world unit, against this diorama's 34. So here the
    // pieces are sized to the hero (0.11 tall), dabs are laid 2.5 times closer, and patterns use cells of 1 to 4 diorama pixels.
    const hx = 0.8, hz = 0.3, hb = TOP; // (the old house's place: the wall round the top still steers clear of it)
    const gp = px / 3, G = { res: gp * 1.2 }, GF = { res: gp * 0.9 }, N = { px: gp };
    const tilesG = K.pixel.tiles({ r: [20, 21, 22], tile: [2, 2] }),
      stoneG = K.pixel.masonry({ r: [1, 2, 3, 4], stone: [3, 2] }),
      wallG = K.pixel.masonry({ r: [16, 17, 18, 19], stone: [4, 2], joint: 1, vary: 0.3 }),
      boardsG = along => K.pixel.planks({ r: [24, 25, 26, 27], width: 1, along }),
      lawnG = K.pixel.lawn({ r: [6, 7, 8, 9], tufts: 0.5, cell: 2, patch: 0.5, flowers: [[19, 0.05], [23, 0.03], [29, 0.02]] }),
      cobble = K.pixel.masonry({ r: [3, 4, 5, 5], stone: [2, 2], joint: 2, vary: 0.4 });
    const gx = (c, h, m, yaw, o) => S.box(c, h, m, Object.assign({}, G, yaw ? { ax: F(yaw) } : null, o)),
      rod = (a, b, r, m) => S.tube([a, b], r, r, m || wood, GF),
      bush = (at, size, mat, seed) => S.canopy(Object.assign({ at, size, lobes: 3, mat, cluster: 3, bump: 1, seed, res: gp }, N));
    // the yard's own grass: a finer lawn laid over the tier's
    { const C0 = [0.78, 0.5], R = 0.92, th = gp * 2, ok = (x, z) => Math.hypot(x, z) < R && inside(plat, C0[0] + x, C0[1] + z, 0.1);
      S.solid([C0[0], TOP + gp * 0.8 - th / 2, C0[1]], R + 0.05, (x, y, z) => Math.max(Math.hypot(x, z) - R, Math.abs(y) - th / 2),
        (res, f) => { for (let z = -R; z <= R; z += res * 0.87) for (let x = -R; x <= R; x += res) if (ok(x, z)) f(x, th / 2, z); }, lawnG, { res: gp * 1.2, reach: gp * 3 }); }
    const HX = 0.76, HZ = 0.42;
    gx([HX, hb + 0.02, HZ], [0.3, 0.035, 0.23], stoneG);
    gx([HX, hb + 0.2, HZ], [0.27, 0.15, 0.2], wallG);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) gx([HX + sx * 0.27, hb + 0.2, HZ + sz * 0.2], [0.014, 0.15, 0.014], wood);
    for (const sz of [-1, 1]) gx([HX, hb + 0.345, HZ + sz * 0.2], [0.285, 0.012, 0.014], wood);
    for (const sx of [-1, 1]) gx([HX + sx * 0.27, hb + 0.345, HZ], [0.014, 0.012, 0.2], wood);
    S.solid([HX, hb + 0.35, HZ], 0.6, (x, y, z) => Math.max((Math.abs(x) + y - 0.27) * 0.7071, -y, Math.abs(z) - 0.2),
      (res, f) => { for (const sz of [-0.2, 0.2]) for (let y = 0; y < 0.27; y += res * 0.87) for (let x = -(0.27 - y); x <= 0.27 - y; x += res) f(x, y, sz); },
      wallG, { res: gp * 1.2, reach: gp * 3 });
    for (const s of [-1, 1]) S.box([HX + s * 0.16, hb + 0.35 + 0.135, HZ], [0.245, gp * 1.5, 0.265], tilesG, { res: gp * 1.2, ax: B.frame(0, 0, -s * Math.PI / 4) });
    S.tube([[HX, hb + 0.645, HZ - 0.275], [HX, hb + 0.645, HZ + 0.275]], 0.018, 0.018, dark, GF);
    for (const sz of [-1, 1]) for (const s of [-1, 1]) rod([HX + s * 0.3, hb + 0.345, HZ + sz * 0.262], [HX + s * 0.01, hb + 0.635, HZ + sz * 0.262], 0.011, wood); // barge boards
    gx([HX + 0.13, hb + 0.6, HZ - 0.1], [0.04, 0.12, 0.04], stoneG); gx([HX + 0.13, hb + 0.73, HZ - 0.1], [0.052, 0.014, 0.052], dark);
    [[0.15, 0.82, -0.09, 0.028], [0.2, 0.94, -0.07, 0.038], [0.28, 1.08, -0.03, 0.05]].forEach(q => S.ball([HX + q[0], hb + q[1], HZ + q[2]], [q[3] * 1.2, q[3], q[3] * 1.1], { r: [4, 5, 5] }, G));
    S.door(Object.assign({ at: [HX - 0.08, hb + 0.055, HZ + 0.2], face: [0, 1], w: 0.08, h: 0.165, mat: boardsG('y'), frame: wood, iron: dark, arch: false }, N));
    gx([HX - 0.08, hb + 0.03, HZ + 0.25], [0.07, 0.022, 0.04], stoneG);
    gx([HX - 0.08, hb + 0.262, HZ + 0.245], [0.085, gp, 0.05], tilesG);
    for (const s of [-1, 1]) rod([HX - 0.08 + s * 0.075, hb + 0.05, HZ + 0.285], [HX - 0.08 + s * 0.075, hb + 0.255, HZ + 0.285], 0.008, wood);
    const hwG = (at, face, sd) => S.window(Object.assign({ at, face, w: 0.07, h: 0.075, frame: white, glass: lit, shutters: red, box: wood, flowers: { r: [8, 9, 23] }, seed: sd }, N));
    hwG([HX + 0.12, hb + 0.21, HZ + 0.2], [0, 1], 3); hwG([HX + 0.27, hb + 0.21, HZ], [1, 0], 5); hwG([HX - 0.27, hb + 0.21, HZ + 0.03], [-1, 0], 7); hwG([HX + 0.02, hb + 0.21, HZ - 0.2], [0, -1], 9);
    S.window(Object.assign({ at: [HX, hb + 0.45, HZ + 0.2], face: [0, 1], w: 0.04, h: 0.04, frame: white, glass: unlit, sill: false }, N));
    lamp([HX + 0.12, hb + 0.21, HZ + 0.36], 0.6, 0.6); lamp([HX + 0.42, hb + 0.21, HZ], 0.55, 0.5); lamp([HX - 0.42, hb + 0.21, HZ + 0.03], 0.5, 0.45);
    // by the door: a lamp on a post, a bench, pots
    rod([HX - 0.2, hb, HZ + 0.3], [HX - 0.2, hb + 0.2, HZ + 0.3], 0.009, dark); rod([HX - 0.2, hb + 0.195, HZ + 0.3], [HX - 0.165, hb + 0.195, HZ + 0.3], 0.006, dark);
    S.ball([HX - 0.165, hb + 0.17, HZ + 0.3], 0.017, lit, GF); gx([HX - 0.165, hb + 0.19, HZ + 0.3], [0.02, 0.005, 0.02], dark); lamp([HX - 0.165, hb + 0.17, HZ + 0.3], 0.5, 0.7);
    gx([HX + 0.13, hb + 0.045, HZ + 0.27], [0.065, 0.007, 0.022], wood); for (const s of [-0.05, 0.05]) gx([HX + 0.13 + s, hb + 0.02, HZ + 0.27], [0.007, 0.022, 0.018], wood);
    [[0.02, 0.26, 4], [0.24, 0.25, 6], [-0.19, 0.24, 8]].forEach(q => { S.lathe([HX + q[0], hb, HZ + q[1]], 0.03, [0.014, 0.02], red, GF); bush([HX + q[0], hb + 0.045, HZ + q[1]], [0.022, 0.02, 0.022], { r: [8, 9, 23] }, q[2]); });
    // barrels, a bucket and the woodpile under the eaves
    S.barrel(Object.assign({ at: [HX - 0.35, hb, HZ + 0.12], h: 0.1, r: 0.04, mat: boardsG('y'), hoop: dark }, N));
    S.barrel(Object.assign({ at: [HX - 0.37, hb, HZ + 0.02], h: 0.085, r: 0.034, mat: boardsG('y'), hoop: dark }, N));
    S.lathe([HX - 0.3, hb, HZ + 0.21], 0.035, [0.016, 0.021], wood, GF); S.lathe([HX - 0.3, hb + 0.028, HZ + 0.21], 0.004, [0.017, 0.017], unlit, GF);
    for (let i = 0; i < 6; i++) for (let j = 0; j < 4 - (i % 5 ? 0 : 1); j++) S.tube([[HX - 0.2 + i * 0.033, hb + 0.018 + j * 0.031, HZ - 0.215], [HX - 0.2 + i * 0.033, hb + 0.018 + j * 0.031, HZ - 0.31]], 0.015, 0.015, (i + j) % 2 ? wood : { r: [25, 26, 27] }, GF);
    gx([HX - 0.1, hb + 0.16, HZ - 0.265], [0.125, 0.006, 0.065], tilesG, 0, { ax: B.frame(0, 0.35, 0) });
    // crates and sacks
    S.crate(Object.assign({ at: [HX + 0.37, hb, HZ + 0.15], size: [0.04, 0.04, 0.04], mat: { r: [26, 27] }, edge: wood }, N));
    S.crate(Object.assign({ at: [HX + 0.36, hb + 0.08, HZ + 0.15], size: [0.028, 0.028, 0.028], mat: { r: [26, 27] }, edge: wood }, N));
    [[0.45, 0.13, 0.3], [0.44, 0.2, 1.2]].forEach(q => S.ball([HX + q[0], hb + 0.022, HZ + q[1]], [0.03, 0.022, 0.024], { r: [31, 32, 32] }, Object.assign({ ax: F(q[2]) }, GF)));
    // the kitchen garden: a bed in a board frame, rows of greens, bean poles
    { const bxc = 1.33, bzc = 0.12, bw = 0.17, bd = 0.14;
      gx([bxc, hb + 0.012, bzc], [bw, 0.012, bd], wood);
      for (const s of [-1, 1]) { gx([bxc, hb + 0.024, bzc + s * bd], [bw + 0.008, 0.024, 0.007], boardsG('x')); gx([bxc + s * bw, hb + 0.024, bzc], [0.007, 0.024, bd], boardsG('z')); }
      for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) { const x = bxc - bw + 0.035 + c * 0.054, z = bzc - bd + 0.04 + r * 0.068, k = r * 6 + c;
        if (r === 3) { rod([x, hb + 0.02, z], [x, hb + 0.13, z], 0.004, wood); bush([x, hb + 0.075, z], [0.014, 0.04, 0.014], leaf, k + 3); if (c % 2) S.ball([x + 0.01, hb + 0.06 + (c % 3) * 0.02, z + 0.012], 0.007, red, GF); }
        else if (r === 1) { bush([x, hb + 0.034, z], [0.017, 0.012, 0.017], { r: [7, 8, 9] }, k + 5); }
        else if (r === 0) { bush([x, hb + 0.04, z], [0.012, 0.02, 0.012], leaf, k + 9); S.ball([x, hb + 0.026, z + 0.012], 0.008, red, GF); }
        else S.ball([x, hb + 0.036, z], [0.016, 0.013, 0.016], { r: [7, 8, 9] }, GF); }
      // a watering can, and a scarecrow keeping watch
      S.lathe([bxc - bw - 0.05, hb, bzc + 0.08], 0.035, [0.016, 0.014], copper, GF); rod([bxc - bw - 0.036, hb + 0.02, bzc + 0.08], [bxc - bw - 0.012, hb + 0.04, bzc + 0.08], 0.004, copper);
      const sx = bxc + 0.06, sz = bzc - bd - 0.06; rod([sx, hb, sz], [sx, hb + 0.17, sz], 0.006, wood); rod([sx - 0.055, hb + 0.115, sz], [sx + 0.055, hb + 0.115, sz], 0.005, wood);
      gx([sx, hb + 0.1, sz], [0.022, 0.03, 0.012], red); S.ball([sx, hb + 0.165, sz], 0.018, { r: [31, 32, 32] }, GF); S.lathe([sx, hb + 0.176, sz], 0.02, [0.032, 0.004], { r: [25, 26, 27] }, GF); }
    // the well
    { const wx = 0.12, wz = 0.74;
      S.lathe([wx, hb, wz], 0.06, [0.062, 0.058], stoneG, G); S.lathe([wx, hb + 0.045, wz], 0.006, [0.044, 0.044], unlit, GF);
      S.torus([wx, hb + 0.062, wz], 0.052, 0.009, { r: [3, 4, 5] }, GF);
      for (const s of [-1, 1]) rod([wx + s * 0.058, hb, wz], [wx + s * 0.058, hb + 0.2, wz], 0.008, wood);
      rod([wx - 0.062, hb + 0.165, wz], [wx + 0.062, hb + 0.165, wz], 0.007, wood);
      for (const s of [-1, 1]) S.box([wx, hb + 0.215, wz + s * 0.03], [0.085, gp, 0.042], tilesG, { res: gp * 1.2, ax: B.frame(0, s * 0.6, 0) });
      rod([wx, hb + 0.165, wz], [wx, hb + 0.1, wz], 0.003, { r: [31, 32] }); S.lathe([wx, hb + 0.075, wz], 0.028, [0.013, 0.016], wood, GF);
      S.lathe([wx + 0.1, hb, wz + 0.05], 0.03, [0.014, 0.018], wood, GF); }
    // flowers along the walls and the fence, stones in the grass
    [[-0.2, 0.235, 0], [0.2, 0.235, 1], [0.3, 0.1, 2], [0.3, -0.1, 0], [-0.3, -0.12, 1], [0.22, -0.23, 2], [-0.02, -0.235, 0]].forEach((q, k) =>
      bush([HX + q[0], hb + 0.022, HZ + q[1]], [0.032, 0.022, 0.026], [{ r: [8, 9, 23] }, { r: [7, 8, 19] }, { r: [8, 9, 29] }][q[2]], k * 7 + 2));
    for (let k = 0; k < 11; k++) { const x = 0.47 + k * 0.062 + 0.012 * Math.sin(k * 2.3), z = 0.925 + 0.01 * Math.cos(k * 1.7); bush([x, hb + 0.02, z], [0.024, 0.02, 0.02], [{ r: [8, 9, 23] }, { r: [7, 8, 9] }, { r: [7, 8, 19] }][k % 3], k * 5 + 1); }
    [[0.36, 0.52, 3], [1.18, 0.62, 5], [1.36, 0.42, 7], [0.98, 0.84, 9], [0.3, 0.3, 11], [0.86, 0.02, 15]].forEach(q =>
      S.facet(Object.assign({ at: [q[0], hb + 0.012, q[1]], size: [0.03, 0.024, 0.026], faces: 7, seed: q[2], mat: rock, top: moss, res: gp * 1.2 }, N)));
    [[1.1, 0.72, 2], [1.26, 0.5, 4], [0.3, 0.42, 6], [1.42, 0.86, 8], [0.62, 0.02, 10], [1.02, 0.1, 12]].forEach(q => bush([q[0], hb + 0.03, q[1]], [0.045, 0.034, 0.04], leaf, q[2] * 3 + 1));
    // a young apple tree
    { const tx = 1.52, tz = 0.56; S.tube([[tx, hb, tz], [tx + 0.01, hb + 0.1, tz], [tx - 0.01, hb + 0.17, tz + 0.01]], 0.016, 0.01, wood, GF);
      S.canopy(Object.assign({ at: [tx, hb + 0.24, tz], size: [0.1, 0.085, 0.095], lobes: 5, mat: leaf, cluster: 4, bump: 1.4, seed: 21, res: gp * 1.1 }, N));
      [[0.06, 0.2, 0.05], [-0.07, 0.23, 0.03], [0.02, 0.19, -0.08], [-0.03, 0.27, 0.085], [0.085, 0.26, -0.02]].forEach(q => S.ball([tx + q[0], hb + q[1], tz + q[2]], 0.011, red, GF)); }
    // washing line
    { const a = [-1.35, 0.35], b = [-0.85, 0.85], ra = Math.atan2(b[1] - a[1], b[0] - a[0]); post(a[0], a[1], by - 0.03, by + 0.47, 0.022); post(b[0], b[1], by - 0.03, by + 0.47, 0.022);
      S.tube([[a[0], by + 0.45, a[1]], [b[0], by + 0.45, b[1]]], 0.01, 0.01, white, thin);
      [red, white, { r: [12, 13, 14] }, copper, white].forEach((m, k) => { const f = 0.14 + k * 0.18, h = 0.07 + (k % 2) * 0.025; bx([a[0] + (b[0] - a[0]) * f, by + 0.44 - h, a[1] + (b[1] - a[1]) * f], [0.05, h, px * 0.6], m, ra, thin); }); }
    // picket fence, the low wall round the top, the path
    for (let k = 0; k <= 24; k++) { const x = 0.44 + k * 0.0283, z = 0.96, tall = k % 6 === 0; if (inside(plat, x, z, 0.06)) gx([x, hb + (tall ? 0.058 : 0.048), z], [tall ? 0.01 : 0.007, tall ? 0.058 : 0.048, 0.006], white); }
    for (const y of [0.032, 0.074]) rod([0.44, hb + y, 0.957], [1.12, hb + y, 0.957], 0.005, white);
    gx([0.78, hb + 0.03, 0.9535], [0.34, 0.03, 0.003], white); // (a board behind the pickets: the walk map needs the fence solid)
    for (let k = 3; k < 26; k++) { if (k === 15 || k === 16 || k === 17) continue; const a = k * 0.2417, x = cx + 1.3 * Math.cos(a), z = cz + 1.16 * Math.sin(a); if (!inside(plat, x, z, 0.1) || Math.hypot(x - hx, z - hz) < 0.62 || Math.hypot(x + 0.96, z + 0.66) < 0.42) continue;
      bx([x, by + 0.05, z], [0.075, 0.055, 0.05], stone, a + Math.PI / 2); if (k % 2) bx([x + 0.02, by + 0.14, z], [0.07, 0.045, 0.048], stone, a + 1.6); }
    const path = (a, b, w) => { const l = Math.hypot(b[0] - a[0], b[1] - a[1]); gx([(a[0] + b[0]) / 2, TOP + gp * 1.1, (a[1] + b[1]) / 2], [l / 2 + 0.012, gp * 0.9, w], cobble, Math.atan2(b[1] - a[1], b[0] - a[0])); };
    path([0.02, 0.22], [0.42, 0.76], 0.05); path([0.42, 0.76], [0.68, 0.74], 0.045); path([0.42, 0.76], [0.5, 0.93], 0.05); path([0.42, 0.76], [0.2, 0.75], 0.035); path([0.68, 0.74], [1.5, 0.92], 0.045);

    // ---------------- steps, landing, jetty ----------------
    const jy = 0.21, jz = 1.3;
    { // three short flights up the tiers, on the line from the middle of the islet out to the jetty
      const th = 0.6, c = Math.cos(th), s = Math.sin(th), step = { r: [3, 4, 5, 5] };
      [[t1, 0.16 + px, 0.6 + px], [mid, 0.6 + px, 1.0 + px], [plat, 1.0 + px, TOP]].forEach(([rf, y0, y1]) => { const r0 = rf(th), n = 5, run = 0.3;
        for (let k = 0; k < n; k++) { const r = r0 + run * (1 - (k + 0.5) / n) - 0.02, y = y0 + ((y1 - y0) * (k + 1)) / n; bx([P0[0] + r * c, (y + y0) / 2 - 0.02, P0[1] + r * s], [run / n / 2 + 0.004, (y - y0) / 2 + 0.02, 0.14], step, th); }
        for (const e of [-1, 1]) { const x = P0[0] + (r0 + run) * c - e * 0.17 * s, z = P0[1] + (r0 + run) * s + e * 0.17 * c; post(x, z, y0 - 0.03, y0 + 0.2, 0.02); } }); }
    bx([1.82, 0.17, jz], [0.3, 0.06, 0.3], stone);
    bx([2.98, jy, jz], [1.0, 0.02, 0.21], K.pixel.planks({ r: [25, 26, 27, 27], width: 3, along: 'z' }));
    for (const s of [-0.16, 0.16]) S.tube([[1.95, jy - 0.045, jz + s], [3.97, jy - 0.045, jz + s]], 0.026, 0.026, wood, thin);
    for (let i = 0; i < 5; i++) { const x = 2.08 + i * 0.47; for (const s of [-0.2, 0.2]) post(x, jz + s, -0.6, jy + 0.1, 0.04); }
    S.crate({ at: [3.4, jy + 0.02, jz - 0.07], size: [0.1, 0.1, 0.1], mat: { r: [26, 27] }, edge: wood }); S.crate({ at: [3.42, jy + 0.22, jz - 0.06], size: [0.07, 0.07, 0.07], mat: { r: [26, 27] }, edge: wood });
    S.barrel({ at: [2.95, jy + 0.02, jz + 0.08], h: 0.23, r: 0.085, mat: boards('y'), hoop: dark });
    [[2.3, -0.1, 0.2], [2.38, 0.06, 1.1]].forEach(q => S.ball([q[0], jy + 0.07, jz + q[1]], [0.075, 0.05, 0.055], { r: [31, 32, 32] }, Object.assign({ ax: F(q[2]) }, thin)));
    S.torus([3.72, jy + 0.04, jz + 0.09], 0.07, 0.02, { r: [31, 32] }, thin);
    post(3.92, jz - 0.14, -0.2, jy + 0.56, 0.03); S.ball([3.92, jy + 0.65, jz - 0.14], 0.07, lit, thin); lamp([3.92, jy + 0.65, jz - 0.14], 1.3, 0.75);
    post(2.6, jz - 0.21, jy, jy + 0.55, 0.03); S.tube([[2.6, jy + 0.54, jz - 0.21], [2.6, jy + 0.6, jz - 0.56]], 0.024, 0.024, wood, thin); S.tube([[2.6, jy + 0.6, jz - 0.56], [2.6, jy + 0.25, jz - 0.56]], 0.008, 0.008, { r: [31, 32] }, thin); S.ball([2.6, jy + 0.19, jz - 0.56], 0.06, red, thin);
    // the rowing boat tied to it
    const ell = (x, y, z, A, Bb, C) => { const k0 = Math.hypot(x / A, y / Bb, z / C), k1 = Math.hypot(x / (A * A), y / (Bb * Bb), z / (C * C)); return k1 > 1e-9 ? (k0 * (k0 - 1)) / k1 : -Math.min(A, Bb, C); };
    const hull = (c, r, yaw, m, top) => { const [a, b, cc] = r, ia = a * 0.9, ib = b * 0.92, ic = cc * 0.8, lift = b * 0.22;
      S.solid(c, a * 1.25, (x, y, z) => Math.max(ell(x, y, z, a, b, cc), -ell(x, y - lift, z, ia, ib, ic), y - top),
        (res, f) => { const n = Math.ceil((14 * a * cc) / (res * res));
          for (let i = 0; i < n; i++) { const d = B.fib(i, n); if (d[1] * b < top) f(d[0] * a, d[1] * b, d[2] * cc); if (d[1] * ib + lift < top) f(d[0] * ia, d[1] * ib + lift, d[2] * ic); }
          const s1 = Math.sqrt(Math.max(0, 1 - (top / b) ** 2)), s2 = Math.sqrt(Math.max(0, 1 - ((top - lift) / ib) ** 2));
          for (let k = 0; k < 260; k++) { const q = (k / 260) * TAU; for (let w = 0; w <= 1; w += 0.34) f(Math.cos(q) * (a * s1 + (ia * s2 - a * s1) * w), top, Math.sin(q) * (cc * s1 + (ic * s2 - cc * s1) * w)); } },
        m, Object.assign({ ax: F(yaw), reach: px * 3 }, fine)); };
    hull([3.1, 0.055, 1.92], [0.3, 0.11, 0.13], 0, wood, 0.045);
    bx([3.1, 0.045, 1.92], [0.22, 0.012, 0.075], { r: [25, 26] }, 0, thin);
    for (const u of [-0.14, 0, 0.14]) bx([3.1 + u, 0.09, 1.92], [0.02, 0.009, 0.1 - Math.abs(u) * 0.12], { r: [26, 27] }, 0, thin);
    S.tube([[2.85, 0.125, 1.8], [3.42, 0.125, 1.86]], 0.011, 0.011, { r: [26, 27] }, thin); S.tube([[2.8, 0.125, 2.03], [3.38, 0.125, 1.98]], 0.011, 0.011, { r: [26, 27] }, thin);
    S.tube([[2.82, 0.1, 1.9], [2.6, 0.12, 1.7], [2.47, jy + 0.03, jz + 0.2]], 0.008, 0.008, { r: [31, 32] }, thin);

    // ---------------- the fishing boat, the buoy ----------------
    { const fxx = 0.95, fz = 3.05, fa = 0.45, c = Math.cos(fa), s = Math.sin(fa), Q = (u, w) => [fxx + u * c - w * s, fz + u * s + w * c];
      hull([fxx, 0.08, fz], [0.75, 0.27, 0.31], fa, { r: [33, 34, 35] }, 0.085);
      bx([fxx, 0.115, fz], [0.52, 0.012, 0.19], { r: [26, 27, 27] }, fa, thin);
      let p = Q(-0.32, 0); bx([p[0], 0.25, p[1]], [0.15, 0.13, 0.12], plaster, fa); bx([p[0], 0.39, p[1]], [0.18, 0.016, 0.15], red, fa); p = Q(-0.165, 0); bx([p[0], 0.27, p[1]], [px * 0.5, 0.05, 0.07], lit, fa, thin);
      p = Q(0.08, 0); post(p[0], p[1], 0.08, 1.08, 0.026); const q = Q(0.56, 0); S.tube([[p[0], 0.33, p[1]], [q[0], 0.36, q[1]]], 0.02, 0.02, wood, thin); S.tube([[p[0] + 0.03 * c, 0.39, p[1] + 0.03 * s], [q[0], 0.41, q[1]]], 0.046, 0.04, { r: [17, 18, 19] }, thin);
      S.ball([p[0], 1.12, p[1]], 0.05, lit, thin); lamp([p[0], 1.12, p[1]], 0.9, 0.6);
      S.tube([[p[0], 1.05, p[1]], [q[0] + 0.15 * c, 0.2, q[1] + 0.15 * s]], 0.007, 0.007, { r: [31, 32] }, thin);
      for (const u of [-0.2, 0.1, 0.34]) { const f = Q(u, 0.3 - Math.abs(u) * 0.04); S.ball([f[0], 0.11, f[1]], 0.05, red, thin); } }
    { const ux = 0.15, uz = 3.75; S.lathe([ux, -0.07, uz], 0.19, [0.19, 0.15], red, fine); S.lathe([ux, 0.12, uz], 0.05, [0.15, 0.13], white, fine);
      for (let k = 0; k < 3; k++) { const a = (k / 3) * TAU; S.tube([[ux + 0.11 * Math.cos(a), 0.17, uz + 0.11 * Math.sin(a)], [ux, 0.5, uz]], 0.016, 0.014, dark, thin); }
      S.ball([ux, 0.54, uz], 0.05, amber, thin); lamp([ux, 0.54, uz], 0.7, 0.5); }

    // ---------------- sea stacks and gulls, the bent tree, bushes ----------------
    const stacks = [];
    [[-2.7, 2.15, 0.36, 0.9], [-3.05, -1.8, 0.3, 1.3], [2.15, -2.7, 0.33, 0.8], [-1.25, 3.15, 0.25, 0.5], [3.25, -1.1, 0.22, 0.7], [-2.8, -2.45, 0.2, 0.7], [2.6, -3.15, 0.18, 0.4], [-3.35, 0.55, 0.17, 0.4]].forEach((q, k) => {
      const ry = q[3] * 0.5 + 0.32; S.facet({ at: [q[0], q[3] * 0.5, q[1]], size: [q[2], ry, q[2] * 0.85], faces: 10, seed: k * 11 + 3, mat: rock, top: moss, sink: 0 }); stacks.push([q[0], q[1], q[2] * 0.95]);
      if (k < 4) { const ty = q[3] * 0.5 + ry; S.ball([q[0] + 0.03, ty + 0.035, q[1]], [0.05, 0.04, 0.04], white, thin); S.ball([q[0] + 0.07, ty + 0.085, q[1] + 0.01], 0.026, white, thin); } });
    { const pts = [[-1.2, by - 0.05, -0.9], [-1.26, by + 0.14, -0.94], [-1.36, by + 0.28, -1.0], [-1.5, by + 0.4, -1.08], [-1.67, by + 0.5, -1.17]]; S.tube(pts, 0.075, 0.03, wood, fine); S.tube([[-1.4, by + 0.3, -1.02], [-1.45, by + 0.5, -0.86]], 0.03, 0.015, wood, thin);
      S.canopy({ at: [-1.72, by + 0.62, -1.2], size: [0.36, 0.2, 0.28], lobes: 5, mat: leaf, seed: 4 }); S.canopy({ at: [-1.5, by + 0.6, -0.85], size: [0.2, 0.13, 0.18], lobes: 3, mat: leaf, seed: 9 }); S.canopy({ at: [-2.02, by + 0.52, -1.32], size: [0.2, 0.12, 0.17], lobes: 3, mat: leaf, seed: 12 }); }
    [[0.25, -1.05, 0.14, TOP], [1.3, -0.6, 0.12, TOP], [-0.2, 1.25, 0.13, TOP], [-1.3, -0.1, 0.11, TOP], [1.55, 1.0, 0.13, 1.0 + px], [-0.9, 1.65, 0.14, 1.0 + px], [1.2, -1.6, 0.12, 1.0 + px], [-1.7, -0.5, 0.13, 0.6 + px], [0.6, 2.1, 0.13, 0.6 + px], [2.2, -1.0, 0.11, 0.6 + px]]
      .forEach((q, k) => S.canopy({ at: [q[0], q[3] + q[2] * 0.7, q[1]], size: [q[2] * 1.3, q[2], q[2] * 1.3], lobes: 3, mat: leaf, cluster: 4, bump: 1.2, seed: k * 5 + 2 }));
    // gulls on the wing
    [[-1.7, 4.95, 0.5, 0.4], [0.9, 5.35, -1.0, 2.2], [1.5, 4.55, 1.3, 1.1], [-0.4, 5.75, 1.9, 3.5]].forEach(q => { const ax = F(q[3]); S.ball([q[0], q[1], q[2]], [0.05, 0.028, 0.03], white, Object.assign({ ax }, thin));
      for (const s of [-1, 1]) S.box([q[0] - s * 0.075 * Math.sin(q[3]), q[1] + 0.022, q[2] + s * 0.075 * Math.cos(q[3])], [0.03, 0.008, 0.08], white, Object.assign({ ax: B.frame(-q[3], s * 0.35, 0) }, thin)); });
    S.bake();

    // ---------------- the sea ----------------
    S.lathe([0, -1.0, 0], 0.98, [4.45, 4.7], { r: [10, 10, 11] }, { res: px * 2.4 });
    const sea = K.pixel.water({ r: [10, 11, 12, 13], yaw: YAW, glint: 0.05, foam: 15, shallow: 6,
      shore: (x, z) => { let d = Math.hypot(x - P0[0], z - P0[1]) - shelf(Math.atan2(z - P0[1], x - P0[0])); for (const s of stacks) d = Math.min(d, Math.hypot(x - s[0], z - s[1]) - s[2]); return d; } });
    S.lathe([0, -0.03, 0], 0.03, [4.7, 4.7], sea, { res: px * 1.4 });
    S.bake();
    const W = B.finish({
      cam: { target: [0.25, 1.95, 0.35], dist: 15.2, yaw: YAW, pitch: 0.5, sway: 0 },
      radius: 7, detail: DETAIL, dither: 0,
      atmosphere: [],
      look: { pixel: true, outline: true, clean: true }
    });
    W.lantern = LANTERN;
    W.navFine = [{ at: [0.78, 0.5], r: 0.9, step: 0.014, low: 0.02 }]; // the yard is built to the hero's size: see tools/bake-ink-area.cjs
    return W;
  }
});
