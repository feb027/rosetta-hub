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
    tags: ['algorithm', 'recursion', 'dynamic-programming', 'greedy', 'optimization']
  },
  {
    name: 'Data Structures',
    icon: '📦',
    tags: ['data-structure', 'array', 'graph']
  },
  {
    name: 'Operations',
    icon: '⚙️',
    tags: ['sorting', 'math', 'string', 'simulation']
  }
];
