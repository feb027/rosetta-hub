import { Github, Linkedin, Mail } from 'lucide-react';
import { motion } from 'motion/react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-32 relative pb-8">
      {/* Animated Gradient Separator */}
      <div className="relative h-px w-full max-w-7xl mx-auto mb-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-700 to-transparent opacity-50" />
        <motion.div 
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500 to-transparent w-1/2 blur-sm"
        />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Left: Brand & Identity */}
          <div className="flex items-center gap-4 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center relative z-10 group-hover:border-cyan-500/50 transition-colors duration-500">
                <span className="text-cyan-400 font-bold text-lg font-mono">F</span>
              </div>
              <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
            
            <div className="flex flex-col">
              <span className="text-slate-200 font-medium tracking-wide group-hover:text-cyan-300 transition-colors">
                Febnawan Fatur Rochman
              </span>
              <span className="text-slate-500 text-xs tracking-wider uppercase">
                © {currentYear} • Open Source
              </span>
            </div>
          </div>

          {/* Right: Minimalist Socials */}
          <div className="flex items-center gap-1 bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800/50 backdrop-blur-sm">
            <SocialLink href="https://github.com/feb027" icon={<Github size={18} />} label="GitHub" />
            <div className="w-px h-4 bg-slate-800" />
            <SocialLink href="https://www.linkedin.com/in/febnawan-fr/" icon={<Linkedin size={18} />} label="LinkedIn" />
            <div className="w-px h-4 bg-slate-800" />
            <SocialLink href="mailto:febnawanrochman2@gmail.com" icon={<Mail size={18} />} label="Email" />
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all relative group overflow-hidden"
      aria-label={label}
    >
      <span className="relative z-10">{icon}</span>
      <motion.div 
        initial={{ scale: 0, opacity: 0 }}
        whileHover={{ scale: 1, opacity: 1 }}
        className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 rounded-xl"
      />
    </a>
  );
}
