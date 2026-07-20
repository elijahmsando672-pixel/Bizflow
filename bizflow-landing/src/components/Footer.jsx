import { Github, Twitter, Linkedin, Mail } from 'lucide-react';

const footerLinks = [
  {
    title: 'Product',
    links: ['Features', 'Pricing', 'Integrations', 'Changelog'],
  },
  {
    title: 'Company',
    links: ['About', 'Blog', 'Careers', 'Press'],
  },
  {
    title: 'Support',
    links: ['Documentation', 'API Reference', 'Status', 'Contact'],
  },
  {
    title: 'Legal',
    links: ['Privacy', 'Terms', 'Security', 'Cookies'],
  },
];

export default function Footer() {
  return (
    <footer className="bg-slate-950 dark:bg-black text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          <div className="col-span-2 lg:col-span-1">
            <a href="/" className="flex items-center gap-2.5 mb-4 group">
              <img src="/logo.png" alt="BizFlow" className="w-10 h-10" />
              <span className="text-lg font-bold text-white">
                Biz<span className="text-violet-400">Flow</span>
              </span>
            </a>
            <p className="text-sm text-slate-500 leading-relaxed mb-6 max-w-xs">
              The all-in-one platform to manage, grow, and automate your
              business.
            </p>
            <div className="flex items-center gap-3">
              <a href="#" className="p-2 rounded-lg hover:bg-slate-800 transition-colors">
                <Github className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-lg hover:bg-slate-800 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-lg hover:bg-slate-800 transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-lg hover:bg-slate-800 transition-colors">
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {footerLinks.map((section) => (
            <div key={section.title}>
              <h4 className="text-sm font-semibold text-white mb-4">
                {section.title}
              </h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-slate-500 hover:text-white transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-600">
            &copy; {new Date().getFullYear()} BizFlow. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
