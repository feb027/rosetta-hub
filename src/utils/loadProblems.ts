import type { ProblemMeta } from '../types/problem';

/**
 * Dynamically loads all problem metadata from the problems directory
 * @returns Sorted array of ProblemMeta objects (easy > medium > hard, then alphabetically)
 */
export async function loadProblems(): Promise<ProblemMeta[]> {
  // Use Vite's import.meta.glob for dynamic imports with eager loading
  const metaModules = import.meta.glob<{ meta: ProblemMeta }>(
    '../problems/*/meta.ts',
    { eager: true }
  );

  // Extract meta objects from imported modules
  const problems = Object.values(metaModules).map((module) => module.meta);

  // Sort problems by difficulty (easy > medium > hard) then alphabetically
  const difficultyOrder: Record<ProblemMeta['difficulty'], number> = {
    easy: 1,
    medium: 2,
    hard: 3,
  };

  return problems.sort((a, b) => {
    // First, sort by difficulty
    const diffComparison = difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
    if (diffComparison !== 0) {
      return diffComparison;
    }
    
    // If same difficulty, sort alphabetically by title
    return a.title.localeCompare(b.title);
  });
}
