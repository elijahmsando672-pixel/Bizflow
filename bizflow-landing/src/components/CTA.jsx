import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function CTA() {
  return (
    <section className="py-20 lg:py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-violet-700 to-fuchsia-800" />
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-violet-400/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/3 w-80 h-80 bg-fuchsia-300/10 rounded-full blur-3xl" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Join 10,000+ businesses
          </div>
          <h2 className="text-3xl lg:text-5xl font-extrabold text-white leading-tight text-balance">
            Ready to transform your business?
          </h2>
          <p className="mt-6 text-lg text-violet-100 max-w-2xl mx-auto">
            Start your free 14-day trial today. No credit card required. No
            hidden fees. Just powerful tools to grow your business.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://app.bizflow.com/register"
              className="group inline-flex items-center gap-2 bg-white text-violet-700 px-8 py-3.5 rounded-xl font-bold hover:bg-violet-50 transition-all shadow-xl"
            >
              Start Free Trial
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="#features"
              className="inline-flex items-center gap-2 text-white/90 hover:text-white px-8 py-3.5 rounded-xl font-medium border border-white/20 hover:border-white/40 transition-all"
            >
              See Features
            </a>
          </div>
          <p className="mt-6 text-sm text-violet-200">
            Free forever plan available &middot; No credit card required &middot; Cancel anytime
          </p>
        </motion.div>
      </div>
    </section>
  );
}
