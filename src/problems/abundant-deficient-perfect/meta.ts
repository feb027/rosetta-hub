import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: 'Abundant, Deficient and Perfect Number Classifications',
  slug: 'abundant-deficient-perfect',
  difficulty: 'easy',
  tags: ['math', 'number-theory', 'algorithm', 'visualization'],
  description: `Classify integers based on their proper divisors sum.

Let P(n) be the sum of proper divisors of n (all positive divisors except n itself).

• If P(n) < n → Deficient (most common)
• If P(n) = n → Perfect (rare and special)
• If P(n) > n → Abundant (overflow of divisors)

Example: 6 has divisors 1, 2, 3. Sum = 6 = n, so 6 is Perfect!

Task: Count how many integers from 1 to 20,000 fall into each class.`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/Abundant,_deficient_and_perfect_number_classifications',
  createdAt: '2025-11-30',
  previewImage: '/previews/abundant-deficient-perfect.png',
};
