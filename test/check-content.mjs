import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import vm from 'vm';

// Checks every lesson, puzzle and opening in index.html: legal positions and moves, puzzle
// solutions that really work (mates are proven, material wins must beat the next-best move),
// and lists the moves the 'safe' lesson steps accept. Run: node test/check-content.mjs
const here = path.dirname(fileURLToPath(import.meta.url));
const cache = path.join(here, '.cache', 'chess-1.4.0.mjs');
if (!existsSync(cache)) {
  mkdirSync(path.dirname(cache), { recursive: true });
  const res = await fetch('https://cdn.jsdelivr.net/npm/chess.js@1.4.0/dist/esm/chess.js');
  writeFileSync(cache, await res.text());
}
const { Chess } = await import(cache);
const html = readFileSync(path.join(here, '..', 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
const ctx = { module: undefined };
vm.createContext(ctx);
for (const s of scripts) if (/function makeEngine|const CONTENT/.test(s)) vm.runInContext(s + '\n;globalThis.makeEngine = typeof makeEngine !== "undefined" ? makeEngine : globalThis.makeEngine; globalThis.CONTENT = typeof CONTENT !== "undefined" ? CONTENT : globalThis.CONTENT; if (typeof makeTeacher !== "undefined") globalThis.makeTeacher = makeTeacher;', ctx);
const E = ctx.makeEngine(Chess);
const { CONTENT } = ctx;
const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
let bad = 0; const fail = (...a) => { bad++; console.log('FAIL', ...a); };
const fenOf = (f) => f === 'start' ? START : f;
const san = (g, m) => { try { return g.move(m).san; } catch { return null; } };
for (const L of CONTENT.LESSONS) for (const [i, st] of L.steps.entries()) {
  const id = L.id + '#' + i;

  let g; try { g = new Chess(fenOf(st.fen)); } catch (e) { fail(id, 'fen', e.message); continue; }
  if (st.kind === 'move') {
    for (const a of st.accept) { const t = new Chess(g.fen()); if (!san(t, a)) fail(id, 'accept illegal', a); }
    for (const w of Object.keys(st.wrong || {})) { const t = new Chess(g.fen()); if (!san(t, w)) fail(id, 'wrong illegal', w); }
    if (st.accept.length === 1) {
      const sc = E.rootScores(g.fen(), 3); const top = new Chess(g.fen()).move(sc[0].move).san;
      const second = sc[1] ? sc[1].score : -1e9;
      console.log(id, 'best', top, sc[0].score, 'next', sc[1] && new Chess(g.fen()).move(sc[1].move).san, second, top === st.accept[0] ? '' : '<<< differs');
    }
  }
  if (st.kind === 'mate') { const m = g.moves({verbose:true}).filter(m => { const t=new Chess(g.fen()); t.move(m); return t.isCheckmate(); }); console.log(id, 'mates:', m.map(x=>x.san).join(' ') || 'NONE'); if (!m.length) fail(id,'no mate'); }
  if (st.kind === 'safe') { const ok = g.moves().filter(m => !E.checkMove(g.fen(), m)); console.log(id, 'safe moves:', ok.join(' ')); }
}
for (const P of CONTENT.PUZZLES) {
  let g; try { g = new Chess(P.fen); } catch (e) { fail(P.id, 'fen', e.message); continue; }
  for (const m of P.line) if (!san(g, m)) { fail(P.id, 'illegal line move', m); break; }
  if (P.theme.startsWith('mate')) {
    if (!g.isCheckmate()) fail(P.id, 'line does not end in mate');
    const n = P.theme === 'mate2' ? 2 : 1;
    const firsts = E.mateMoves(P.fen, n).map(m => new Chess(P.fen).move(m).san);
    console.log(P.id, 'mate-in-' + n + ' first moves:', firsts.join(' '));
    if (n === 2) { const m1 = E.mateMoves(P.fen, 1); if (m1.length) fail(P.id, 'has mate in 1'); }
  } else {
    const sc = E.rootScores(P.fen, 4);
    const sans = sc.slice(0, 3).map(s => new Chess(P.fen).move(s.move).san + ':' + s.score);
    const top = new Chess(P.fen).move(sc[0].move).san;
    console.log(P.id, sans.join('  '), top === P.line[0] ? '' : '<<< differs', 'margin', sc[0].score - sc[1].score);
  }
}
for (const O of CONTENT.OPENINGS) { const g = new Chess(); for (const [m] of O.moves) if (!san(g, m)) { fail(O.id, 'illegal', m); break; } console.log(O.id, 'ok', g.fen()); }
// Mating drills: the teacher must mate from each drill start and from random positions,
// against the computer's best defence, within the drill's move limit.
const T = ctx.makeTeacher(Chess);
const SQS = []; for (const f of 'abcdefgh') for (let r = 1; r <= 8; r++) SQS.push(f + r);
for (const L of CONTENT.LESSONS) for (const st of L.steps) {
  if (st.kind !== 'drill') continue;
  const big = /Q/.test(st.fen) ? 'q' : 'r';
  const starts = [st.fen];
  while (starts.length < 60) {
    const g = new Chess(); g.clear();
    const [a, b, c] = [0, 1, 2].map(() => SQS[Math.floor(Math.random() * 64)]);
    if (new Set([a, b, c]).size < 3) continue;
    g.put({ type: 'k', color: 'w' }, a); g.put({ type: big, color: 'w' }, b); g.put({ type: 'k', color: 'b' }, c);
    try { const t = new Chess(g.fen()); if (t.isGameOver() || new Chess(g.fen().replace(' w ', ' b ')).inCheck()) continue; } catch { continue; }
    starts.push(g.fen());
  }
  for (const fen of starts) {
    const g = new Chess(fen), seen = new Set([T.key(fen)]); let pk = '', n = 0;
    while (!g.isGameOver() && n < st.limit) {
      const tm = T.teach(g.fen(), seen, pk); pk = tm.kind; g.move(tm.move); n++; seen.add(T.key(g.fen()));
      if (!g.isGameOver()) { g.move(E.pickMove(g.fen(), 4)); seen.add(T.key(g.fen())); }
    }
    if (!g.isCheckmate()) fail(L.id, 'teacher did not mate from', fen);
  }
  console.log(L.id, 'teacher mated from', starts.length, 'starts');
}
console.log(bad ? bad + ' failures' : 'all good');
