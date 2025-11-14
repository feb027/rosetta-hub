import { useState, useEffect, useRef, memo } from 'react';
import { Search, X, Clock, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { ProblemMeta } from '../types/problem';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  problems?: ProblemMeta[];
}

const SEARCH_HISTORY_KEY = 'rosetta-search-history';
const MAX_HISTORY_ITEMS = 5;

function SearchInput({ 
  value, 
  onChange, 
  placeholder = 'Search problems...',
  problems = []
}: SearchInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Load search history from localStorage
  useEffect(() => {
    const history = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  }, []);

  // Save to history when search is performed
  const saveToHistory = (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    
    const newHistory = [
      searchTerm,
      ...searchHistory.filter(item => item !== searchTerm)
    ].slice(0, MAX_HISTORY_ITEMS);
    
    setSearchHistory(newHistory);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
  };

  // Get suggestions based on current input
  const suggestions = value.trim() 
    ? problems
        .filter(p => p.title.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 5)
        .map(p => p.title)
    : searchHistory;

  const handleClear = () => {
    onChange('');
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const handleSelectSuggestion = (suggestion: string) => {
    onChange(suggestion);
    saveToHistory(suggestion);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Clear search on Escape key
    if (e.key === 'Escape') {
      if (showSuggestions) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      } else if (value) {
        handleClear();
      }
      e.preventDefault();
      return;
    }

    // Navigate suggestions with arrow keys
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % suggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        handleSelectSuggestion(suggestions[selectedIndex]);
      }
    } else if (e.key === 'Enter' && value.trim()) {
      saveToHistory(value.trim());
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    setShowSuggestions(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Delay to allow click on suggestions
    setTimeout(() => setShowSuggestions(false), 200);
  };

  return (
    <div className="relative w-full">
      {/* Search Icon */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center justify-center z-10">
        <Search size={20} strokeWidth={2} />
      </div>

      {/* Help Tooltip */}
      <div className="absolute right-14 top-1/2 -translate-y-1/2 z-10 group">
        <HelpCircle size={16} className="text-slate-500 cursor-help" />
        <div className="absolute right-0 top-full mt-2 w-64 p-3 glass rounded-lg border border-slate-600/50 text-xs text-slate-300 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none">
          <div className="font-semibold mb-1 text-cyan-400">Search Tips:</div>
          <ul className="space-y-1">
            <li>• Type to search problem titles</li>
            <li>• Use ↑↓ to navigate suggestions</li>
            <li>• Press <kbd className="px-1 py-0.5 bg-slate-700 rounded text-[10px]">Esc</kbd> to clear</li>
            <li>• Recent searches shown when empty</li>
          </ul>
        </div>
      </div>

      {/* Input Field */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        aria-label="Search problems by title"
        aria-autocomplete="list"
        aria-controls="search-suggestions"
        aria-expanded={showSuggestions && suggestions.length > 0}
        className={`
          w-full pl-12 pr-12 py-3 rounded-lg
          glass text-slate-100 placeholder-slate-400
          border transition-all duration-250
          focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900
          ${isFocused ? 'border-cyan-500 glow-cyan' : 'border-slate-600/50'}
        `}
      />

      {/* Clear Button */}
      {value && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center z-10 w-10 h-10 min-w-[44px] min-h-[44px]"
        >
          <X size={18} strokeWidth={2} />
        </motion.button>
      )}

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            ref={suggestionsRef}
            id="search-suggestions"
            role="listbox"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 glass rounded-lg border border-slate-600/50 overflow-hidden z-50 shadow-xl"
          >
            <div className="py-2">
              {!value.trim() && searchHistory.length > 0 && (
                <div className="px-4 py-2 text-xs text-slate-500 flex items-center gap-2">
                  <Clock size={12} />
                  Recent Searches
                </div>
              )}
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  className={`
                    w-full px-4 py-2 text-left text-sm transition-colors
                    flex items-center gap-3
                    ${selectedIndex === index 
                      ? 'bg-cyan-500/20 text-cyan-300' 
                      : 'text-slate-300 hover:bg-slate-700/50'
                    }
                  `}
                  role="option"
                  aria-selected={selectedIndex === index}
                >
                  {!value.trim() && <Clock size={14} className="text-slate-500 flex-shrink-0" />}
                  <span className="flex-1 truncate">{suggestion}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default memo(SearchInput);
