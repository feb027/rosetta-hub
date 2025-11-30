import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: 'Apply a Digital Filter (Direct Form II Transposed)',
  slug: 'digital-filter',
  difficulty: 'hard',
  tags: ['math', 'algorithm', 'processing'],
  description: `Digital filters apply mathematical operations to sampled signals. The "direct form II transposed" formulation can represent both infinite impulse response (IIR) and finite impulse response (FIR) filters, and is more numerically stable than other forms.

The task is to filter a signal using an order 3 low-pass Butterworth filter with given coefficients a and b.`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/Apply_a_digital_filter_(direct_form_II_transposed)',
  createdAt: '2025-11-30',
  previewImage: '/previews/digital-filter.png',
};
