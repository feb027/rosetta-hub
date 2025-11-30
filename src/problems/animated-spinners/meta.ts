import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: 'Animated Spinners',
  slug: 'animated-spinners',
  difficulty: 'easy',
  tags: ['graphics', 'visualization', 'animation'],
  description: `Create and display five spinners: one spinner in the middle and four spinners surrounding it.

Each spinner is created by drawing radius lines around a center axis and then looping through the drawing to simulate a moving clock hand.

When the loop is sped up, the illusion of a spinner is created. A fast animation will fill in more radial lines with a pleasing appearance.

Stretch goal: Allow offsetting the spinners with mouse movement.`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/Animated_Spinners',
  createdAt: '2025-11-30',
  previewImage: '/previews/animated-spinners.png',
};
