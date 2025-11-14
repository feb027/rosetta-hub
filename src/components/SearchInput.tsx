import { useState } from 'react';
import { Search, X } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchInput({ 
  value, 
  onChange, 
  placeholder = 'Search problems...' 
}: SearchInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = () => {
    onChange('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Clear search on Escape key
    if (e.key === 'Escape' && value) {
      handleClear();
      e.preventDefault();
    }
  };

  return (
    <div className="relative w-full">
      {/* Search Icon */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center justify-center z-10">
        <Search size={20} strokeWidth={2} />
      </div>

      {/* Input Field */}
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        aria-label="Search problems by title"
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
        <button
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center z-10"
        >
          <X size={18} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}
