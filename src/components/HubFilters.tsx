import { useState, useEffect, memo } from 'react';
import { X, ChevronDown, ChevronUp, ArrowUpDown, Minimize2, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SearchInput from './SearchInput';
import DifficultyFilter from './DifficultyFilter';
import TagFilter from './TagFilter';
import type { Difficulty, Tag } from '../types/problem';
import type { TagFilterMode } from '../utils/filterProblems';

export type SortOption = 'title-asc' | 'title-desc' | 'difficulty-asc' | 'difficulty-desc' | 'newest' | 'oldest';

interface HubFiltersProps {
  searchTerm: string;
  selectedDifficulty: Difficulty | 'all';
  selectedTags: Set<Tag>;
  tagFilterMode: TagFilterMode;
  sortBy: SortOption;
  problems?: any[];
  onSearchChange: (value: string) => void;
  onDifficultyChange: (value: Difficulty | 'all') => void;
  onTagToggle: (tag: Tag) => void;
  onTagFilterModeChange: (mode: TagFilterMode) => void;
  onSortChange: (value: SortOption) => void;
  onClearFilters: () => void;
  activeFilterCount: number;
}

const availableTags: Tag[] = [
  'algorithm',
  'data-structure',
  'math',
  'string',
  'array',
  'recursion',
  'sorting',
  'graph',
  'dynamic-programming',
  'greedy',
];

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'title-asc', label: 'Title (A-Z)' },
  { value: 'title-desc', label: 'Title (Z-A)' },
  { value: 'difficulty-asc', label: 'Difficulty (Easy → Hard)' },
  { value: 'difficulty-desc', label: 'Difficulty (Hard → Easy)' },
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
];

function HubFilters({
  searchTerm,
  selectedDifficulty,
  selectedTags,
  tagFilterMode,
  sortBy,
  problems = [],
  onSearchChange,
  onDifficultyChange,
  onTagToggle,
  onTagFilterModeChange,
  onSortChange,
  onClearFilters,
  activeFilterCount,
}: HubFiltersProps) {
  const [isTagsExpanded, setIsTagsExpanded] = useState(false);
  
  // Load compact state from localStorage
  const [isCompact, setIsCompact] = useState(() => {
    const saved = localStorage.getItem('filters-compact');
    return saved === 'true';
  });

  // Save compact state to localStorage
  useEffect(() => {
    localStorage.setItem('filters-compact', isCompact.toString());
  }, [isCompact]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to toggle compact view
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCompact(prev => !prev);
      }
      // Ctrl/Cmd + Shift + C to clear filters
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        if (activeFilterCount > 0) {
          onClearFilters();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFilterCount, onClearFilters]);

  return (
    <div className="glass rounded-xl p-6 md:p-8 border border-slate-600/50 relative">

      {/* Compact/Expand Toggle */}
      <button
        onClick={() => setIsCompact(!isCompact)}
        className="absolute top-4 right-4 z-10 p-2 rounded-lg glass border border-slate-600/50 hover:border-cyan-500/50 text-slate-400 hover:text-cyan-400 transition-all group"
        title={isCompact ? 'Expand filters (Ctrl+K)' : 'Collapse filters (Ctrl+K)'}
        aria-label={isCompact ? 'Expand filters' : 'Collapse filters'}
      >
        {isCompact ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
        <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-800 text-xs text-slate-300 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          {isCompact ? 'Expand' : 'Collapse'} <kbd className="ml-1 px-1 bg-slate-700 rounded">Ctrl+K</kbd>
        </span>
      </button>

      {/* Top Row: Search */}
      <div className="mb-4 pr-12">
        <SearchInput
          value={searchTerm}
          onChange={onSearchChange}
          placeholder="Search problems..."
          problems={problems}
        />
      </div>

      <AnimatePresence initial={false}>
        {!isCompact && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >

            {/* Second Row: Difficulty + Sort + Clear */}
            <div className="flex flex-col md:flex-row gap-3 -mx-2 px-2">
        {/* Difficulty Filter */}
        <div className="flex-shrink-0">
          <DifficultyFilter
            selected={selectedDifficulty}
            onChange={onDifficultyChange}
          />
        </div>

        {/* Sort Dropdown */}
        <div className="flex-shrink-0">
          <div className="relative glass rounded-lg border border-slate-600/50 hover:border-slate-500 focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-400/50 transition-all">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
              <ArrowUpDown size={16} className="text-slate-400" />
            </div>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="w-full md:w-auto pl-10 pr-10 py-2 rounded-lg text-sm text-slate-300 bg-transparent border-0 focus:outline-none cursor-pointer appearance-none relative z-20 sort-dropdown"
              aria-label="Sort problems by"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
              <ChevronDown size={14} className="text-slate-400" />
            </div>
          </div>
        </div>

        {/* Spacer on desktop */}
        <div className="hidden md:block flex-1 min-w-0" />

              {/* Clear Button - full width on mobile, auto on desktop */}
              <AnimatePresence>
                {activeFilterCount > 0 && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="flex-shrink-0"
                  >
                    <button
                      onClick={onClearFilters}
                      aria-label={`Clear ${activeFilterCount} active ${activeFilterCount === 1 ? 'filter' : 'filters'}`}
                      className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/50 transition-all duration-250 focus:outline-none focus:ring-2 focus:ring-red-400 whitespace-nowrap"
                    >
                      <X size={16} />
                      <span className="text-sm font-medium">Clear ({activeFilterCount})</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Tags Section - Improved */}
            <div className="mt-4 border-t border-slate-600/50 pt-4 -mx-2 px-2">
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setIsTagsExpanded(!isTagsExpanded)}
                  className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400/50 rounded-lg px-3 py-2 hover:bg-slate-700/30"
                  aria-expanded={isTagsExpanded}
                >
                  <span>
                    Tags
                    {selectedTags.size > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-2 px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-semibold"
                      >
                        {selectedTags.size}
                      </motion.span>
                    )}
                  </span>
                  {isTagsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {/* AND/OR Toggle - only show when tags are selected */}
                <AnimatePresence>
                  {selectedTags.size > 1 && isTagsExpanded && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex items-center gap-1 text-xs"
                    >
                      <span className="text-slate-500 mr-1">Match:</span>
                      <button
                        onClick={() => onTagFilterModeChange('OR')}
                        className={`px-2 py-1 rounded transition-all ${
                          tagFilterMode === 'OR'
                            ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50'
                            : 'bg-slate-700/50 text-slate-400 border border-slate-600/50 hover:bg-slate-700'
                        }`}
                        aria-pressed={tagFilterMode === 'OR'}
                        title="Show problems with ANY selected tag"
                      >
                        ANY
                      </button>
                      <button
                        onClick={() => onTagFilterModeChange('AND')}
                        className={`px-2 py-1 rounded transition-all ${
                          tagFilterMode === 'AND'
                            ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50'
                            : 'bg-slate-700/50 text-slate-400 border border-slate-600/50 hover:bg-slate-700'
                        }`}
                        aria-pressed={tagFilterMode === 'AND'}
                        title="Show problems with ALL selected tags"
                      >
                        ALL
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <AnimatePresence>
                {isTagsExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {selectedTags.size > 1 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mb-2 text-xs text-slate-400 px-2"
                      >
                        {tagFilterMode === 'OR' 
                          ? '✨ Showing problems with ANY of the selected tags' 
                          : '🎯 Showing problems with ALL selected tags'}
                      </motion.div>
                    )}
                    <div className="max-h-40 overflow-y-auto scrollbar-thin pb-1">
                      <TagFilter
                        availableTags={availableTags}
                        selectedTags={selectedTags}
                        onToggle={onTagToggle}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default memo(HubFilters);
