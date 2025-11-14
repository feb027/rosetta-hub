import { Github, Linkedin, Mail, Code2, Sparkles, Target } from 'lucide-react';
import { Link } from 'react-router';
import { motion } from 'motion/react';

export default function AboutPage() {
  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <Link
            to="/"
            className="inline-flex items-center text-slate-400 hover:text-cyan-400 transition-colors mb-6 text-sm"
          >
            ← Back to Problems
          </Link>

          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-500 mb-4">
            About This Project
          </h1>
          <p className="text-slate-400 text-lg">
            A journey through algorithms, visualizations, and learning
          </p>
        </motion.div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* About Me Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 md:p-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <Code2 className="text-cyan-400" size={24} />
              <h2 className="text-2xl font-semibold text-slate-100">Hi, I'm Febnawan! 👋</h2>
            </div>
            <div className="space-y-4 text-slate-300 leading-relaxed">
              <p>
                I'm a 5th-semester Informatics student at <span className="text-cyan-400 font-semibold">Universitas Siliwangi</span>, 
                passionate about crafting beautiful and functional web experiences. While I work across the full stack, 
                my heart truly belongs to <span className="text-cyan-400 font-semibold">front-end development</span> – 
                there's something magical about bringing designs to life and creating intuitive user interfaces.
              </p>
              <p>
                Currently, I'm on a mission to build diverse applications and dive deep into the open-source community. 
                Every project is a new adventure, and I'm always eager to learn and grow!
              </p>
            </div>
          </motion.section>

          {/* Why This Project */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 md:p-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="text-cyan-400" size={24} />
              <h2 className="text-2xl font-semibold text-slate-100">Why Rosetta Code Hub?</h2>
            </div>
            <div className="space-y-4 text-slate-300 leading-relaxed">
              <p>
                This project is my personal journey to solve and visualize classic programming problems from Rosetta Code. 
                It's not just about solving algorithms – it's about <span className="text-cyan-400 font-semibold">making them beautiful, 
                interactive, and accessible</span> to everyone.
              </p>
              <p>
                I believe that learning algorithms shouldn't be boring. By creating visual, step-by-step walkthroughs, 
                I'm building a resource that I wish I had when I was starting out. Each visualization is crafted with care, 
                combining my love for front-end development with algorithmic problem-solving.
              </p>
              <p className="text-slate-400 italic">
                "Code is poetry, and algorithms are the verses. Let's make them sing." 🎵
              </p>
            </div>
          </motion.section>

          {/* Goals & Vision */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 md:p-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <Target className="text-cyan-400" size={24} />
              <h2 className="text-2xl font-semibold text-slate-100">Goals & Vision</h2>
            </div>
            <ul className="space-y-3 text-slate-300">
              <li className="flex items-start gap-3">
                <span className="text-cyan-400 mt-1">▹</span>
                <span>Build an ambitious portfolio showcasing both technical skills and design sensibility</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-400 mt-1">▹</span>
                <span>Create interactive visualizations for 50+ classic algorithms and data structures</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-400 mt-1">▹</span>
                <span>Help others learn through visual, hands-on experiences</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-400 mt-1">▹</span>
                <span>Contribute to the open-source community and inspire other developers</span>
              </li>
            </ul>
          </motion.section>

          {/* Tech Stack */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 md:p-8"
          >
            <h2 className="text-2xl font-semibold text-slate-100 mb-4">Built With</h2>
            <div className="flex flex-wrap gap-2">
              {['React 19', 'TypeScript', 'Vite', 'Tailwind CSS', 'Motion', 'React Router'].map((tech) => (
                <span
                  key={tech}
                  className="px-3 py-1.5 text-sm rounded-lg bg-slate-700/50 text-cyan-400 border border-slate-600/50"
                >
                  {tech}
                </span>
              ))}
            </div>
            <p className="text-slate-400 text-sm mt-4">
              Special shoutout to <span className="text-cyan-400 font-semibold">Vite</span> ⚡ – 
              seriously, the speed is incredible! Once you experience that lightning-fast HMR, there's no going back.
            </p>
          </motion.section>

          {/* Connect Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6 md:p-8"
          >
            <h2 className="text-2xl font-semibold text-slate-100 mb-4">Let's Connect!</h2>
            <p className="text-slate-300 mb-6">
              I'm always open to feedback, collaboration, or just a friendly chat about code and tech!
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="https://github.com/feb027"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 hover:border-cyan-500/50 rounded-lg text-slate-300 hover:text-cyan-400 transition-all"
              >
                <Github size={20} />
                <span>GitHub</span>
              </a>
              <a
                href="https://www.linkedin.com/in/febnawan-fr/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 hover:border-cyan-500/50 rounded-lg text-slate-300 hover:text-cyan-400 transition-all"
              >
                <Linkedin size={20} />
                <span>LinkedIn</span>
              </a>
              <a
                href="mailto:febnawanrochman2@gmail.com"
                className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 hover:border-cyan-500/50 rounded-lg text-slate-300 hover:text-cyan-400 transition-all"
              >
                <Mail size={20} />
                <span>Email</span>
              </a>
            </div>
          </motion.section>
        </div>

        {/* Back to Home CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-12 text-center"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-cyan-500/25"
          >
            Explore Problems
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
