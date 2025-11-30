import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import HubFilters, { type SortOption } from '../components/HubFilters';
import ProblemGrid from '../components/ProblemGrid';
import Pagination from '../components/Pagination';
import type { Difficulty, Tag, ProblemMeta } from '../types/problem';
import { useProblems } from '../hooks/useProblems';
import { useDebounce } from '../hooks/useDebounce';
import { filterProblems, type TagFilterMode } from '../utils/filterProblems';
import { useURLState } from '../hooks/useURLState';

export default function HomePage() {
  // Load problems dynamically
  const { problems, isLoading } = useProblems();

  // Get filter state from URL
  const { searchTerm: urlSearchTerm, difficulty: urlDifficulty, selectedTags: urlSelectedTags, page: urlPage, updateFilters, updatePage } = useURLState();

  // Local state for immediate UI updates (before debounce)
  const [searchTerm, setSearchTerm] = useState(urlSearchTerm);
  const [difficulty, setDifficulty] = useState<Difficulty | 'all'>(urlDifficulty);
  const [selectedTags, setSelectedTags] = useState<Set<Tag>>(urlSelectedTags);
  const [tagFilterMode, setTagFilterMode] = useState<TagFilterMode>('OR');
  const [sortBy, setSortBy] = useState<SortOption>('difficulty-asc');

  // Pagination State - initialized from URL
  const [currentPage, setCurrentPage] = useState(urlPage);
  const ITEMS_PER_PAGE = 9;

  // Debounce search term for better performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Track previous filter values to detect actual changes
  const [prevFilters, setPrevFilters] = useState({
    search: debouncedSearchTerm,
    difficulty,
    tags: Array.from(selectedTags).join(','),
  });

  // Update URL when filters change (using debounced search)
  useEffect(() => {
    const currentFilters = {
      search: debouncedSearchTerm,
      difficulty,
      tags: Array.from(selectedTags).join(','),
    };

    const filtersChanged =
      prevFilters.search !== currentFilters.search ||
      prevFilters.difficulty !== currentFilters.difficulty ||
      prevFilters.tags !== currentFilters.tags;

    if (filtersChanged) {
      updateFilters(debouncedSearchTerm, difficulty, selectedTags, 1);
      setCurrentPage(1);
      setPrevFilters(currentFilters);
    }
  }, [debouncedSearchTerm, difficulty, selectedTags, updateFilters, prevFilters]);

  // Sync currentPage with URL when navigating back
  useEffect(() => {
    setCurrentPage(urlPage);
  }, [urlPage]);

  // Memoize handler functions to prevent unnecessary re-renders
  const handleTagToggle = useCallback((tag: Tag) => {
    setSelectedTags((prevTags) => {
      const newTags = new Set(prevTags);
      if (newTags.has(tag)) {
        newTags.delete(tag);
      } else {
        newTags.add(tag);
      }
      return newTags;
    });
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setDifficulty('all');
    setSelectedTags(new Set());
    setTagFilterMode('OR');
    setSortBy('difficulty-asc');
    setCurrentPage(1);
    updatePage(1);
  }, [updatePage]);

  // Sort problems based on selected option
  const sortProblems = useCallback((problemsToSort: ProblemMeta[]): ProblemMeta[] => {
    const sorted = [...problemsToSort];
    
    switch (sortBy) {
      case 'title-asc':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case 'title-desc':
        return sorted.sort((a, b) => b.title.localeCompare(a.title));
      case 'difficulty-asc':
        const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
        return sorted.sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]);
      case 'difficulty-desc':
        const difficultyOrderDesc = { easy: 3, medium: 2, hard: 1 };
        return sorted.sort((a, b) => difficultyOrderDesc[a.difficulty] - difficultyOrderDesc[b.difficulty]);
      case 'newest':
        return sorted.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
      case 'oldest':
        return sorted.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateA - dateB;
        });
      default:
        return sorted;
    }
  }, [sortBy]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (difficulty !== 'all') count++;
    if (selectedTags.size > 0) count += selectedTags.size;
    return count;
  }, [searchTerm, difficulty, selectedTags]);

  // Filter and sort problems
  const filteredProblems = useMemo(() => {
    const filtered = filterProblems(problems, debouncedSearchTerm, difficulty, selectedTags, tagFilterMode);
    return sortProblems(filtered);
  }, [problems, debouncedSearchTerm, difficulty, selectedTags, tagFilterMode, sortProblems]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredProblems.length / ITEMS_PER_PAGE);
  const paginatedProblems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProblems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProblems, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updatePage(page);
    window.scrollTo({ top: 300, behavior: 'smooth' }); // Scroll to top of grid
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Static Header for Accessibility */}
        <header className="flex items-center justify-between py-6 mb-8 relative z-20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-cyan-500/20">
              R
            </div>
            <span className="font-bold text-xl text-slate-200 tracking-tight">Rosetta Hub</span>
          </div>
          <nav>
            <a 
              href="/about" 
              className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all text-sm font-medium"
            >
              About Project
            </a>
            <a 
              href="/changelog" 
              className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all text-sm font-medium"
            >
              Changelog
            </a>
          </nav>
        </header>

        {/* Hero Section */}
        <div className="mb-16 text-center relative">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative inline-block"
          >
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-400 to-cyan-300 animate-gradient-x bg-[length:200%_auto]">
                Rosetta Code Hub
              </span>
            </h1>
            
            {/* Decorative Elements */}
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="absolute -top-8 -right-8 text-cyan-400/20 animate-pulse"
            >
              <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z"/>
              </svg>
            </motion.div>
          </motion.div>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
          >
            Explore classic programming problems transformed into <span className="text-cyan-300 font-medium text-glow">beautiful visualizations</span>
          </motion.p>
        </div>

        {/* Filters Section */}
        <div className="mb-8">
          <HubFilters
            searchTerm={searchTerm}
            selectedDifficulty={difficulty}
            selectedTags={selectedTags}
            tagFilterMode={tagFilterMode}
            sortBy={sortBy}
            problems={problems}
            onSearchChange={setSearchTerm}
            onDifficultyChange={setDifficulty}
            onTagToggle={handleTagToggle}
            onTagFilterModeChange={setTagFilterMode}
            onSortChange={setSortBy}
            onClearFilters={handleClearFilters}
            activeFilterCount={activeFilterCount}
          />
        </div>

        {/* Results Count with Subtle Animation */}
        {problems.length > 0 && (
          <div className="mb-6 text-center" aria-live="polite" aria-atomic="true">
            <p className="text-slate-400 text-sm">
              Showing{' '}
              <span className="text-cyan-400 font-semibold">
                {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredProblems.length)}
                -
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredProblems.length)}
              </span>{' '}
              of{' '}
              <span className="text-slate-300 font-semibold">
                {filteredProblems.length}
              </span>{' '}
              {filteredProblems.length === 1 ? 'problem' : 'problems'}
            </p>
          </div>
        )}

        {/* Problem Grid */}
        <ProblemGrid problems={paginatedProblems} onClearFilters={handleClearFilters} isLoading={isLoading} />

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </div>
  );
}
