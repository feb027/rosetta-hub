import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: '21 Game',
  slug: '21-game',
  difficulty: 'easy',
  tags: ['game', 'algorithm', 'math'],
  description: `A two-player game where players take turns adding 1, 2, or 3 to a running total. The player whose chosen number causes the total to reach exactly 21 wins.

The game demonstrates strategic thinking and modular arithmetic. There's a winning strategy: controlling positions where the total is 1, 5, 9, 13, or 17 guarantees victory.`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/21_game',
  createdAt: '2025-11-14',
  previewImage: '/previews/21-game.png'
};
