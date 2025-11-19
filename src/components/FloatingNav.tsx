import { useState, useEffect } from 'react';
import { Home, Shuffle, Info, Menu, X } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useProblems } from '../hooks/useProblems';

export default function FloatingNav() {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { problems } = useProblems();

  useEffect(() => {
    const handleScroll = () => {
      // Show nav after scrolling down 100px
      setIsVisible(window.scrollY > 100);
      if (window.scrollY <= 100) setIsMobileMenuOpen(false);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleRandomProblem = () => {
    if (problems.length > 0) {
      const randomProblem = problems[Math.floor(Math.random() * problems.length)];
      navigate(`/visualizations/${randomProblem.slug}`);
      setIsMobileMenuOpen(false);
    }
  };

  const isHomePage = location.pathname === '/';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.nav
          initial={{ y: -100, x: '-50%', opacity: 0 }}
          animate={{ y: 0, x: '-50%', opacity: 1 }}
          exit={{ y: -100, x: '-50%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-6 left-1/2 z-50 w-[90%] max-w-4xl"
        >
          <div className="glass rounded-full p-2 pl-6 pr-2 border border-slate-700/50 shadow-2xl shadow-black/20 backdrop-blur-xl flex items-center justify-between relative overflow-hidden">
            
            {/* Ambient Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-full bg-cyan-500/5 blur-xl pointer-events-none" />

            {/* Logo/Brand */}
            <Link
              to="/"
              className="relative z-10 text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 transition-all"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Rosetta Hub
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2">
              {/* Problem Count Badge */}
              {problems.length > 0 && (
                <div className="px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/50 flex items-center gap-2 mr-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                  <span className="text-xs font-medium text-slate-300">
                    <span className="text-cyan-400 font-bold">{problems.length}</span> Problems
                  </span>
                </div>
              )}

              {!isHomePage && (
                <Link
                  to="/"
                  className="p-2.5 rounded-full text-slate-400 hover:text-cyan-400 hover:bg-slate-800/50 transition-all"
                  title="Home"
                >
                  <Home size={20} />
                </Link>
              )}

              <button
                onClick={handleRandomProblem}
                disabled={problems.length === 0}
                className="p-2.5 rounded-full text-slate-400 hover:text-cyan-400 hover:bg-slate-800/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="Random Problem"
              >
                <Shuffle size={20} />
              </button>

              <Link
                to="/about"
                className="p-2.5 rounded-full text-slate-400 hover:text-cyan-400 hover:bg-slate-800/50 transition-all"
                title="About"
              >
                <Info size={20} />
              </Link>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2.5 rounded-full text-slate-300 hover:bg-slate-800/50 transition-colors relative z-10"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* Mobile Menu Dropdown */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className="absolute top-full left-0 right-0 mt-2 p-2 rounded-2xl glass border border-slate-700/50 shadow-xl overflow-hidden md:hidden"
              >
                <div className="flex flex-col gap-1">
                  {!isHomePage && (
                    <Link
                      to="/"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800/50 hover:text-cyan-400 transition-all"
                    >
                      <Home size={18} />
                      <span className="font-medium">Home</span>
                    </Link>
                  )}
                  
                  <button
                    onClick={handleRandomProblem}
                    disabled={problems.length === 0}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800/50 hover:text-cyan-400 transition-all w-full text-left disabled:opacity-50"
                  >
                    <Shuffle size={18} />
                    <span className="font-medium">Random Problem</span>
                  </button>

                  <Link
                    to="/about"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800/50 hover:text-cyan-400 transition-all"
                  >
                    <Info size={18} />
                    <span className="font-medium">About</span>
                  </Link>

                  {problems.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-700/50 px-4 py-2">
                      <div className="text-xs text-slate-500 font-medium">
                        Database Stats
                      </div>
                      <div className="text-sm text-slate-300 mt-1">
                        <span className="text-cyan-400 font-bold">{problems.length}</span> Total Problems
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
