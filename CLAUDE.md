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

The coach (`checkMove`) flags a move if the opponent can then mate in one, or win about 2 points
of material or more with a sequence of captures (material only). Losing a single pawn isn't
flagged on purpose, so beginners aren't nagged.

## Content rules

- Lesson step kinds: `read`, `move` (`accept` list, `wrong` map of SAN to explanation, optional
  `other`), `mate` (any mate in one counts), `safe` (any move the coach is happy with),
  `drill` (play on against level 4 until `goal` within `limit` moves).
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
- Not deployed yet. Hasenpfeffer deploys from GitHub to Vercel; this could do the same.
