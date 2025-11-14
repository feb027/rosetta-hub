import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowUp, BookOpen, ExternalLink } from 'lucide-react';
import { useProblems } from '../hooks/useProblems';
import { DIFFICULTY_COLORS } from '../constants/colors';
import BinarySearchVisualization from '../components/visualizations/BinarySearchVisualization';
import HundredDoorsVisualization from '../components/visualizations/HundredDoorsVisualization';
import HundredPrisonersVisualization from '../components/visualizations/HundredPrisonersVisualization';
import FifteenPuzzleVisualization from '../components/visualizations/FifteenPuzzleVisualization';
import TwentyOneGameVisualization from '../components/visualizations/TwentyOneGameVisualization';
import TwentyFourGameVisualization from '../components/visualizations/TwentyFourGameVisualization';

export default function ProblemDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { problems, isLoading } = useProblems();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showBackButton, setShowBackButton] = useState(false);
  
  // Map of problem slugs to their visualization components
  const visualizations: Record<string, React.ReactNode> = {
    'binary-search': <BinarySearchVisualization />,
    '100-doors': <HundredDoorsVisualization />,
    '100-prisoners': <HundredPrisonersVisualization />,
    '15-puzzle-game': <FifteenPuzzleVisualization/>,
    '21-game': <TwentyOneGameVisualization />,
    '24-game': <TwentyFourGameVisualization />,
  };
  
  // Find the problem by slug
  const problem = problems.find((p) => p.slug === slug);

  // Handle scroll for showing buttons
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      setShowBackButton(scrolled > 200);
      setShowScrollTop(scrolled > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 404 - Problem not found
  if (problems.length > 0 && !problem) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="glass rounded-2xl p-12 border border-slate-600/50">
            <div className="text-6xl mb-6">🔍</div>
            <h1 className="text-4xl font-bold text-slate-100 mb-4">
              Problem Not Found
            </h1>
            <p className="text-slate-400 mb-8">
              The problem "{slug}" doesn't exist in our collection.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg transition-all duration-200 border border-cyan-500/30 hover:border-cyan-500/50"
            >
              ← Return to Hub
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass rounded-2xl p-12 border border-slate-600/50">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
            <div className="text-slate-400 text-lg">Loading problem...</div>
          </div>
        </div>
      </div>
    );
  }

  // TypeScript guard - this should never happen due to the 404 check above
  if (!problem) {
    return null;
  }

  // Problem found - display details
  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 pb-20">
      <div className="max-w-6xl mx-auto">
        {/* Floating Back Button - Appears on scroll */}
        <AnimatePresence>
          {showBackButton && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="fixed left-16 md:left-20 top-24 z-40"
            >
              <Link
                to="/"
                className="group flex items-center gap-2 px-4 py-2.5 bg-slate-800/90 hover:bg-slate-700/90 backdrop-blur-md border border-slate-600/50 hover:border-cyan-500/50 rounded-lg transition-all shadow-lg hover:shadow-cyan-500/20 text-slate-300 hover:text-cyan-400"
              >
                <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
                <span className="text-sm font-medium hidden md:inline">Back to Hub</span>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scroll to Top Button - Bottom Right */}
        <AnimatePresence>
          {showScrollTop && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed right-6 md:right-8 bottom-8 z-40"
            >
              <button
                onClick={scrollToTop}
                className="group flex items-center gap-2 px-4 py-2.5 bg-slate-800/90 hover:bg-slate-700/90 backdrop-blur-md border border-slate-600/50 hover:border-cyan-500/50 rounded-lg transition-all shadow-lg hover:shadow-cyan-500/20 text-slate-300 hover:text-cyan-400"
                title="Scroll to top"
              >
                <ArrowUp size={18} className="transition-transform group-hover:-translate-y-1" />
                <span className="text-sm font-medium hidden md:inline">Top</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Problem Header - Enhanced */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass rounded-xl p-6 md:p-8 border border-slate-600/50 mb-6 relative overflow-hidden"
        >
          {/* Decorative gradient */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 blur-3xl pointer-events-none" />
          
          <div className="relative">
            {/* Title and Difficulty */}
            <div className="flex flex-wrap items-start gap-3 mb-4">
              <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 flex-1">
                {problem.title}
              </h1>
              <span
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${DIFFICULTY_COLORS[problem.difficulty]} shadow-lg`}
              >
                {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
              </span>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {problem.tags.map((tag, index) => (
                <motion.span
                  key={tag}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="px-2.5 py-1 bg-slate-700/50 text-slate-300 rounded-md text-xs border border-slate-600/50 hover:border-cyan-500/50 hover:bg-slate-700/70 transition-all cursor-default"
                >
                  {tag}
                </motion.span>
              ))}
            </div>

            {/* Description */}
            {problem.description && (
              <div className="relative">
                <div className="absolute -left-3 top-0 w-1 h-full bg-gradient-to-b from-cyan-500/50 to-blue-500/50 rounded-full" />
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line pl-3">
                  {problem.description}
                </p>
              </div>
            )}

            {/* Metadata Footer */}
            <div className="mt-4 pt-4 border-t border-slate-700/50 flex flex-wrap items-center gap-4 text-xs text-slate-400">
              {problem.createdAt && (
                <div className="flex items-center gap-2">
                  <BookOpen size={14} />
                  <span>Added {new Date(problem.createdAt).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}</span>
                </div>
              )}
              {problem.rosettaCodeUrl && (
                <a
                  href={problem.rosettaCodeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition-colors group"
                >
                  <ExternalLink size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  <span>View on Rosetta Code</span>
                </a>
              )}
            </div>
          </div>
        </motion.div>

        {/* Visualization or Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {visualizations[problem.slug] ? (
            <div className="visualization-container">
              {visualizations[problem.slug]}
            </div>
          ) : (
            <div className="glass rounded-xl p-8 border border-slate-600/50 text-center relative overflow-hidden">
              {/* Decorative background */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-800/50 to-slate-900/50 pointer-events-none" />
              
              <div className="max-w-2xl mx-auto relative">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring' }}
                  className="text-5xl mb-4"
                >
                  🚧
                </motion.div>
                <h2 className="text-xl font-bold text-slate-100 mb-3">
                  Visualization Coming Soon
                </h2>
                <p className="text-slate-400 text-sm mb-6">
                  We're working on creating an interactive visualization for this problem.
                  Check back soon!
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 hover:border-cyan-500/30 transition-colors"
                  >
                    <div className="text-cyan-400 font-semibold mb-2 text-sm">Coming Soon:</div>
                    <ul className="text-slate-400 text-xs space-y-1">
                      <li>• Interactive visualization</li>
                      <li>• Step-by-step walkthrough</li>
                    </ul>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 hover:border-cyan-500/30 transition-colors"
                  >
                    <div className="text-cyan-400 font-semibold mb-2 text-sm">Future Features:</div>
                    <ul className="text-slate-400 text-xs space-y-1">
                      <li>• Code examples</li>
                      <li>• Complexity analysis</li>
                    </ul>
                  </motion.div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
