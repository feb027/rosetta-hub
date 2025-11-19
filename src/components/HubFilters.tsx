import { useState, useEffect, memo } from 'react';
import { X, ChevronDown, ArrowUpDown, Minimize2, Maximize2, Filter } from 'lucide-react';
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
  'search',
  'graph',
  'dynamic-programming',
  'greedy',
  'simulation',
  'optimization',
  'game',
  'puzzle',
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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-4 border border-slate-700/50 relative shadow-xl shadow-black/20 backdrop-blur-xl overflow-hidden"
    >
      {/* Ambient Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Row: Search & Primary Controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between relative z-10">
        {/* Search - Expands to fill space */}
        <div className="flex-1 w-full">
          <SearchInput
            value={searchTerm}
            onChange={onSearchChange}
            placeholder="Search problems..."
            problems={problems}
          />
        </div>

        {/* Right Side Controls: Sort & Compact */}
        <div className="flex items-center gap-3 w-full lg:w-auto">
          {/* Sort Dropdown - Now on top row */}
          <div className="relative group flex-1 lg:flex-none">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10 text-slate-400 group-hover:text-cyan-400 transition-colors">
              <ArrowUpDown size={14} />
            </div>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="w-full lg:w-48 appearance-none pl-9 pr-8 py-2.5 rounded-xl text-sm font-medium text-slate-200 bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all cursor-pointer outline-none shadow-sm"
              aria-label="Sort problems by"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value} className="bg-slate-900 text-slate-200">
                  {option.label}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none z-10 text-slate-500">
              <ChevronDown size={14} />
            </div>
          </div>

          {/* Compact Toggle */}
          <button
            onClick={() => setIsCompact(!isCompact)}
            className="p-2.5 rounded-xl glass border border-slate-700/50 hover:border-cyan-500/30 text-slate-400 hover:text-cyan-400 transition-all group relative flex-shrink-0"
            aria-label={isCompact ? 'Expand filters' : 'Collapse filters'}
          >
            {isCompact ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
          </button>
        </div>
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
            <div className="pt-4">
              {/* Secondary Filters Row */}
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                
                {/* Left: Difficulty & Tags Toggle */}
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  <DifficultyFilter
                    selected={selectedDifficulty}
                    onChange={onDifficultyChange}
                  />

                  <div className="h-8 w-px bg-slate-700/50 hidden md:block" />

                  <button
                    onClick={() => setIsTagsExpanded(!isTagsExpanded)}
                    className={`flex items-center gap-2 text-sm font-medium transition-colors focus:outline-none px-3 py-2 rounded-lg border ${
                      isTagsExpanded 
                        ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' 
                        : 'bg-slate-800/30 text-slate-400 border-transparent hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <Filter size={14} />
                    <span>Tags</span>
                    {selectedTags.size > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-400 text-xs font-bold">
                        {selectedTags.size}
                      </span>
                    )}
                    <ChevronDown size={12} className={`transition-transform duration-300 ${isTagsExpanded ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {/* Right: Clear Filters */}
                <AnimatePresence>
                  {activeFilterCount > 0 && (
                    <motion.button
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      onClick={onClearFilters}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/30 transition-all text-sm font-medium whitespace-nowrap w-full md:w-auto justify-center"
                    >
                      <X size={14} />
                      <span>Clear ({activeFilterCount})</span>
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              {/* Tags Dropdown Panel */}
              <AnimatePresence>
                {isTagsExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0, marginTop: 0 }}
                    animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
                    exit={{ height: 0, opacity: 0, marginTop: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-slate-700/50 pt-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Select Tags</span>
                      
                      {/* Tag Logic Toggle */}
                      {selectedTags.size > 1 && (
                        <div className="flex items-center gap-1 bg-slate-900/50 p-0.5 rounded-lg border border-slate-700/50">
                          <button
                            onClick={() => onTagFilterModeChange('OR')}
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all ${
                              tagFilterMode === 'OR'
                                ? 'bg-cyan-500 text-slate-900 shadow-sm'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            ANY
                          </button>
                          <button
                            onClick={() => onTagFilterModeChange('AND')}
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all ${
                              tagFilterMode === 'AND'
                                ? 'bg-cyan-500 text-slate-900 shadow-sm'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            ALL
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="bg-slate-900/30 rounded-xl p-3 border border-slate-700/30 inner-shadow">
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
    </motion.div>
  );
}

export default memo(HubFilters);
