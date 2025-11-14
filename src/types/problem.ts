// Type definitions for problem data and filter state

export type Difficulty = 'easy' | 'medium' | 'hard';

export type Tag =
  | 'algorithm'
  | 'data-structure'
  | 'math'
  | 'string'
  | 'array'
  | 'recursion'
  | 'sorting'
  | 'graph'
  | 'dynamic-programming'
  | 'greedy'
  | 'simulation'
  | 'optimization';

export interface ProblemMeta {
  title: string;
  slug: string;
  difficulty: Difficulty;
  tags: Tag[];
  description?: string;
  createdAt?: string;
  previewImage?: string;
}

export interface FilterState {
  searchTerm: string;
  difficulty: Difficulty | 'all';
  selectedTags: Set<Tag>;
}
