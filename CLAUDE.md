# Chess Coach

A chess trainer for Ken, who knows how the pieces move and not much more. Four tabs:
**Learn** (short lessons with a position to try), **Puzzles**, **Openings** (real lines, move by
move, with the reason for each move) and **Play** (against the computer, with a coach that warns
before a move gives away a piece or allows mate). Started 2026-11-25.

## Files

- `index.html`: the whole app in one page. Open it in a browser. The scripts, in order:
  1. `PIECES`: the cburnett piece SVGs as data URIs (CC BY-SA 3.0, credited in the footer).
  2. `makeEngine(Chess)`: computer opponent, coach (`checkMove`), hints, `mateMoves` search.
  3. `CONTENT`: lessons, puzzles and openings, all data.
  4. `startApp(Chess)`: the board and the four screens.
  5. A module script that imports chess.js **1.4.0** from jsDelivr and calls `startApp`.
- `test/check-content.mjs`: run `node test/check-content.mjs` after changing content or the
  engine. It checks that every FEN and move is legal, proves the mate puzzles (and lists other
  first moves that also work, which go in a puzzle's `also`), checks that win-material puzzles
  beat the next-best move by a clear margin, and lists the moves each `safe` lesson step accepts.
  It downloads chess.js into `test/.cache/` the first time.

## Engine

The engine calls chess.js internals (`_moves`, `_makeMove`, `_undoMove`, `_board`, `_turn`)
because the public `moves({verbose})` builds SAN for every move and is far too slow to search
with. That is why chess.js is pinned to 1.4.0; if you upgrade it, rerun the test.

Levels (`LEVELS`): 1 random moves, but grabs a free piece or mate half the time; 2 one move deep
with lots of noise; 3 two deep with a little noise; 4 three deep with no noise. Level 4 plays
the defending king in the mating drills.

The mating drills (K+Q and K+R against a lone king) have a **teacher** (`makeTeacher`): Hint,
and "Show me how", which plays the whole mate step by step with a sentence per move, and shades
the enemy king's "box" (squares it can still reach; a rook's line counts as a wall even past
your own king). Hand-written rules for these endings looped or drifted from awkward starts, so
the teacher builds an exact table (`buildTable`, ~0.2 s, built on first use) and picks, among
the fastest moves to mate, the one that best fits the method (shrink the box, else bring the
king). The test plays it from each drill start and 60 random positions.

The coach (`checkMove`) flags a move if the opponent can then mate in one, or win about 2 points
of material or more with a sequence of captures (material only). Losing a single pawn isn't
flagged on purpose, so beginners aren't nagged.

## Content rules

- Lesson step kinds: `read` (optional `hl` to light up squares, `why: true` to explain the
  checkmate on the board), `tap` (tap each of `squares`, for learning square names), `move`
  (`accept` list, `wrong` map of SAN to explanation, optional `other`, `say: true` to describe a
  wrong move in words), `mate` (any mate in one counts), `safe` (any move the coach is happy
  with), `drill` (play on against level 4 until `goal` within `limit` moves).
- Lessons start with a **Start here** group (squares, notation, check, checkmate) for a true
  beginner. Ken asked for this: he didn't know what "b-file" meant.
- `GLOSSARY` (in CONTENT): chess words. `md()` links the first use of each word in a block of
  text (tap for the meaning) and every square name (tap to light it up). Add a word there when
  new text uses a term a beginner wouldn't know.
- Every checkmate (lesson, drill, puzzle) shows "Why is it checkmate?" (`whyMate`): the
  checking piece, which piece covers each escape square (marked red), and why capture and
  block fail. Puzzle solutions list each move in words (`describe`).
- Puzzle `line` alternates your move and the reply. Mate themes accept any mating move at the
  end. If you play a different good move, the computer replies with its own best move.
- Write for a beginner: plain words, say *why*, name squares.

## State

localStorage: `cc.progress` (lessons done, puzzles solved first try or with help, openings
completed), `cc.play` (current game: start FEN, moves, color, level, coach), `cc.stats`
(results per level), `cc.tab`.

## Plan / ideas not built yet

- Game review after a Play game: walk back through your worst moves.
- More puzzles (aim for 100+), maybe a daily set and spaced repetition of missed ones.
- More openings and "what if they play something else" branches.

## Deploy

Live at https://learn-chess-coach.vercel.app (Vercel team "Ken Richard's projects", project
`chess-coach`; GitHub repo `kenrichard/chess-coach`, public). Every push to `main` deploys to
production. No build step. `chess-coach.vercel.app` belongs to someone else, which is why the
address differs from the project name. Deployment protection is on for the team's generated
URLs, so share only the `learn-chess-coach` address.
