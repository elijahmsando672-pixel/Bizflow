import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp, Wallet, BarChart3, Users } from 'lucide-react';

const brands = [
  'TechVista', 'GreenLeaf', 'ApexDigital', 'NovaWorks',
];

const statCards = [
  { icon: Wallet, label: 'Revenue', value: '$48.2K', change: '+12.5%' },
  { icon: Users, label: 'Customers', value: '3,451', change: '+18.7%' },
  { icon: TrendingUp, label: 'Growth', value: '32%', change: '+8.3%' },
  { icon: BarChart3, label: 'Profit', value: '$14.8K', change: '+24.8%' },
];

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
      <div className="absolute inset-0 bg-gradient-to-b from-violet-50/50 via-white to-white dark:from-slate-950 dark:via-slate-950 dark:to-slate-950" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-violet-400/5 dark:bg-violet-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-fuchsia-400/5 dark:bg-fuchsia-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <motion.div
            variants={container}
            initial="hidden"
            animate="visible"
            className="text-center lg:text-left"
          >
            <motion.div
              variants={item}
              className="inline-flex items-center gap-2 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 px-4 py-1.5 rounded-full text-sm font-medium mb-6"
            >
              <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-pulse" />
              Trusted by 10,000+ businesses
            </motion.div>

            <motion.h1
              variants={item}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white leading-[1.1] tracking-tight"
            >
              Run your business
              <br />
              <span className="bg-gradient-to-r from-violet-600 via-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
                smarter, not harder
              </span>
            </motion.h1>

            <motion.p
              variants={item}
              className="mt-6 text-lg text-slate-600 dark:text-slate-400 max-w-lg mx-auto lg:mx-0 leading-relaxed"
            >
              From sales and inventory to WhatsApp marketing — everything you
              need to run your business in one powerful platform.
            </motion.p>

            <motion.div
              variants={item}
              className="mt-8 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start"
            >
              <a
                href="https://app.bizflow.com/register"
                className="group inline-flex items-center gap-2 bg-violet-600 text-white px-7 py-3.5 rounded-xl font-semibold hover:bg-violet-700 transition-all shadow-xl shadow-violet-600/20 hover:shadow-violet-600/30"
              >
                Start Free Trial
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="#features"
                className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 px-7 py-3.5 rounded-xl font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
              >
                See Features
              </a>
            </motion.div>

            <motion.div
              variants={item}
              className="mt-8 flex items-center gap-6 justify-center lg:justify-start text-sm text-slate-400"
            >
              <span className="flex items-center gap-1.5">
                <span className="w-1 h-1 bg-violet-500 rounded-full" />
                No credit card
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1 h-1 bg-violet-500 rounded-full" />
                Free forever plan
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1 h-1 bg-violet-500 rounded-full" />
                14-day trial
              </span>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hidden lg:block"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-t from-violet-500/10 to-transparent rounded-3xl" />
              <div className="relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
                <div className="flex items-center gap-1.5 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-violet-400" />
                  <span className="ml-3 text-xs text-slate-400 font-medium">Dashboard</span>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-2 gap-3">
                    {statCards.map((s) => (
                      <div
                        key={s.label}
                        className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <s.icon className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                          <span className="text-xs text-slate-500 dark:text-slate-400">{s.label}</span>
                        </div>
                        <div className="flex items-end justify-between">
                          <span className="text-lg font-bold text-slate-900 dark:text-white">{s.value}</span>
                          <span className="text-xs font-medium text-violet-600 dark:text-violet-400">{s.change}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 h-20 flex items-end gap-1.5">
                    {[35, 50, 42, 65, 55, 78, 62, 85, 70, 90, 82, 95].map((h, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ delay: 0.5 + i * 0.03, duration: 0.4, ease: 'easeOut' }}
                        className="flex-1 rounded-t-sm bg-gradient-to-t from-violet-500/60 to-fuchsia-400/30"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="mt-16 lg:mt-20 pt-8 border-t border-slate-200 dark:border-slate-800"
        >
          <p className="text-center text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">
            Trusted by innovative teams worldwide
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {brands.map((brand) => (
              <span
                key={brand}
                className="text-lg font-bold text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400 transition-colors select-none"
              >
                {brand}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
