import Image from "next/image";
import Link from "next/link";

const footerColumns = [
  { title: "Product", links: ["Features", "Pricing", "Integrations", "API"] },
  { title: "Company", links: ["About", "Blog", "Careers", "Contact"] },
  { title: "Support", links: ["Help Center", "Documentation", "Status", "Community"] },
  { title: "Legal", links: ["Privacy", "Terms", "Security", "Cookies"] },
];

export default function Footer() {
  return (
    <footer className="bg-gray-900 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2.5 text-lg font-bold mb-4">
              <div className="w-7 h-7 relative">
                <Image src="/logo.png" alt="BizFlow" fill sizes="28px" className="object-contain" />
              </div>
              <span className="text-white">
                <span className="text-cyan-400">B</span>izFlow
              </span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed max-w-xs">Modern business management software built for African entrepreneurs.</p>
          </div>
          {footerColumns.map(col => (
            <div key={col.title}>
              <h4 className="font-semibold text-xs uppercase tracking-wider text-gray-500 mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map(l => (
                  <li key={l}>
                    <Link href={`/${l.toLowerCase()}`} className="text-sm text-gray-400 hover:text-cyan-400 transition-colors">{l}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-800 pt-7 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} BizFlow. All rights reserved.</p>
          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-cyan-400 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-cyan-400 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
