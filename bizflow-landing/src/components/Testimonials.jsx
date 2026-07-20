import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Sarah Kamau',
    role: 'Owner, GreenLeaf Store',
    content:
      'BizFlow transformed how we manage inventory and sales. The WhatsApp integration alone saved us hours every week. Our revenue grew 40% in the first three months.',
    rating: 5,
  },
  {
    name: 'James Ochieng',
    role: 'CEO, TechVista Solutions',
    content:
      'We evaluated 10+ platforms before choosing BizFlow. The AI insights and predictive analytics give us an edge. Absolutely love the clean dashboard.',
    rating: 5,
  },
  {
    name: 'Grace Wanjiku',
    role: 'Founder, Apex Digital',
    content:
      'The customer support is incredible. Every time I have a question, I get a response within minutes. The platform itself is intuitive and powerful.',
    rating: 5,
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="text-sm font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
            Testimonials
          </span>
          <h2 className="mt-3 text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white">
            Loved by business owners
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Don&apos;t take our word for it. Here&apos;s what our users say.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-xs">
                  {t.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {t.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t.role}</p>
                </div>
                <div className="ml-auto flex gap-0.5">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                &ldquo;{t.content}&rdquo;
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
