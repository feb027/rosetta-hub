import { useSearchParams } from 'react-router-dom';
import { useCallback } from 'react';
import type { Difficulty, Tag } from '../types/problem';

interface URLStateReturn {
  searchTerm: string;
  difficulty: Difficulty | 'all';
  selectedTags: Set<Tag>;
  updateFilters: (
    searchTerm: string,
    difficulty: Difficulty | 'all',
    selectedTags: Set<Tag>
  ) => void;
}

/**
 * Custom hook to synchronize filter state with URL query parameters
 * @returns Filter values and updateFilters function
 */
export function useURLState(): URLStateReturn {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read searchTerm from URL query params
  const searchTerm = searchParams.get('search') || '';

  // Read difficulty from URL query params with validation
  const difficultyParam = searchParams.get('difficulty');
  const difficulty: Difficulty | 'all' =
    difficultyParam === 'easy' ||
    difficultyParam === 'medium' ||
    difficultyParam === 'hard'
      ? difficultyParam
      : 'all';

  // Read tags from URL query params (comma-separated) and convert to Set
  const tagsParam = searchParams.get('tags');
  const selectedTags = new Set<Tag>(
    tagsParam
      ? (tagsParam.split(',').filter(Boolean) as Tag[])
      : []
  );

  // Implement updateFilters function to write to URL
  const updateFilters = useCallback(
    (
      newSearchTerm: string,
      newDifficulty: Difficulty | 'all',
      newSelectedTags: Set<Tag>
    ) => {
      const params = new URLSearchParams();

      // Add search term if not empty
      if (newSearchTerm.trim()) {
        params.set('search', newSearchTerm.trim());
      }

      // Add difficulty if not 'all'
      if (newDifficulty !== 'all') {
        params.set('difficulty', newDifficulty);
      }

      // Add tags if any selected
      if (newSelectedTags.size > 0) {
        params.set('tags', Array.from(newSelectedTags).join(','));
      }

      // Use replace: true to avoid history pollution
      setSearchParams(params, { replace: true });
    },
    [setSearchParams]
  );

  return {
    searchTerm,
    difficulty,
    selectedTags,
    updateFilters,
  };
}
