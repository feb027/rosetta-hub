import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: 'Average Loop Length',
  slug: 'average-loop-length',
  difficulty: 'medium',
  tags: ['math', 'simulation', 'algorithm'],
  description: `Given a random mapping f from numbers 1..N to 1..N, the sequence 1, f(1), f(f(1))... will eventually repeat. This problem estimates the average length until the first repetition.

The analytical formula involves the sum: Σ(k=1 to N) of (k × N! / N^k / (N-k)!)

Compare simulated results with the theoretical values to see how randomness converges to mathematical expectation.`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/Average_loop_length',
  createdAt: '2025-11-30',
  previewImage: '/previews/average-loop-length.png',
};
