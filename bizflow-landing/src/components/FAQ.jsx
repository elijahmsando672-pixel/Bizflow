import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: 'What is BizFlow and who is it for?',
    a: 'BizFlow is an all-in-one business management platform designed for small to medium businesses. Whether you run a retail store, restaurant, service business, or consultancy, BizFlow helps you manage sales, inventory, customers, and marketing in one place.',
  },
  {
    q: 'Is there a free plan available?',
    a: 'Yes! We offer a generous free plan that includes up to 50 products, basic analytics, and WhatsApp integration. No credit card required. Upgrade when you outgrow it.',
  },
  {
    q: 'How does the WhatsApp integration work?',
    a: 'BizFlow connects directly to the WhatsApp Business API. You can send order confirmations, payment reminders, marketing broadcasts, and even handle customer support — all from within the platform.',
  },
  {
    q: 'Can I import data from my current system?',
    a: 'Absolutely. We support CSV imports for products, customers, and transactions. Our support team can also help with custom migrations from QuickBooks, Shopify, spreadsheets, and more.',
  },
  {
    q: 'Is my data secure?',
    a: 'Security is our top priority. All data is encrypted at rest and in transit. We use role-based access control, maintain audit logs, and perform automatic backups. Our infrastructure is SOC 2 compliant.',
  },
  {
    q: 'What kind of support do you offer?',
    a: 'Free users get email support. Pro users get priority WhatsApp support. Enterprise customers get a dedicated account manager and 24/7 phone support.',
  },
];

export default function FAQ() {
  const [open, setOpen] = useState(null);

  return (
    <section id="faq" className="py-20 lg:py-28">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-sm font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
            FAQ
          </span>
          <h2 className="mt-3 text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white">
            Got questions? We&apos;ve got answers
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            Everything you need to know about BizFlow.
          </p>
        </motion.div>

        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.03 }}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-4 text-left group"
              >
                <span className="font-medium text-slate-900 dark:text-white pr-4 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                  {faq.q}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${
                    open === i ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
