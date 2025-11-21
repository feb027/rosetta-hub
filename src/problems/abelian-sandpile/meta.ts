import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
    title: 'Abelian sandpile model',
    slug: 'abelian-sandpile',
    difficulty: 'medium',
    tags: ['cellular-automaton', 'simulation', 'graphics', 'visualization'],
    description: `
    The Abelian sandpile model (or Bak–Tang–Wiesenfeld model) is a cellular automaton.
    
    It consists of a grid of "sandpiles". When a pile has 4 or more grains, it becomes unstable and topples, distributing one grain to each of its 4 neighbors (North, South, East, West).
    This simple rule produces complex, fractal-like patterns known as the "identity element" of the sandpile group.
  `,
    rosettaCodeUrl: 'https://rosettacode.org/wiki/Abelian_sandpile_model',
    createdAt: '2025-11-19',
};
