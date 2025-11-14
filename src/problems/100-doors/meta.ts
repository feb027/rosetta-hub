import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: '100 Doors',
  slug: '100-doors',
  difficulty: 'easy',
  tags: ['algorithm', 'math', 'simulation', 'optimization'],
  description: `You have 100 doors in a row that are all initially closed. You make 100 passes by the doors. 
The first time through, visit every door and toggle the door (if the door is closed, open it; if it is open, close it). 
The second time, only visit every 2nd door (door #2, #4, #6, ...), and toggle it. 
The third time, visit every 3rd door (door #3, #6, #9, ...), etc, until you only visit the 100th door.

Question: What state are the doors in after the last pass? Which are open, which are closed?

Alternate: The only doors that remain open are those whose numbers are perfect squares. Why?`,
  createdAt: '2024-01-15',
  previewImage: '/previews/100-doors.png',
};
