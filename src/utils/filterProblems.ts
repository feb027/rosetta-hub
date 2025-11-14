import type { ProblemMeta, Difficulty, Tag } from '../types/problem';

/**
 * Filters problems based on search term, difficulty, and tags
 * @param problems - Array of all problems
 * @param searchTerm - Search term to filter by title (case-insensitive)
 * @param difficulty - Difficulty level to filter by ('all' for no filter)
 * @param selectedTags - Set of tags to filter by (OR logic - problem must have ANY selected tag)
 * @returns Filtered array of problems (AND logic - must match all criteria)
 */
export function filterProblems(
  problems: ProblemMeta[],
  searchTerm: string,
  difficulty: Difficulty | 'all',
  selectedTags: Set<Tag>
): ProblemMeta[] {
  return problems.filter((problem) => {
    // Search filter: case-insensitive title match
    const matchesSearch = problem.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase().trim());

    // Difficulty filter: exact match or 'all'
    const matchesDifficulty =
      difficulty === 'all' || problem.difficulty === difficulty;

    // Tag filter: OR logic - problem has ANY of the selected tags
    const matchesTags =
      selectedTags.size === 0 ||
      problem.tags.some((tag) => selectedTags.has(tag));

    // AND logic: must match all criteria
    return matchesSearch && matchesDifficulty && matchesTags;
  });
}
