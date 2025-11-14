import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: '15 Puzzle Game',
  slug: '15-puzzle-game',
  difficulty: 'medium',
  tags: ['game', 'algorithm', 'simulation'],
  description: `Implement the Fifteen Puzzle Game, also known as the Gem Puzzle, Boss Puzzle, or Mystic Square.

The 15-puzzle is a sliding puzzle that consists of a 4×4 grid with numbered tiles from 1 to 15 and one empty space. The goal is to arrange the tiles in numerical order by sliding them into the empty space.

Key features to implement:
- Generate a random (but solvable) starting position
- Validate moves (only tiles adjacent to the empty space can move)
- Detect when the puzzle is solved
- Track the number of moves
- Provide user interface for tile movement

Note: Only half of all possible initial positions are solvable. A configuration is solvable if the number of inversions (tiles in wrong order) has the correct parity.`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/15_puzzle_game',
  createdAt: '2025-01-14',
  previewImage: '/previews/15-puzzle-game.png'
};
