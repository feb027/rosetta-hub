import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: 'Bernoulli Numbers',
  slug: 'bernoulli-numbers',
  difficulty: 'hard',
  tags: ['math', 'algorithm', 'number-theory'],
  description: `Bernoulli numbers are used in series expansions of several functions (trigonometric, hyperbolic, gamma, etc.) and are extremely important in number theory and analysis.

The nᵗʰ Bernoulli number is expressed as Bₙ. This task uses the modern usage (NIST convention).

Task: Show Bernoulli numbers B₀ through B₆₀, suppress zeros (all odd Bₙ except B₁ are zero), express as reduced fractions, and index each number.

The Akiyama-Tanigawa algorithm computes Bernoulli numbers iteratively using a triangular array.`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/Bernoulli_numbers',
  createdAt: '2025-11-30',
  previewImage: '/previews/bernoulli-numbers.png',
};
