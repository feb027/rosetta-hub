import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: 'Active Object',
  slug: 'active-object',
  difficulty: 'medium',
  tags: ['simulation', 'math', 'algorithm', 'processing'],
  description: `Implement an active integrator object that accumulates input over time.

The object integrates its input K(t) using the trapezoid method:
S = S + (K(t₁) + K(t₀)) × (t₁ - t₀) / 2

Test procedure:
1. Set input to sin(2π × 0.5 × t) for 2 seconds
2. Set input to 0 for 0.5 seconds
3. Verify output ≈ 0 (sine integrates to ~0 over full period)

This demonstrates active objects - objects whose state changes with time independently.`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/Active_object',
  createdAt: '2025-11-30',
  previewImage: '/previews/active-object.png',
};
