import { memo, useState, useCallback, useMemo } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MoreHorizontal } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
}

function Pagination({ currentPage, totalPages, onPageChange, siblingCount = 1 }: PaginationProps) {
  const [jumpValue, setJumpValue] = useState('');
  const [showJumpInput, setShowJumpInput] = useState(false);

  // Generate page numbers with ellipsis
  const pageNumbers = useMemo(() => {
    const pages: (number | 'ellipsis-start' | 'ellipsis-end')[] = [];
    
    // Always show first page
    pages.push(1);
    
    // Calculate range around current page
    const leftSibling = Math.max(2, currentPage - siblingCount);
    const rightSibling = Math.min(totalPages - 1, currentPage + siblingCount);
    
    // Add ellipsis after first page if needed
    if (leftSibling > 2) {
      pages.push('ellipsis-start');
    } else if (leftSibling === 2) {
      pages.push(2);
    }
    
    // Add pages around current page
    for (let i = leftSibling; i <= rightSibling; i++) {
      if (i !== 1 && i !== totalPages) {
        pages.push(i);
      }
    }
    
    // Add ellipsis before last page if needed
    if (rightSibling < totalPages - 1) {
      pages.push('ellipsis-end');
    } else if (rightSibling === totalPages - 1 && totalPages > 1) {
      pages.push(totalPages - 1);
    }
    
    // Always show last page (if more than 1 page)
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    
    return pages;
  }, [currentPage, totalPages, siblingCount]);

  const handleJumpSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const page = parseInt(jumpValue, 10);
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
      setJumpValue('');
      setShowJumpInput(false);
    }
  }, [jumpValue, totalPages, onPageChange]);

  const handleJumpKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowJumpInput(false);
      setJumpValue('');
    }
  }, []);

  return (
    <div className="mt-12 flex flex-col items-center gap-4">
      {/* Main Pagination Row */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* First Page Button */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all hidden sm:flex"
          title="First page"
          aria-label="Go to first page"
        >
          <ChevronsLeft size={18} />
        </button>

        {/* Previous Button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          aria-label="Go to previous page"
        >
          <ChevronLeft size={18} />
          <span className="hidden sm:inline text-sm">Prev</span>
        </button>
        
        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page) => {
            if (page === 'ellipsis-start' || page === 'ellipsis-end') {
              return (
                <button
                  key={page}
                  onClick={() => setShowJumpInput(true)}
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-500 hover:text-cyan-400 hover:bg-slate-800/50 transition-all"
                  title="Jump to page"
                  aria-label="Click to jump to a specific page"
                >
                  <MoreHorizontal size={18} />
                </button>
              );
            }
            
            return (
              <motion.button
                key={page}
                onClick={() => onPageChange(page)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`w-10 h-10 rounded-lg border transition-all font-medium text-sm ${
                  currentPage === page
                    ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]'
                    : 'bg-slate-800/30 border-slate-700/30 text-slate-500 hover:bg-slate-800/50 hover:text-slate-300 hover:border-slate-600/50'
                }`}
                aria-label={`Go to page ${page}`}
                aria-current={currentPage === page ? 'page' : undefined}
              >
                {page}
              </motion.button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          aria-label="Go to next page"
        >
          <span className="hidden sm:inline text-sm">Next</span>
          <ChevronRight size={18} />
        </button>

        {/* Last Page Button */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all hidden sm:flex"
          title="Last page"
          aria-label="Go to last page"
        >
          <ChevronsRight size={18} />
        </button>
      </div>

      {/* Jump to Page Input (shown when clicking ellipsis) */}
      {showJumpInput && (
        <motion.form
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          onSubmit={handleJumpSubmit}
          className="flex items-center gap-2"
        >
          <span className="text-slate-400 text-sm">Go to page:</span>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={jumpValue}
            onChange={(e) => setJumpValue(e.target.value)}
            onKeyDown={handleJumpKeyDown}
            autoFocus
            className="w-20 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-200 text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
            placeholder={`1-${totalPages}`}
          />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 text-sm hover:bg-cyan-500/30 transition-all"
          >
            Go
          </button>
          <button
            type="button"
            onClick={() => {
              setShowJumpInput(false);
              setJumpValue('');
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 text-sm hover:text-white hover:bg-slate-700/50 transition-all"
          >
            Cancel
          </button>
        </motion.form>
      )}

      {/* Page Info */}
      <div className="text-slate-500 text-xs">
        Page <span className="text-cyan-400 font-medium">{currentPage}</span> of{' '}
        <span className="text-slate-300">{totalPages}</span>
      </div>
    </div>
  );
}

export default memo(Pagination);
