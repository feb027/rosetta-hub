import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: 'Animation',
  slug: 'animation',
  difficulty: 'easy',
  tags: ['animation', 'string', 'visualization', 'loop'],
  description: `Create a window containing the string "Hello World! " (the trailing space is significant).

Make the text appear to be rotating right by periodically removing one letter from the end of the string and attaching it to the front.

When the user clicks on the (windowed) text, it should reverse its direction.

Animation is integral to many parts of GUIs, including both the fancy effects when things change in window managers, and of course games. The core of any animation system is a scheme for periodically changing the display while still remaining responsive to the user.`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/Animation',
  createdAt: '2025-11-30',
  previewImage: '/previews/animation.png',
};
