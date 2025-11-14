import { useState, useEffect } from 'react';
import { Home, Shuffle, Info } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { useProblems } from '../hooks/useProblems';

export default function FloatingNav() {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { problems } = useProblems();

  useEffect(() => {
    const handleScroll = () => {
      // Show nav after scrolling down 100px
      setIsVisible(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleRandomProblem = () => {
    if (problems.length > 0) {
      const randomProblem = problems[Math.floor(Math.random() * problems.length)];
      navigate(`/visualizations/${randomProblem.slug}`);
    }
  };

  const isHomePage = location.pathname === '/';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.nav
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-slate-900/80 border-b border-slate-700/50 shadow-lg"
        >
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              {/* Logo/Brand */}
              <Link
                to="/"
                className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 transition-all"
              >
                Rosetta Code Hub
              </Link>

              {/* Navigation Links */}
              <div className="flex items-center gap-3 md:gap-4">
                {/* Problem Count Badge */}
                {problems.length > 0 && (
                  <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <span className="font-semibold">{problems.length}</span>
                    <span className="text-slate-400">Problems</span>
                  </span>
                )}

                {/* Home Button - only show when not on home page */}
                {!isHomePage && (
                  <Link
                    to="/"
                    className="flex items-center gap-1.5 text-slate-300 hover:text-cyan-400 transition-colors text-sm"
                    aria-label="Go to home page"
                  >
                    <Home size={18} />
                    <span className="hidden sm:inline">Home</span>
                  </Link>
                )}

                {/* Random Problem Button */}
                <button
                  onClick={handleRandomProblem}
                  disabled={problems.length === 0}
                  className="flex items-center gap-1.5 text-slate-300 hover:text-cyan-400 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="View random problem"
                >
                  <Shuffle size={18} />
                  <span className="hidden sm:inline">Random</span>
                </button>

                {/* About Button */}
                <Link
                  to="/about"
                  className="flex items-center gap-1.5 text-slate-300 hover:text-cyan-400 transition-colors text-sm"
                  aria-label="About this project"
                >
                  <Info size={18} />
                  <span className="hidden sm:inline">About</span>
                </Link>
              </div>
            </div>
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
