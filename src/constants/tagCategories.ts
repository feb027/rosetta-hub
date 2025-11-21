import type { Tag } from '../types/problem';

export interface TagCategory {
  name: string;
  tags: Tag[];
  icon: string;
}

export const TAG_CATEGORIES: TagCategory[] = [
  {
    name: 'Concepts',
    icon: '💡',
    tags: ['algorithm', 'recursion', 'dynamic-programming', 'greedy', 'optimization', 'combinatorics', 'loop', 'processing', 'algebra', 'number-theory', 'closure', 'function']
  },
  {
    name: 'Data Structures',
    icon: '📦',
    tags: ['data-structure', 'array', 'graph']
  },
  {
    name: 'Operations',
    icon: '⚙️',
    tags: ['sorting', 'search', 'math', 'string', 'simulation']
  },
  {
    name: 'Interactive',
    icon: '🎮',
    tags: ['game', 'puzzle', 'visualization', 'graphics', 'cellular-automaton', 'backtracking', 'generator']
  }
];
