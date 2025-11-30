import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: 'Balanced Ternary',
  slug: 'balanced-ternary',
  difficulty: 'medium',
  tags: ['math', 'number-theory', 'algorithm'],
  description: `Balanced ternary is a way of representing numbers. Unlike binary (base 2), balanced ternary is base 3, where each digit (trit) can have values: +1, 0, or -1 (written as +, 0, -).

Examples:
• Decimal 11 = 3² + 3¹ - 3⁰ = 9 + 3 - 1 → written as "++-"
• Decimal 6 = 3² - 3¹ + 0×3⁰ = 9 - 3 + 0 → written as "+-0"

The task involves converting between decimal and balanced ternary, and performing arithmetic operations directly on balanced ternary numbers.`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/Balanced_ternary',
  createdAt: '2025-11-30',
  previewImage: '/previews/balanced-ternary.png',
};
