import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: 'Animate a Pendulum',
  slug: 'animate-pendulum',
  difficulty: 'medium',
  tags: ['animation', 'simulation', 'math', 'visualization'],
  description: `Create a simple physical model of a pendulum and animate it.

One good way of making an animation is by simulating a physical system and illustrating the variables in that system using a dynamically changing graphical display.

The classic such physical system is a simple gravity pendulum. The pendulum swings back and forth under the influence of gravity, with its motion governed by the equation:

θ''(t) = -(g/L) × sin(θ)

where θ is the angle from vertical, g is gravitational acceleration, and L is the pendulum length.`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/Animate_a_pendulum',
  createdAt: '2025-11-30',
  previewImage: '/previews/animate-pendulum.png',
};
