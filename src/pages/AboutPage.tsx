import { Github, Linkedin, Mail, Code2, Target, Cpu, Coffee, Heart, Calendar } from 'lucide-react';
import { motion, useScroll, useTransform } from 'motion/react';
import { useRef, useEffect } from 'react';

export default function AboutPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Scroll to top on mount to ensure animations trigger correctly
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div ref={containerRef} className="min-h-screen pb-20 relative overflow-hidden">
      
      {/* Parallax Hero Section */}
      <div className="relative h-[60vh] md:h-[70vh] flex items-center justify-center overflow-hidden">
        <motion.div 
          style={{ y, opacity }}
          className="absolute inset-0 z-0"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/50 to-slate-950 z-10" />
          <img 
            src="/hero-abstract.png" 
            alt="Abstract Digital Brain" 
            className="w-full h-full object-cover opacity-60"
          />
        </motion.div>

        <div className="relative z-20 text-center px-4 max-w-4xl mx-auto">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-blue-300 mb-6 drop-shadow-2xl tracking-tight">
              Crafting Digital Logic
            </h1>
          </motion.div>
          
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-xl md:text-2xl text-slate-300 font-light max-w-2xl mx-auto leading-relaxed"
          >
            Where algorithms meet artistry. A journey through code, visualization, and the beauty of problem-solving.
          </motion.p>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 -mt-20 relative z-30">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          
          {/* Intro Card - Large */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="md:col-span-2 lg:col-span-2 row-span-2 glass rounded-3xl p-8 border border-slate-700/50 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-500/20 transition-colors duration-500" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-400">
                  <Code2 size={32} />
                </div>
                <h2 className="text-3xl font-bold text-slate-100">Hello, World! 👋</h2>
              </div>
              <p className="text-slate-300 text-lg leading-relaxed mb-6">
                I'm <span className="text-cyan-400 font-bold">Febnawan</span>, a 5th-semester Informatics student at <span className="text-white font-semibold">Universitas Siliwangi</span>.
              </p>
              <p className="text-slate-400 leading-relaxed">
                I don't just write code; I build experiences. My passion lies in the intersection of <span className="text-cyan-300">rigorous logic</span> and <span className="text-purple-300">beautiful design</span>. 
                Rosetta Hub is my playground—a place where I turn abstract algorithms into interactive visual stories.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <span className="px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700 text-sm text-slate-300 hover:bg-slate-700 transition-colors cursor-default">🚀 Full Stack</span>
                <span className="px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700 text-sm text-slate-300 hover:bg-slate-700 transition-colors cursor-default">🎨 UI/UX Enthusiast</span>
                <span className="px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700 text-sm text-slate-300 hover:bg-slate-700 transition-colors cursor-default">⚡ Performance Obsessed</span>
              </div>
            </div>
          </motion.div>

          {/* Stats Card 1 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="glass rounded-3xl p-6 border border-slate-700/50 flex flex-col items-center justify-center text-center hover:border-cyan-500/30 transition-colors group"
          >
            <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-cyan-400 to-blue-500 mb-2 group-hover:scale-110 transition-transform duration-300">
              50+
            </div>
            <div className="text-slate-400 font-medium">Algorithms Planned</div>
          </motion.div>

          {/* Stats Card 2 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="glass rounded-3xl p-6 border border-slate-700/50 flex flex-col items-center justify-center text-center hover:border-purple-500/30 transition-colors group"
          >
            <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-purple-400 to-pink-500 mb-2 group-hover:scale-110 transition-transform duration-300">
              100%
            </div>
            <div className="text-slate-400 font-medium">Open Source</div>
          </motion.div>

          {/* Vision Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="md:col-span-2 glass rounded-3xl p-8 border border-slate-700/50 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <Target className="text-blue-400" size={24} />
                <h3 className="text-xl font-bold text-slate-100">The Mission</h3>
              </div>
              <p className="text-slate-300 mb-6">
                To demystify complex computer science concepts through interactive visualization. 
                "Code is poetry, and algorithms are the verses. Let's make them sing." 🎵
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                  <span>Visual Learning</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <div className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(192,132,252,0.5)]" />
                  <span>Interactive Demos</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]" />
                  <span>Modern Stack</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <div className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]" />
                  <span>Community Driven</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tech Stack - Vertical */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="md:col-span-1 row-span-2 glass rounded-3xl p-6 border border-slate-700/50 flex flex-col"
          >
            <div className="flex items-center gap-3 mb-6">
              <Cpu className="text-emerald-400" size={24} />
              <h3 className="text-xl font-bold text-slate-100">Tech Stack</h3>
            </div>
            <div className="flex-1 space-y-3">
              {[
                { name: 'React 19', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
                { name: 'TypeScript', color: 'bg-blue-600/20 text-blue-200 border-blue-600/30' },
                { name: 'Vite', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
                { name: 'Tailwind', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
                { name: 'Motion', color: 'bg-pink-500/20 text-pink-300 border-pink-500/30' },
                { name: 'Lucide', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
              ].map((tech) => (
                <div 
                  key={tech.name}
                  className={`p-3 rounded-xl ${tech.color} border font-medium text-sm flex items-center justify-between group cursor-default hover:scale-105 transition-transform`}
                >
                  {tech.name}
                  <div className="w-1.5 h-1.5 rounded-full bg-current opacity-50 group-hover:opacity-100" />
                </div>
              ))}
            </div>
          </motion.div>

          {/* Journey/Timeline Card - New */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.45 }}
            className="md:col-span-3 glass rounded-3xl p-8 border border-slate-700/50"
          >
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="text-orange-400" size={24} />
              <h3 className="text-xl font-bold text-slate-100">My Journey</h3>
            </div>
            <div className="relative border-l border-slate-700/50 ml-3 space-y-8">
              <div className="relative pl-8">
                <div className="absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full bg-cyan-500 ring-4 ring-slate-900" />
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mb-1">
                  <span className="text-sm font-mono text-cyan-400">2024 - Present</span>
                  <h4 className="text-lg font-semibold text-slate-200">Building Rosetta Hub</h4>
                </div>
                <p className="text-slate-400 text-sm">Creating interactive visualizations for classic algorithms to help students learn better.</p>
              </div>
              <div className="relative pl-8">
                <div className="absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full bg-purple-500 ring-4 ring-slate-900" />
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mb-1">
                  <span className="text-sm font-mono text-purple-400">2022 - Present</span>
                  <h4 className="text-lg font-semibold text-slate-200">Informatics Student</h4>
                </div>
                <p className="text-slate-400 text-sm">Studying at Universitas Siliwangi. Focusing on Web Technologies and Software Engineering.</p>
              </div>
            </div>
          </motion.div>

          {/* Connect Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="md:col-span-3 lg:col-span-4 glass rounded-3xl p-8 border border-slate-700/50 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900" />
            <div className="absolute top-0 right-0 w-full h-full bg-[url('/grid-pattern.svg')] opacity-10" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Let's Build Something Amazing</h2>
                <p className="text-slate-400">Open for collaborations, questions, or just a virtual coffee.</p>
              </div>
              
              <div className="flex gap-4">
                <a
                  href="https://github.com/feb027"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 hover:scale-110 transition-all duration-300 group"
                  aria-label="GitHub"
                >
                  <Github size={24} />
                </a>
                <a
                  href="https://www.linkedin.com/in/febnawan-fr/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:text-blue-300 hover:bg-blue-600/30 hover:scale-110 transition-all duration-300"
                  aria-label="LinkedIn"
                >
                  <Linkedin size={24} />
                </a>
                <a
                  href="mailto:febnawanrochman2@gmail.com"
                  className="p-4 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-600/30 hover:scale-110 transition-all duration-300"
                  aria-label="Email"
                >
                  <Mail size={24} />
                </a>
              </div>
            </div>
          </motion.div>

        </div>

        {/* Footer Quote */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-20 text-center pb-10"
        >
          <div className="inline-flex items-center gap-2 text-slate-500 text-sm">
            <span>Made with</span>
            <Heart size={14} className="text-red-500 fill-red-500 animate-pulse" />
            <span>and a lot of</span>
            <Coffee size={14} className="text-amber-600" />
            <span>in Tasikmalaya</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
