import { Github, Linkedin, Mail } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-20 relative overflow-hidden">
      {/* Unique gradient line separator */}
      <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent mb-8" />
      
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pb-8">
        {/* Single row layout */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Left: Name & Year */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center">
              <span className="text-cyan-400 font-bold text-sm">F</span>
            </div>
            <div>
              <p className="text-slate-300 text-sm font-medium">
                Febnawan Fatur Rochman
              </p>
              <p className="text-slate-500 text-xs">
                © {currentYear} • Open Source
              </p>
            </div>
          </div>

          {/* Right: Social Links */}
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/feb027"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-700/70 text-slate-400 hover:text-cyan-400 border border-slate-700/50 hover:border-cyan-500/50 transition-all"
              aria-label="GitHub Profile"
            >
              <Github size={18} />
            </a>
            <a
              href="https://www.linkedin.com/in/febnawan-fr/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-700/70 text-slate-400 hover:text-cyan-400 border border-slate-700/50 hover:border-cyan-500/50 transition-all"
              aria-label="LinkedIn Profile"
            >
              <Linkedin size={18} />
            </a>
            <a
              href="mailto:febnawanrochman2@gmail.com"
              className="p-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-700/70 text-slate-400 hover:text-cyan-400 border border-slate-700/50 hover:border-cyan-500/50 transition-all"
              aria-label="Email Contact"
            >
              <Mail size={18} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
