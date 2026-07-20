import { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import CountUp from 'react-countup';

const stats = [
  { label: 'Active Businesses', value: 12000, suffix: '+' },
  { label: 'Transactions Processed', value: 2500000, suffix: '+' },
  { label: 'Countries', value: 45, suffix: '' },
  { label: 'Avg. Monthly Growth', value: 32, suffix: '%' },
];

function StatItem({ stat }) {
  const controls = useAnimation();
  const { ref, inView } = useInView({ triggerOnce: true });

  useEffect(() => {
    if (inView) controls.start('visible');
  }, [inView, controls]);

  return (
    <motion.div
      ref={ref}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      initial="hidden"
      animate={controls}
      className="text-center"
    >
      <p className="text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white">
        {inView && <CountUp end={stat.value} duration={2.5} separator="," />}
        {stat.suffix}
      </p>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        {stat.label}
      </p>
    </motion.div>
  );
}

export default function Stats() {
  return (
    <section className="py-16 lg:py-20 bg-slate-50 dark:bg-slate-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {stats.map((stat) => (
            <StatItem key={stat.label} stat={stat} />
          ))}
        </div>
      </div>
    </section>
  );
}
