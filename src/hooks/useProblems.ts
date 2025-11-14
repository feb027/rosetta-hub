import { useState, useEffect } from 'react';
import { loadProblems } from '../utils/loadProblems';
import type { ProblemMeta } from '../types/problem';

/**
 * Custom hook to load and cache problem data
 * @returns Object with problems array and loading state
 */
export function useProblems(): { problems: ProblemMeta[]; isLoading: boolean } {
  const [problems, setProblems] = useState<ProblemMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    loadProblems().then((loadedProblems) => {
      setProblems(loadedProblems);
      setIsLoading(false);
    });
  }, []);

  return { problems, isLoading };
}
