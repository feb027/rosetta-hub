import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: 'AGM / Calculate Pi',
  slug: 'agm-calculate-pi',
  difficulty: 'hard',
  tags: ['math', 'algorithm', 'number-theory'],
  description: `Use the Arithmetic-Geometric Mean to calculate π with high precision.

The Gauss-Legendre algorithm uses AGM iteration:
• aₙ₊₁ = (aₙ + bₙ) / 2
• bₙ₊₁ = √(aₙ × bₙ)
• cₙ₊₁ = aₙ² - bₙ²
• π ≈ 4a²ₙ / (1 - Σ 2^(k+1) × cₖ)

This algorithm converges quadratically — each iteration roughly doubles the number of correct digits! It's one of the fastest known methods for computing π.`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/Arithmetic-geometric_mean/Calculate_Pi',
  createdAt: '2025-11-30',
  previewImage: '/previews/agm-calculate-pi.png',
};
