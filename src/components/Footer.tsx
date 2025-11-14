import { Github, Linkedin, Mail } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-slate-800/50 bg-slate-900/30 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Brand & Copyright */}
          <div className="text-center md:text-left">
            <p className="text-slate-400 text-sm">
              Built by{' '}
              <span className="text-cyan-400 font-semibold">Febnawan Fatur Rochman</span> •{' '}
              {currentYear}
            </p>
            <p className="text-slate-500 text-xs mt-1">
              Visualizing algorithms, one problem at a time
            </p>
          </div>

          {/* Tech Stack Badges */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="px-2 py-1 text-xs rounded-md bg-slate-800/50 text-slate-400 border border-slate-700/50">
              React 19
            </span>
            <span className="px-2 py-1 text-xs rounded-md bg-slate-800/50 text-slate-400 border border-slate-700/50">
              TypeScript
            </span>
            <span className="px-2 py-1 text-xs rounded-md bg-slate-800/50 text-slate-400 border border-slate-700/50">
              Vite
            </span>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/feb027"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-cyan-400 transition-colors"
              aria-label="GitHub Profile"
            >
              <Github size={20} />
            </a>
            <a
              href="https://www.linkedin.com/in/febnawan-fr/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-cyan-400 transition-colors"
              aria-label="LinkedIn Profile"
            >
              <Linkedin size={20} />
            </a>
            <a
              href="mailto:febnawanrochman2@gmail.com"
              className="text-slate-400 hover:text-cyan-400 transition-colors"
              aria-label="Email Contact"
            >
              <Mail size={20} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
