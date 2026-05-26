import Link from 'next/link';
import { ArrowRight, TrendingUp, Users, DollarSign, Package, CheckCircle, Star, Menu, X, Zap, Shield, Globe, Clock } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">BizFlow</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-400 hover:text-white transition text-sm font-medium">Features</a>
            <a href="#how-it-works" className="text-gray-400 hover:text-white transition text-sm font-medium">How It Works</a>
            <a href="#pricing" className="text-gray-400 hover:text-white transition text-sm font-medium">Pricing</a>
            <Link href="/login" className="text-gray-400 hover:text-white transition text-sm font-medium">Login</Link>
            <Link href="/register" className="bg-gradient-to-r from-emerald-400 to-cyan-500 text-white px-5 py-2.5 rounded-lg hover:opacity-90 transition text-sm font-semibold">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main>
        <section className="pt-48 pb-40 px-6 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
          </div>
          
          <div className="max-w-5xl mx-auto text-center relative">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-8">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-sm text-gray-400">Trusted by 10,000+ businesses</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tight">
              Manage Your Business
              <span className="block bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">With Confidence</span>
            </h1>
            
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              All-in-one platform for finances, inventory, and customer management. 
              Built for modern businesses that want to grow faster.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="bg-gradient-to-r from-emerald-400 to-cyan-500 text-white px-8 py-4 rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2 text-lg font-semibold shadow-lg shadow-emerald-500/25">
                Start Free Trial <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/demo" className="border border-white/20 text-white px-8 py-4 rounded-xl hover:bg-white/5 transition text-lg font-semibold">
                Watch Demo
              </Link>
            </div>

            <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 pt-8 border-t border-white/5">
              {[
                { value: '10K+', label: 'Businesses' },
                { value: '$50M+', label: 'Processed' },
                { value: '99.9%', label: 'Uptime' },
                { value: '24/7', label: 'Support' },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent mb-2">{stat.value}</div>
                  <div className="text-gray-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="py-32 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features</h2>
              <p className="text-gray-400 max-w-xl mx-auto">Everything you need to run your business efficiently in one place.</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, i) => (
                <FeatureCard key={i} {...feature} />
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-32 px-6 bg-white/[0.02]">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">How BizFlow Works</h2>
              <p className="text-gray-400 text-lg mb-8">
                Get started in minutes. Import your data, invite your team, and start managing your business from day one.
              </p>
              <div className="space-y-6">
                {steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-emerald-400 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                      {i + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{step.title}</h3>
                      <p className="text-gray-400 text-sm">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl p-8 border border-white/10">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-emerald-400" />
                    <span>Total Revenue</span>
                  </div>
                  <span className="font-bold text-emerald-400">$124,580</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-cyan-400" />
                    <span>Products</span>
                  </div>
                  <span className="font-bold">1,247</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-purple-400" />
                    <span>Customers</span>
                  </div>
                  <span className="font-bold">856</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-yellow-400" />
                    <span>Growth</span>
                  </div>
                  <span className="font-bold text-emerald-400">+23.5%</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="py-32 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple Pricing</h2>
              <p className="text-gray-400">Start free, upgrade when you&apos;re ready.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {pricingPlans.map((plan, i) => (
                <PricingCard key={i} {...plan} popular={i === 1} />
              ))}
            </div>
          </div>
        </section>

        <section className="py-32 px-6 bg-gradient-to-r from-emerald-600 to-cyan-600">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Get Started?</h2>
            <p className="text-emerald-100 text-lg mb-8">Join 10,000+ businesses already using BizFlow.</p>
            <Link href="/register" className="inline-flex items-center gap-2 bg-white text-emerald-600 px-8 py-4 rounded-xl hover:bg-emerald-50 transition text-lg font-semibold">
              Start Free Trial <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold">BizFlow</span>
          </div>
          <p className="text-gray-500 text-sm">&copy; 2026 BizFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

const features = [
  { icon: DollarSign, title: "Financial Tracking", description: "Track income, expenses, and profits with powerful analytics dashboard.", color: "text-emerald-400", bg: "bg-emerald-400/10" },
  { icon: Package, title: "Inventory Management", description: "Real-time stock tracking, low-stock alerts, and product catalog management.", color: "text-cyan-400", bg: "bg-cyan-400/10" },
  { icon: Users, title: "Customer CRM", description: "Manage customer relationships, track purchase history, and communication.", color: "text-purple-400", bg: "bg-purple-400/10" },
  { icon: TrendingUp, title: "Analytics", description: "Get insights with customizable reports and real-time business metrics.", color: "text-yellow-400", bg: "bg-yellow-400/10" },
  { icon: Shield, title: "Secure & Private", description: "Enterprise-grade security with encryption and role-based access.", color: "text-pink-400", bg: "bg-pink-400/10" },
  { icon: Globe, title: "Cloud Sync", description: "Access your data from anywhere, on any device, anytime.", color: "text-orange-400", bg: "bg-orange-400/10" },
];

const steps = [
  { title: "Create your account", description: "Sign up in seconds with your email or Google account." },
  { title: "Import your data", description: "Upload CSV files or connect from other platforms." },
  { title: "Invite your team", description: "Add team members with custom permission levels." },
  { title: "Start managing", description: "You're ready to go! Track everything in one place." },
];

const pricingPlans = [
  { name: "Starter", price: "Free", description: "Perfect for just starting out", features: ["Up to 100 transactions", "Basic reporting", "Email support"], color: "border-white/10" },
  { name: "Pro", price: "$19", period: "/month", description: "For growing businesses", features: ["Unlimited transactions", "Advanced analytics", "Priority support", "Team collaboration"], popular: true, color: "border-emerald-500" },
  { name: "Business", price: "$49", period: "/month", description: "For larger teams", features: ["Everything in Pro", "Multiple users", "API access", "Custom integrations"], color: "border-white/10" },
];

function FeatureCard({ icon: Icon, title, description, color, bg }: { icon: any; title: string; description: string; color: string; bg: string }) {
  return (
    <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/5 hover:border-white/20 transition group">
      <div className={`w-12 h-12 ${bg} ${color} rounded-xl flex items-center justify-center mb-4`}>
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function PricingCard({ name, price, period, description, features, popular, color }: any) {
  return (
    <div className={`bg-white/[0.02] rounded-2xl p-8 border ${popular ? 'border-emerald-500 relative' : color}`}>
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-400 to-cyan-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
          Most Popular
        </div>
      )}
      <h3 className="text-lg font-semibold mb-2">{name}</h3>
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-4xl font-bold">{price}</span>
        {period && <span className="text-gray-500">{period}</span>}
      </div>
      <p className="text-gray-400 text-sm mb-6">{description}</p>
      <ul className="space-y-3 mb-8">
        {features.map((f: string, i: number) => (
          <li key={i} className="flex items-center gap-3 text-sm">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            {f}
          </li>
        ))}
      </ul>
      <Link href="/register" className={`block text-center py-3 rounded-lg transition ${popular ? 'bg-gradient-to-r from-emerald-400 to-cyan-500 text-white hover:opacity-90' : 'border border-white/20 hover:bg-white/5'}`}>
        Get Started
      </Link>
    </div>
  );
}