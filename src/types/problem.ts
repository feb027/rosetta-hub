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
  | 'search'
  | 'graph'
  | 'dynamic-programming'
  | 'greedy'
  | 'simulation'
  | 'optimization'
  | 'game'
  | 'puzzle'
  | 'visualization'
  | 'combinatorics'
  | 'loop'
  | 'processing'
  | 'backtracking'
  | 'cellular-automaton'
  | 'graphics'
  | 'algebra'
  | 'number-theory'
  | 'closure'
  | 'function'
  | 'generator';

export interface ProblemMeta {
  title: string;
  slug: string;
  difficulty: Difficulty;
  tags: Tag[];
  description?: string;
  rosettaCodeUrl?: string; // Link to original Rosetta Code problem
  createdAt?: string;
  previewImage?: string;
}

export interface FilterState {
  searchTerm: string;
  difficulty: Difficulty | 'all';
  selectedTags: Set<Tag>;
}
