import { motion } from 'motion/react';
import { Calendar, Tag, GitCommit, ArrowLeft, Rocket, Bug, Zap, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';

import changelogRaw from '../../CHANGELOG.md?raw';
import { parseChangelog, type Release, type ChangeItem } from '../utils/changelogParser';

const RELEASES: Release[] = parseChangelog(changelogRaw);

const TypeIcon = ({ type }: { type: ChangeItem['type'] }) => {
  switch (type) {
    case 'added': return <Sparkles size={16} className="text-emerald-400" />;
    case 'changed': return <Zap size={16} className="text-amber-400" />;
    case 'fixed': return <Bug size={16} className="text-rose-400" />;
  }
};

const TypeBadge = ({ type }: { type: ChangeItem['type'] }) => {
  const styles = {
    added: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    changed: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    fixed: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${styles[type]}`}>
      {type}
    </span>
  );
};

export default function ChangelogPage() {
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen p-4 md:p-8 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <header className="mb-16">
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
            <h1 className="text-4xl font-bold text-white">Ship Log</h1>
          </motion.div>
          <p className="text-slate-400 text-lg max-w-2xl">
            Tracking the evolution of Rosetta Hub, one commit at a time.
          </p>
        </header>

        <div className="space-y-24">
          {RELEASES.map((release, index) => {
            // Group changes by type
            const added = release.changes.filter(c => c.type === 'added');
            const changed = release.changes.filter(c => c.type === 'changed');
            const fixed = release.changes.filter(c => c.type === 'fixed');

            return (
              <motion.div
                key={release.version}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12"
              >
                {/* Left Column: Version Info (Sticky) */}
                <div className="lg:col-span-3">
                  <div className="sticky top-32">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                      <h2 className="text-3xl font-bold text-white font-mono tracking-tight">{release.version}</h2>
                    </div>
                    
                    <div className="flex items-center gap-2 text-slate-500 mb-6 font-mono text-sm">
                      <Calendar size={14} />
                      <span>{release.date}</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {added.length > 0 && (
                        <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                          +{added.length} Added
                        </div>
                      )}
                      {changed.length > 0 && (
                        <div className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
                          ~{changed.length} Changed
                        </div>
                      )}
                      {fixed.length > 0 && (
                        <div className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold">
                          -{fixed.length} Fixed
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column: Bento Grid Content */}
                <div className="lg:col-span-9">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Added Section - Spans full width if prominent */}
                    {added.length > 0 && (
                      <div className="md:col-span-2 glass p-6 rounded-3xl border border-slate-700/50 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
                        <h3 className="text-lg font-bold text-emerald-400 mb-6 flex items-center gap-2">
                          <Sparkles size={18} />
                          New Features
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {added.map((change, i) => (
                            <div key={i} className="space-y-2">
                              <div className="font-medium text-slate-200">{change.content}</div>
                              {change.details && (
                                <ul className="space-y-1.5">
                                  {change.details.map((detail, j) => (
                                    <li key={j} className="text-sm text-slate-500 flex items-start gap-2">
                                      <span className="w-1 h-1 rounded-full bg-emerald-500/50 mt-2 shrink-0" />
                                      <span className="leading-relaxed">{detail}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Changed Section */}
                    {changed.length > 0 && (
                      <div className="glass p-6 rounded-3xl border border-slate-700/50 relative overflow-hidden group hover:border-amber-500/30 transition-colors">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
                        <h3 className="text-lg font-bold text-amber-400 mb-4 flex items-center gap-2">
                          <Zap size={18} />
                          Improvements
                        </h3>
                        <div className="space-y-4">
                          {changed.map((change, i) => (
                            <div key={i} className="text-slate-300 text-sm border-l-2 border-amber-500/20 pl-3 py-1">
                              {change.content}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Fixed Section */}
                    {fixed.length > 0 && (
                      <div className="glass p-6 rounded-3xl border border-slate-700/50 relative overflow-hidden group hover:border-rose-500/30 transition-colors">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
                        <h3 className="text-lg font-bold text-rose-400 mb-4 flex items-center gap-2">
                          <Bug size={18} />
                          Bug Fixes
                        </h3>
                        <div className="space-y-4">
                          {fixed.map((change, i) => (
                            <div key={i} className="text-slate-300 text-sm border-l-2 border-rose-500/20 pl-3 py-1">
                              {change.content}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
        
        {/* Footer Note */}
        <div className="mt-24 text-center pb-10 border-t border-slate-800/50 pt-10">
          <div className="inline-flex items-center gap-2 text-slate-600 text-sm font-mono">
            <GitCommit size={14} />
            <span>Initial release started in 2025</span>
          </div>
        </div>
      </div>
    </div>
  );
}
