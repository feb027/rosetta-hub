import { useParams, Link } from 'react-router-dom';
import { useProblems } from '../hooks/useProblems';
import { DIFFICULTY_COLORS } from '../constants/colors';
import BinarySearchVisualization from '../components/visualizations/BinarySearchVisualization';
import HundredDoorsVisualization from '../components/visualizations/HundredDoorsVisualization';

export default function ProblemDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { problems, isLoading } = useProblems();
  
  // Map of problem slugs to their visualization components
  const visualizations: Record<string, React.ReactNode> = {
    'binary-search': <BinarySearchVisualization />,
    '100-doors': <HundredDoorsVisualization />,
  };
  
  // Find the problem by slug
  const problem = problems.find((p) => p.slug === slug);

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
        {/* Back Button */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-6 transition-colors group text-sm"
        >
          <span className="transition-transform group-hover:-translate-x-1">←</span>
          Back to Hub
        </Link>

        {/* Problem Header - More Compact */}
        <div className="glass rounded-xl p-6 md:p-8 border border-slate-600/50 mb-6">
          <div className="flex flex-wrap items-start gap-3 mb-4">
            <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 flex-1">
              {problem.title}
            </h1>
            <span
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${DIFFICULTY_COLORS[problem.difficulty]}`}
            >
              {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
            </span>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {problem.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 bg-slate-700/50 text-slate-300 rounded-md text-xs border border-slate-600/50"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Description */}
          {problem.description && (
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
              {problem.description}
            </p>
          )}
        </div>

        {/* Visualization or Placeholder */}
        {visualizations[problem.slug] ? (
          <div className="visualization-container">
            {visualizations[problem.slug]}
          </div>
        ) : (
          <div className="glass rounded-xl p-8 border border-slate-600/50 text-center">
            <div className="max-w-2xl mx-auto">
              <div className="text-5xl mb-4">🚧</div>
              <h2 className="text-xl font-bold text-slate-100 mb-3">
                Visualization Coming Soon
              </h2>
              <p className="text-slate-400 text-sm mb-6">
                We're working on creating an interactive visualization for this problem.
                Check back soon!
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                  <div className="text-cyan-400 font-semibold mb-2 text-sm">Coming Soon:</div>
                  <ul className="text-slate-400 text-xs space-y-1">
                    <li>• Interactive visualization</li>
                    <li>• Step-by-step walkthrough</li>
                  </ul>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                  <div className="text-cyan-400 font-semibold mb-2 text-sm">Future Features:</div>
                  <ul className="text-slate-400 text-xs space-y-1">
                    <li>• Code examples</li>
                    <li>• Complexity analysis</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
