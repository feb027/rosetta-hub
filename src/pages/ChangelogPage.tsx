import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  GitCommit, 
  ArrowLeft, 
  Rocket, 
  Bug, 
  Zap, 
  Sparkles,
  ChevronDown,
  ChevronRight,
  Search,
  Filter
} from 'lucide-react';
import { Link } from 'react-router-dom';

import changelogRaw from '../../CHANGELOG.md?raw';
import { parseChangelog, type Release, type ChangeItem } from '../utils/changelogParser';

const RELEASES: Release[] = parseChangelog(changelogRaw);

// Count total problems added
const getTotalProblemsAdded = () => {
  let count = 0;
  RELEASES.forEach(release => {
    release.changes.forEach(change => {
      if (change.type === 'added' && change.content.toLowerCase().includes('problem')) {
        count++;
      }
    });
  });
  return count;
};

const TypeIcon = ({ type }: { type: ChangeItem['type'] }) => {
  switch (type) {
    case 'added': return <Sparkles size={14} className="text-emerald-400" />;
    case 'changed': return <Zap size={14} className="text-amber-400" />;
    case 'fixed': return <Bug size={14} className="text-rose-400" />;
  }
};

// Collapsible Change Item Component
function ChangeItemCard({ change, defaultOpen = false }: { change: ChangeItem; defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const hasDetails = change.details && change.details.length > 0;

  const typeColors = {
    added: 'border-emerald-500/30 hover:border-emerald-500/50 bg-emerald-500/5',
    changed: 'border-amber-500/30 hover:border-amber-500/50 bg-amber-500/5',
    fixed: 'border-rose-500/30 hover:border-rose-500/50 bg-rose-500/5',
  };

  return (
    <div className={`rounded-lg border transition-colors ${typeColors[change.type]}`}>
      <button
        onClick={() => hasDetails && setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 flex items-start gap-3 text-left ${hasDetails ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <div className="mt-0.5">
          <TypeIcon type={change.type} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm text-slate-200 leading-relaxed">{change.content}</div>
          {hasDetails && (
            <div className="text-xs text-slate-500 mt-1">
              {change.details!.length} detail{change.details!.length > 1 ? 's' : ''}
            </div>
          )}
        </div>
        {hasDetails && (
          <div className="text-slate-500 mt-0.5">
            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
        )}
      </button>
      
      <AnimatePresence>
        {isOpen && hasDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 pl-11 space-y-1.5">
              {change.details!.map((detail, idx) => (
                <div key={idx} className="text-xs text-slate-400 flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-slate-600 mt-1.5 shrink-0" />
                  <span>{detail}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Collapsible Release Section
function ReleaseSection({ release, index }: { release: Release; index: number }) {
  const [isExpanded, setIsExpanded] = useState(index === 0); // First release expanded by default
  const [activeFilter, setActiveFilter] = useState<'all' | 'added' | 'changed' | 'fixed'>('all');

  const added = release.changes.filter(c => c.type === 'added');
  const changed = release.changes.filter(c => c.type === 'changed');
  const fixed = release.changes.filter(c => c.type === 'fixed');

  const filteredChanges = activeFilter === 'all' 
    ? release.changes 
    : release.changes.filter(c => c.type === activeFilter);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass rounded-2xl border border-slate-700/50 overflow-hidden"
    >
      {/* Release Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
          <div className="text-left">
            <h2 className="text-xl font-bold text-white font-mono">{release.version}</h2>
            <div className="flex items-center gap-2 text-slate-500 text-xs font-mono mt-0.5">
              <Calendar size={12} />
              <span>{release.date}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Summary badges */}
          <div className="hidden sm:flex items-center gap-2">
            {added.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                +{added.length}
              </span>
            )}
            {changed.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
                ~{changed.length}
              </span>
            )}
            {fixed.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold">
                !{fixed.length}
              </span>
            )}
          </div>
          
          <div className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            <ChevronDown size={20} />
          </div>
        </div>
      </button>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 border-t border-slate-700/30">
              {/* Filter Tabs */}
              <div className="flex items-center gap-2 py-4 overflow-x-auto">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    activeFilter === 'all'
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  All ({release.changes.length})
                </button>
                {added.length > 0 && (
                  <button
                    onClick={() => setActiveFilter('added')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                      activeFilter === 'added'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/10'
                    }`}
                  >
                    <Sparkles size={12} /> Added ({added.length})
                  </button>
                )}
                {changed.length > 0 && (
                  <button
                    onClick={() => setActiveFilter('changed')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                      activeFilter === 'changed'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'text-slate-400 hover:text-amber-300 hover:bg-amber-500/10'
                    }`}
                  >
                    <Zap size={12} /> Changed ({changed.length})
                  </button>
                )}
                {fixed.length > 0 && (
                  <button
                    onClick={() => setActiveFilter('fixed')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                      activeFilter === 'fixed'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'text-slate-400 hover:text-rose-300 hover:bg-rose-500/10'
                    }`}
                  >
                    <Bug size={12} /> Fixed ({fixed.length})
                  </button>
                )}
              </div>

              {/* Changes List */}
              <div className="space-y-2">
                {filteredChanges.map((change, i) => (
                  <ChangeItemCard key={i} change={change} defaultOpen={false} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ChangelogPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandAll, setExpandAll] = useState(false);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Filter releases based on search
  const filteredReleases = searchTerm
    ? RELEASES.filter(release => 
        release.version.toLowerCase().includes(searchTerm.toLowerCase()) ||
        release.changes.some(c => 
          c.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.details?.some(d => d.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      )
    : RELEASES;

  const totalProblems = getTotalProblemsAdded();
  const totalChanges = RELEASES.reduce((acc, r) => acc + r.changes.length, 0);

  return (
    <div className="min-h-screen p-4 md:p-8 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <header className="mb-8">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            Back to Hub
          </Link>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-4"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Rocket className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Ship Log</h1>
              <p className="text-slate-500 text-sm">Tracking the evolution of Rosetta Hub</p>
            </div>
          </motion.div>

          {/* Stats Bar */}
          <div className="flex flex-wrap gap-4 mt-6">
            <div className="glass px-4 py-2 rounded-lg border border-slate-700/50">
              <div className="text-2xl font-bold text-white">{RELEASES.length}</div>
              <div className="text-xs text-slate-500">Releases</div>
            </div>
            <div className="glass px-4 py-2 rounded-lg border border-slate-700/50">
              <div className="text-2xl font-bold text-emerald-400">{totalProblems}</div>
              <div className="text-xs text-slate-500">Problems Added</div>
            </div>
            <div className="glass px-4 py-2 rounded-lg border border-slate-700/50">
              <div className="text-2xl font-bold text-purple-400">{totalChanges}</div>
              <div className="text-xs text-slate-500">Total Changes</div>
            </div>
          </div>
        </header>

        {/* Search & Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search changes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
            />
          </div>
          <button
            onClick={() => setExpandAll(!expandAll)}
            className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-300 hover:bg-slate-700 transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <Filter size={16} />
            {expandAll ? 'Collapse All' : 'Expand All'}
          </button>
        </div>

        {/* Releases List */}
        <div className="space-y-4">
          {filteredReleases.map((release, index) => (
            <ReleaseSection 
              key={release.version} 
              release={release} 
              index={index}
            />
          ))}
        </div>

        {filteredReleases.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            No releases found matching "{searchTerm}"
          </div>
        )}
        
        {/* Footer Note */}
        <div className="mt-12 text-center pb-10 border-t border-slate-800/50 pt-8">
          <div className="inline-flex items-center gap-2 text-slate-600 text-sm font-mono">
            <GitCommit size={14} />
            <span>Initial release started in 2025</span>
          </div>
        </div>
      </div>
    </div>
  );
}
