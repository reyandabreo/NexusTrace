import Link from "next/link";
import { 
  Shield, 
  Brain, 
  Network, 
  ArrowRight, 
  Search, 
  Fingerprint,
  Lock,
  Zap,
  FileText,
  TrendingUp,
  Users,
  Github,
  Twitter,
  Linkedin,
  Mail,
  CheckCircle2,
  Clock,
  Database
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Nav */}
      <nav className="flex items-center justify-between border-b border-border px-4 sm:px-6 lg:px-8 py-3 sm:py-4 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          <span className="text-base sm:text-lg font-bold text-foreground">NexusTrace</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/login"
            className="text-xs sm:text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Log In
          </Link>
          <Link
            href="/register"
            className="rounded-lg sm:rounded-xl bg-primary px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero with animated background shapes */}
      <main className="flex flex-col items-center justify-center px-4 sm:px-6 text-center relative overflow-hidden min-h-screen">
        {/* Animated Background Shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Shield Shape */}
          <div className="absolute top-1/4 left-1/4 opacity-20 hidden sm:block">
            <div className="relative animate-float">
              <Shield className="h-32 w-32 sm:h-48 sm:w-48 lg:h-64 lg:w-64 text-primary blur-3xl" strokeWidth={0.5} />
              <div className="absolute inset-0 bg-primary/30 rounded-full blur-3xl animate-pulse" />
            </div>
          </div>
          
          {/* Magnifying Glass */}
          <div className="absolute top-1/3 right-1/4 opacity-15 hidden md:block">
            <div className="relative animate-float-delayed">
              <Search className="h-32 w-32 sm:h-40 sm:w-40 lg:h-48 lg:w-48 text-blue-500 blur-3xl" strokeWidth={0.5} />
              <div className="absolute inset-0 bg-blue-500/30 rounded-full blur-3xl animate-pulse-slow" />
            </div>
          </div>
          
          {/* Fingerprint */}
          <div className="absolute bottom-1/4 right-1/3 opacity-15 hidden sm:block">
            <div className="relative animate-float-slow">
              <Fingerprint className="h-36 w-36 sm:h-44 sm:w-44 lg:h-56 lg:w-56 text-purple-500 blur-3xl" strokeWidth={0.5} />
              <div className="absolute inset-0 bg-purple-500/30 rounded-full blur-3xl animate-pulse" />
            </div>
          </div>

          {/* Additional glowing orbs */}
          <div className="absolute top-1/2 left-1/3 w-48 h-48 sm:w-72 sm:h-72 lg:w-96 lg:h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-1/3 left-1/2 w-36 h-36 sm:w-56 sm:h-56 lg:w-72 lg:h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10">
          <div className="mb-4 sm:mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 sm:px-4 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium text-primary backdrop-blur-sm">
            <Shield className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            Forensic Intelligence Platform
          </div>

          <h1 className="max-w-3xl mx-auto text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-foreground">
            Investigate Smarter with{" "}
            <span className="text-primary">AI-Powered</span> Intelligence
          </h1>

          <p className="mt-4 sm:mt-6 max-w-xl mx-auto text-sm sm:text-base lg:text-lg text-muted-foreground px-4">
            Upload evidence, visualize connections, and query your knowledge base
            using advanced RAG technology. Built for forensic investigators.
          </p>

          <div className="mt-6 sm:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <Link
              href="/register"
              className="flex items-center justify-center gap-2 rounded-lg sm:rounded-xl bg-primary px-6 sm:px-8 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:scale-105 hover:shadow-lg hover:shadow-primary/50"
            >
              Start Investigation
              <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Link>
            <Link
              href="/login"
              className="rounded-lg sm:rounded-xl border border-border bg-card/50 backdrop-blur-sm px-6 sm:px-8 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-foreground transition-all hover:bg-accent hover:scale-105"
            >
              Sign In
            </Link>
          </div>
        </div>
      </main>

      {/* Detailed Features Section */}
      <section className="py-12 sm:py-16 lg:py-24 px-4 sm:px-6 bg-linear-to-b from-background to-accent/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4">
              Powerful Features for Modern Investigations
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base lg:text-lg max-w-2xl mx-auto px-4">
              NexusTrace combines cutting-edge AI with intuitive design to revolutionize how you conduct forensic investigations
            </p>
          </div>

          {/* Feature 1: RAG-Powered Analysis */}
          <div className="mb-16 sm:mb-24 grid md:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div className="order-2 md:order-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 sm:px-4 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium text-primary mb-3 sm:mb-4">
                <Brain className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                AI-Powered Intelligence
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 sm:mb-4">
                RAG-Powered Analysis
              </h3>
              <p className="text-muted-foreground text-sm sm:text-base lg:text-lg mb-4 sm:mb-6">
                Harness the power of Retrieval-Augmented Generation to interrogate your evidence like never before. Our AI doesn't just search—it understands context, draws connections, and provides explainable answers.
              </p>
              <ul className="space-y-3 sm:space-y-4">
                <li className="flex gap-2 sm:gap-3">
                  <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm sm:text-base text-foreground">Intelligent Q&A</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">Ask natural language questions and receive precise, cited answers from your evidence base</p>
                  </div>
                </li>
                <li className="flex gap-2 sm:gap-3">
                  <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm sm:text-base text-foreground">Source Attribution</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">Every answer includes references to source documents with exact locations</p>
                  </div>
                </li>
                <li className="flex gap-2 sm:gap-3">
                  <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm sm:text-base text-foreground">Contextual Understanding</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">AI maintains conversation history and case context for deeper insights</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="order-1 md:order-2 relative">
              <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-2xl">
                <div className="flex items-start gap-3 sm:gap-4 mb-4">
                  <div className="p-2 sm:p-3 rounded-xl bg-primary/10">
                    <Brain className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-20 bg-primary/5 rounded-lg border-l-4 border-primary p-4">
                    <div className="h-2 bg-primary/20 rounded w-full mb-2" />
                    <div className="h-2 bg-primary/20 rounded w-4/5" />
                  </div>
                  <div className="flex gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div className="h-3 bg-muted rounded w-32" />
                  </div>
                </div>
              </div>
              <div className="absolute -z-10 inset-0 bg-primary/20 blur-3xl rounded-full" />
            </div>
          </div>

          {/* Feature 2: Network Visualization */}
          <div className="mb-16 sm:mb-24 grid md:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div className="relative">
              <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-2xl">
                <div className="relative h-48 sm:h-64">
                  {/* Simulated network graph */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="h-12 w-12 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center">
                      <Users className="h-6 w-6 text-green-500" />
                    </div>
                  </div>
                  <div className="absolute top-1/4 left-1/4">
                    <div className="h-10 w-10 rounded-full bg-blue-500/20 border-2 border-blue-500" />
                  </div>
                  <div className="absolute top-1/4 right-1/4">
                    <div className="h-10 w-10 rounded-full bg-purple-500/20 border-2 border-purple-500" />
                  </div>
                  <div className="absolute bottom-1/4 left-1/3">
                    <div className="h-10 w-10 rounded-full bg-yellow-500/20 border-2 border-yellow-500" />
                  </div>
                  {/* Connection lines */}
                  <svg className="absolute inset-0 w-full h-full">
                    <line x1="50%" y1="50%" x2="25%" y2="25%" stroke="currentColor" strokeWidth="2" className="text-border" strokeDasharray="5,5" />
                    <line x1="50%" y1="50%" x2="75%" y2="25%" stroke="currentColor" strokeWidth="2" className="text-border" strokeDasharray="5,5" />
                    <line x1="50%" y1="50%" x2="33%" y2="75%" stroke="currentColor" strokeWidth="2" className="text-border" strokeDasharray="5,5" />
                  </svg>
                </div>
              </div>
              <div className="absolute -z-10 inset-0 bg-green-500/20 blur-3xl rounded-full" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-green-500/10 px-3 sm:px-4 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium text-green-500 mb-3 sm:mb-4">
                <Network className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                Visual Intelligence
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 sm:mb-4">
                Network Visualization
              </h3>
              <p className="text-muted-foreground text-sm sm:text-base lg:text-lg mb-4 sm:mb-6">
                Transform complex data into clear, interactive visualizations. Discover hidden relationships, track timelines, and map out entire networks with our advanced graph technology.
              </p>
              <ul className="space-y-3 sm:space-y-4">
                <li className="flex gap-2 sm:gap-3">
                  <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm sm:text-base text-foreground">Entity Relationship Graphs</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">Visualize connections between people, places, events, and evidence in real-time</p>
                  </div>
                </li>
                <li className="flex gap-2 sm:gap-3">
                  <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm sm:text-base text-foreground">Interactive Timeline Analysis</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">Track events chronologically with drag-and-drop timeline builder</p>
                  </div>
                </li>
                <li className="flex gap-2 sm:gap-3">
                  <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm sm:text-base text-foreground">Pattern Detection</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">AI-assisted identification of clusters, anomalies, and key nodes in your network</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Feature 3: Secure Investigation */}
          <div className="grid md:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div className="order-2 md:order-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-yellow-500/10 px-3 sm:px-4 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium text-yellow-500 mb-3 sm:mb-4">
                <Shield className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                Enterprise Security
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 sm:mb-4">
                Secure Investigation
              </h3>
              <p className="text-muted-foreground text-sm sm:text-base lg:text-lg mb-4 sm:mb-6">
                Built with security and compliance at its core. Your sensitive evidence is protected with enterprise-grade encryption, granular access controls, and comprehensive audit trails.
              </p>
              <ul className="space-y-3 sm:space-y-4">
                <li className="flex gap-2 sm:gap-3">
                  <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm sm:text-base text-foreground">Case-Scoped Access Control</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">Role-based permissions ensure team members only access authorized cases and evidence</p>
                  </div>
                </li>
                <li className="flex gap-2 sm:gap-3">
                  <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm sm:text-base text-foreground">Complete Audit Trails</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">Every action is logged with timestamps and user attribution for full accountability</p>
                  </div>
                </li>
                <li className="flex gap-2 sm:gap-3">
                  <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm sm:text-base text-foreground">Data Compartmentalization</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">Evidence remains isolated per case, preventing cross-contamination and ensuring chain of custody</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="order-1 md:order-2 relative">
              <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-2xl">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs sm:text-sm font-semibold text-foreground truncate">Encrypted at Rest</div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground">AES-256 encryption</div>
                    </div>
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 shrink-0" />
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <Database className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs sm:text-sm font-semibold text-foreground truncate">Audit Logging</div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground">Complete activity tracking</div>
                    </div>
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 shrink-0" />
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs sm:text-sm font-semibold text-foreground truncate">Role-Based Access</div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground">Granular permissions</div>
                    </div>
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 shrink-0" />
                  </div>
                </div>
              </div>
              <div className="absolute -z-10 inset-0 bg-yellow-500/20 blur-3xl rounded-full" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-10 sm:py-12 lg:py-16 px-4 sm:px-6 border-y border-border bg-card/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary mb-1 sm:mb-2">99.9%</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Uptime SLA</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary mb-1 sm:mb-2">&lt;2s</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Average Query Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary mb-1 sm:mb-2">256-bit</div>
              <div className="text-xs sm:text-sm text-muted-foreground">AES Encryption</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary mb-1 sm:mb-2">24/7</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Support Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="bg-accent/30 border-t border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
            {/* Brand Column */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                <span className="text-base sm:text-lg font-bold text-foreground">NexusTrace</span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                Advanced forensic intelligence platform powered by AI, built for modern investigators.
              </p>
              <div className="flex gap-3">
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <Twitter className="h-4 w-4 sm:h-5 sm:w-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <Github className="h-4 w-4 sm:h-5 sm:w-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <Linkedin className="h-4 w-4 sm:h-5 sm:w-5" />
                </a>
              </div>
            </div>

            {/* Product Column */}
            <div>
              <h4 className="font-semibold text-sm sm:text-base text-foreground mb-3 sm:mb-4">Product</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Documentation</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">API Reference</a></li>
              </ul>
            </div>

            {/* Company Column */}
            <div>
              <h4 className="font-semibold text-sm sm:text-base text-foreground mb-3 sm:mb-4">Company</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">About Us</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Careers</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>

            {/* Legal Column */}
            <div>
              <h4 className="font-semibold text-sm sm:text-base text-foreground mb-3 sm:mb-4">Legal</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Security</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Compliance</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-6 sm:pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-3 sm:gap-4 text-center md:text-left">
            <p className="text-xs sm:text-sm text-muted-foreground">
              &copy; 2026 NexusTrace. All rights reserved. Forensic Intelligence Platform.
            </p>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <a href="mailto:support@nexustrace.io" className="hover:text-foreground transition-colors">
                support@nexustrace.io
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
