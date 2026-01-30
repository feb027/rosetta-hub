import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: 'Bernstein Basis Polynomials',
  slug: 'bernstein-basis-polynomials',
  difficulty: 'medium',
  tags: ['math', 'graphics', 'algorithm', 'visualization'],
  description: `Bernstein basis polynomials are fundamental building blocks used in computer graphics, particularly for Bézier curves. Given a degree n, the basis polynomials Bₖ,ₙ(t) are defined as:

Bₖ,ₙ(t) = C(n,k) · tᵏ · (1-t)ⁿ⁻ᵏ

where C(n,k) is the binomial coefficient.

Key properties:
• Partition of unity: Sum of all basis polynomials equals 1 for any t ∈ [0,1]
• Non-negative: All values are ≥ 0 in [0,1]
• Symmetry: Bₖ,ₙ(t) = Bₙ₋ₖ,ₙ(1-t)
• Maximum at t = k/n

These polynomials form the mathematical foundation for Bézier curves, B-splines, and many CAD/CAM applications.`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/Bernstein_basis_polynomials',
  createdAt: '2025-01-30',
  previewImage: '/previews/bernstein-basis-polynomials.png',
};
