import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  Shield,
  Zap,
  Users,
  BarChart3,
  Bug,
  ArrowRight,
  ClipboardCheck,
  Code2,
} from 'lucide-react';

const features = [
  {
    icon: <ClipboardCheck className="h-6 w-6" />,
    title: 'Test Case Management',
    description: 'Create, organize, and track test cases with detailed expected results and assignments.',
  },
  {
    icon: <Bug className="h-6 w-6" />,
    title: 'Bug Tracking',
    description: 'Report and monitor bugs with Jam.dev integration for visual evidence.',
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: 'Role-Based Access',
    description: 'Dedicated dashboards for Product Managers, QA Testers, and Engineers.',
  },
  {
    icon: <BarChart3 className="h-6 w-6" />,
    title: 'Real-Time Analytics',
    description: 'Track pass rates, bug counts, and team performance at a glance.',
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: 'Fast & Efficient',
    description: 'Streamlined workflows designed for speed and productivity.',
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: 'Secure & Reliable',
    description: 'Enterprise-grade security with role-based permissions.',
  },
];

const roles = [
  {
    role: 'Product Manager',
    icon: <Users className="h-8 w-8" />,
    color: 'from-blue-500 to-blue-600',
    features: ['Create test cases', 'View dashboard stats', 'Track bug reports', 'Manage assignments'],
  },
  {
    role: 'QA Tester',
    icon: <CheckCircle2 className="h-8 w-8" />,
    color: 'from-green-500 to-green-600',
    features: ['Execute test cases', 'Report test results', 'Submit bug reports', 'Add Jam evidence'],
  },
  {
    role: 'Engineering',
    icon: <Code2 className="h-8 w-8" />,
    color: 'from-purple-500 to-purple-600',
    features: ['View global feed', 'Access Jam recordings', 'Review bug details', 'Track test failures'],
  },
];

// Floating phrases for the background
const floatingPhrases = [
  { text: 'Quality Made Easy', top: '12%', left: '8%', delay: '0s', duration: '8s' },
  { text: 'Ship With Confidence', top: '25%', right: '10%', delay: '1s', duration: '7s' },
  { text: 'Zero Bugs', top: '45%', left: '5%', delay: '2s', duration: '9s' },
  { text: 'Test Smarter', top: '65%', right: '8%', delay: '0.5s', duration: '6s' },
  { text: 'Track Everything', top: '80%', left: '12%', delay: '1.5s', duration: '8s' },
  { text: 'Collaborate', top: '18%', right: '25%', delay: '3s', duration: '7s' },
  { text: 'Automate', top: '55%', left: '15%', delay: '2.5s', duration: '9s' },
  { text: 'Deliver Quality', top: '72%', right: '18%', delay: '0.8s', duration: '6s' },
  { text: 'Bug Free', top: '35%', left: '3%', delay: '1.8s', duration: '8s' },
  { text: 'Efficient Testing', top: '88%', right: '5%', delay: '2.2s', duration: '7s' },
];

export function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">QS</span>
              </div>
              <span className="font-bold text-xl">QualitySync</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link to="/login">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center">
        {/* Animated Background - Subtle with floating words */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Clean gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100" />

          {/* Subtle moving shapes - monochrome */}
          <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-gradient-to-br from-gray-200/40 to-gray-300/30 rounded-full blur-3xl animate-blob animate-move-horizontal" style={{ animationDuration: '20s' }} />
          <div className="absolute top-20 -right-20 w-[400px] h-[400px] bg-gradient-to-br from-slate-200/40 to-slate-300/30 rounded-full blur-3xl animate-blob animate-move-vertical" style={{ animationDuration: '18s', animationDelay: '2s' }} />
          <div className="absolute -bottom-20 left-1/4 w-[450px] h-[450px] bg-gradient-to-br from-gray-200/30 to-gray-300/20 rounded-full blur-3xl animate-blob animate-move-horizontal" style={{ animationDuration: '22s', animationDelay: '4s' }} />

          {/* Floating smaller circles - subtle gray */}
          <div className="absolute top-[15%] left-[10%] w-16 h-16 rounded-full bg-gray-300/30 animate-float blur-sm" style={{ animationDuration: '6s' }} />
          <div className="absolute top-[30%] right-[12%] w-12 h-12 rounded-full bg-slate-300/30 animate-float-reverse blur-sm" style={{ animationDuration: '7s', animationDelay: '1s' }} />
          <div className="absolute bottom-[25%] left-[18%] w-10 h-10 rounded-full bg-gray-300/25 animate-float blur-sm" style={{ animationDuration: '5s', animationDelay: '2s' }} />
          <div className="absolute top-[50%] right-[20%] w-14 h-14 rounded-full bg-slate-300/25 animate-float-reverse blur-sm" style={{ animationDuration: '8s', animationDelay: '0.5s' }} />

          {/* Rotating rings - subtle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-gray-200/50 rounded-full animate-spin-slow" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[750px] border border-dashed border-gray-200/30 rounded-full animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '30s' }} />

          {/* Floating Phrases */}
          {floatingPhrases.map((phrase, index) => (
            <div
              key={index}
              className="absolute text-gray-300/60 font-semibold text-lg tracking-wide select-none animate-float whitespace-nowrap"
              style={{
                top: phrase.top,
                left: phrase.left,
                right: phrase.right,
                animationDuration: phrase.duration,
                animationDelay: phrase.delay,
              }}
            >
              {phrase.text}
            </div>
          ))}
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm text-primary text-sm font-medium mb-8 border border-gray-200 shadow-sm">
              <Zap className="h-4 w-4" />
              Streamline Your QA Process
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-gray-900">
              Quality Assurance
              <span className="block text-primary">Made Simple</span>
            </h1>

            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              A powerful QA management system that brings Product Managers, Testers, and Engineers together. Track tests, report bugs, and ship quality software faster.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/login">
                <Button size="lg" className="text-lg px-8 h-12 shadow-lg hover:shadow-xl transition-shadow">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg px-8 h-12 bg-white/80 backdrop-blur-sm hover:bg-white">
                Watch Demo
              </Button>
            </div>
          </div>

          {/* Stats with card background */}
          <div className="mt-20 max-w-4xl mx-auto">
            <div className="relative">
              <div className="relative bg-white/80 backdrop-blur-md border border-gray-200 rounded-2xl p-8 shadow-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  {[
                    { value: '99.9%', label: 'Uptime' },
                    { value: '50K+', label: 'Tests Tracked' },
                    { value: '500+', label: 'Teams' },
                    { value: '4.9/5', label: 'User Rating' },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center group">
                      <div className="text-3xl sm:text-4xl font-bold text-primary group-hover:scale-110 transition-transform">
                        {stat.value}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything You Need for QA Excellence
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tools to manage your entire quality assurance workflow from test creation to bug resolution.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-card rounded-xl p-6 border shadow-sm hover:shadow-md transition-all hover:-translate-y-1"
              >
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Tailored for Every Role
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Dedicated dashboards and workflows designed specifically for each team member's needs.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {roles.map((role) => (
              <div
                key={role.role}
                className="relative overflow-hidden rounded-2xl border bg-card hover:shadow-lg transition-all hover:-translate-y-1"
              >
                <div className={`h-2 bg-gradient-to-r ${role.color}`} />
                <div className="p-6">
                  <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center text-white mb-4`}>
                    {role.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-4">{role.role}</h3>
                  <ul className="space-y-3">
                    {role.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
        {/* Subtle animated background for CTA */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-[300px] h-[300px] bg-white/5 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-white/5 rounded-full blur-3xl animate-float-reverse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-white/10 rounded-full animate-spin-slow" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Transform Your QA Process?
          </h2>
          <p className="text-xl opacity-90 mb-10 max-w-2xl mx-auto">
            Join hundreds of teams already using QualitySync to ship better software, faster.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login">
              <Button size="lg" variant="secondary" className="text-lg px-8 h-12 shadow-lg">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8 h-12 bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">QS</span>
              </div>
              <span className="font-semibold">QualitySync</span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} QualitySync. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
