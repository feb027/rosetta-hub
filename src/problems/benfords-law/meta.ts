import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: "Benford's Law",
  slug: 'benfords-law',
  difficulty: 'medium',
  tags: ['math', 'algorithm', 'simulation', 'visualization'],
  description: `Benford's law, also called the first-digit law, refers to the frequency distribution of digits in many real-life sources of data. The number 1 occurs as the first digit about 30% of the time, while larger numbers occur less frequently.

A set of numbers satisfies Benford's law if the leading digit d (d ∈ {1,...,9}) occurs with probability:
P(d) = log₁₀(d + 1) - log₁₀(d) = log₁₀(1 + 1/d)

This task analyzes the first 1000 Fibonacci numbers to verify they follow Benford's law, comparing actual vs expected digit distributions.`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/Benford%27s_law',
  createdAt: '2025-11-30',
  previewImage: '/previews/benfords-law.png',
};
