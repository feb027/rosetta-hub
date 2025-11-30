import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: '2048',
  slug: '2048-game',
  difficulty: 'medium',
  tags: ['game', 'puzzle', 'array', 'simulation'],
  description: `Implement a 2D sliding block puzzle game where blocks with numbers are combined to add their values.

Rules:
• On each turn, choose a direction (up, down, left, right)
• All tiles slide as far as possible in that direction
• Two adjacent tiles with matching numbers merge into one bearing their sum
• A new tile (2 or 4) spawns in a random empty square after each move
• Goal: Create a tile with the number 2048
• Game over: No valid moves possible

The game is named after the popular open-source implementation by Gabriele Cirulli.`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/2048',
  createdAt: '2025-11-30',
  previewImage: '/previews/2048-game.png',
};
