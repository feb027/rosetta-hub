import { useState, useEffect } from 'react';
import { loadProblems } from '../utils/loadProblems';
import type { ProblemMeta } from '../types/problem';

/**
 * Custom hook to load and cache problem data
 * @returns Array of ProblemMeta objects
 */
export function useProblems(): ProblemMeta[] {
  const [problems, setProblems] = useState<ProblemMeta[]>([]);

  useEffect(() => {
    loadProblems().then((loadedProblems) => {
      setProblems(loadedProblems);
    });
  }, []);

  return problems;
}
