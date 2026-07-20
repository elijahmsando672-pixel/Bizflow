import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

const links = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Testimonials', href: '#testimonials' },
  { label: 'FAQ', href: '#faq' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <a href="/" className="flex items-center gap-2.5 group">
            <img src="/logo.png" alt="BizFlow" className="w-8 h-8" />
          </a>

          <div className="hidden md:flex items-center gap-8">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <a
              href="https://app.bizflow.com/login"
              className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors px-4 py-2"
            >
              Log in
            </a>
            <a
              href="https://app.bizflow.com/register"
              className="text-sm font-medium bg-violet-600 text-white px-5 py-2.5 rounded-xl hover:bg-violet-700 transition-all shadow-lg shadow-violet-600/20"
            >
              Get Started Free
            </a>
          </div>

          <button
            onClick={() => setOpen(!open)}
            aria-label={open ? 'Close navigation' : 'Open navigation'}
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {open ? (
              <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            ) : (
              <Menu className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800"
          >
            <div className="px-4 py-4 space-y-2">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 py-2.5 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                >
                  {l.label}
                </a>
              ))}
              <hr className="border-slate-200 dark:border-slate-800 my-2" />
              <a
                href="https://app.bizflow.com/login"
                onClick={() => setOpen(false)}
                className="block text-sm font-medium text-slate-600 dark:text-slate-400 py-2.5 px-3"
              >
                Log in
              </a>
              <a
                href="https://app.bizflow.com/register"
                onClick={() => setOpen(false)}
                className="block text-center text-sm font-medium bg-violet-600 text-white px-4 py-2.5 rounded-xl hover:bg-violet-700 transition-all"
              >
                Get Started Free
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
