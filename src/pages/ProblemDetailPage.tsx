import { useParams, Link } from 'react-router-dom';

export default function ProblemDetailPage() {
  const { slug } = useParams<{ slug: string }>();

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-8 transition-colors"
        >
          ← Back to Hub
        </Link>

        <div className="glass rounded-xl p-8 border border-slate-600/50">
          <h1 className="text-4xl font-bold text-slate-100 mb-4">Problem: {slug}</h1>
          <p className="text-slate-300 text-lg mb-8">
            🚧 Visualization coming soon...
          </p>
          <div className="text-slate-400">
            <p>This is a placeholder for the problem detail page.</p>
            <p className="mt-2">
              In the future, this page will display:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Problem description</li>
              <li>Interactive visualization</li>
              <li>Code examples</li>
              <li>Complexity analysis</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
