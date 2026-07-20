import { motion } from 'framer-motion';
import {
  BarChart3, ScanLine, MessageSquare, Users, Shield, Zap,
  Sparkles, Bot, LineChart,
} from 'lucide-react';

const features = [
  { icon: BarChart3, title: 'Analytics', desc: 'Real-time revenue, expense, and profit tracking with AI-powered insights and forecasts.' },
  { icon: ScanLine, title: 'Inventory', desc: 'Track stock in real-time with low-stock alerts, auto-reorder suggestions, and barcode support.' },
  { icon: MessageSquare, title: 'WhatsApp', desc: 'Send bulk messages, order confirmations, and payment reminders via WhatsApp API.' },
  { icon: Users, title: 'CRM', desc: 'Manage contacts, track interactions, segment customers, and automate follow-ups.' },
  { icon: Shield, title: 'Security', desc: 'End-to-end encryption, role-based access, audit logs, and automatic backups.' },
  { icon: Zap, title: 'Automation', desc: 'Automate repetitive tasks, set up triggers, and create custom workflows.' },
];

const aiFeatures = [
  { icon: Bot, title: 'AI Assistant', desc: 'Ask questions in plain English and get instant answers about your business data.' },
  { icon: LineChart, title: 'Predictive Analytics', desc: 'Forecast revenue, detect trends, and identify growth opportunities automatically.' },
];

export default function Features() {
  return (
    <section id="features" className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
            Features
          </span>
          <h2 className="mt-3 text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white text-balance">
            Everything you need to scale
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Powerful tools that work together to help you manage, grow, and
            automate your business.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.5 }}
              className="group relative bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 hover:border-violet-200 dark:hover:border-violet-800/50 hover:shadow-lg hover:shadow-violet-500/5 transition-all duration-300"
            >
              <div className="w-11 h-11 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <f.icon className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                {f.title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="mt-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              Powered by AI
            </div>
            <h3 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
              Built-in AI that works for you
            </h3>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
            {aiFeatures.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-900/10 dark:to-fuchsia-900/10 rounded-2xl p-6 border border-violet-100 dark:border-violet-800/30"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
