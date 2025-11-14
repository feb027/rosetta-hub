import { SearchX } from 'lucide-react';

interface EmptyStateProps {
  onClearFilters: () => void;
}

export default function EmptyState({ onClearFilters }: EmptyStateProps) {
  return (
    <div 
      role="status" 
      aria-live="polite"
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      {/* Icon */}
      <div className="mb-6 text-slate-500">
        <SearchX size={64} strokeWidth={1.5} />
      </div>

      {/* Message */}
      <h3 className="text-2xl font-semibold text-slate-200 mb-2">
        No problems found
      </h3>
      <p className="text-slate-400 mb-6 max-w-md">
        No problems match your current filters. Try adjusting your search criteria or clearing filters to see more results.
      </p>

      {/* Clear Filters Button */}
      <button
        onClick={onClearFilters}
        className="px-6 py-3 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/50 hover:border-cyan-500 transition-all duration-250 font-medium"
      >
        Clear All Filters
      </button>
    </div>
  );
}
