import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    price: '$0',
    period: 'forever',
    desc: 'Perfect for solopreneurs and small shops.',
    features: [
      'Up to 50 products',
      'Basic analytics',
      'WhatsApp integration',
      'Email support',
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    desc: 'For growing businesses that need more power.',
    features: [
      'Unlimited products',
      'Advanced analytics & AI',
      'Priority WhatsApp support',
      'Team collaboration (up to 5)',
      'API access',
      'Custom reports',
    ],
    cta: 'Start Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: '$99',
    period: '/month',
    desc: 'For large teams with advanced requirements.',
    features: [
      'Everything in Pro',
      'Unlimited team members',
      'Dedicated account manager',
      'Custom integrations',
      'SLA guarantee',
      'On-premise option',
      '24/7 phone support',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-20 lg:py-28 bg-slate-50 dark:bg-slate-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="text-sm font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
            Pricing
          </span>
          <h2 className="mt-3 text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            No hidden fees. No surprises. Start free and upgrade when you need
            more.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className={`relative rounded-2xl border p-8 ${
                plan.popular
                  ? 'border-violet-500 bg-white dark:bg-slate-900 shadow-xl shadow-violet-500/10'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                  Most Popular
                </div>
              )}
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {plan.name}
              </h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white">
                  {plan.price}
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {plan.period}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{plan.desc}</p>
              <ul className="mt-8 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-600 dark:text-slate-300">{f}</span>
                  </li>
                ))}
              </ul>
              <a
                href="https://app.bizflow.com/register"
                className={`mt-8 block text-center text-sm font-semibold py-3 rounded-xl transition-all ${
                  plan.popular
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-700 hover:to-fuchsia-700 shadow-lg shadow-violet-600/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {plan.cta}
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
