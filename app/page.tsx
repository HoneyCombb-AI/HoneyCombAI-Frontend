"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  LayoutDashboard,
  Bot,
  Target,
  Brain,
  TrendingUp,
  Eye,
  Search,
  MessageSquare,
  Network,
} from "lucide-react";
import Image from "next/image";

// Custom Hexagon SVG Component
const HexagonIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M17.5 3.5L22 12l-4.5 8.5h-11L2 12l4.5-8.5h11z" />
  </svg>
);

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-amber-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-2">
            <div className="hexagon-loader">
              <div>
                <div>
                  <span className="one h6"></span>
                  <span className="two h3"></span>
                </div>
              </div>
              <div>
                <div>
                  <span className="one h1"></span>
                  <span className="two h4"></span>
                </div>
              </div>
              <div>
                <div>
                  <span className="one h5"></span>
                  <span className="two h2"></span>
                </div>
              </div>
            </div>
            {/* Center hexagon icon */}
            <HexagonIcon className="absolute inset-0 text-amber-400 animate-pulse z-10 w-10 h-10 m-auto rotate-90" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent mb-2">
            Honeycomb AI
          </h1>
          <p className="text-slate-400 animate-pulse">Gathering your experience...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-amber-500/10 to-yellow-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -left-20 w-80 h-80 bg-gradient-to-br from-orange-500/10 to-amber-500/5 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-0 right-1/3 w-72 h-72 bg-gradient-to-br from-yellow-500/10 to-amber-500/5 rounded-full blur-3xl animate-pulse delay-2000"></div>

        {/* Hexagonal Grid Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="grid grid-cols-12 gap-4 h-full w-full transform rotate-12 scale-150">
            {Array.from({ length: 144 }).map((_, i) => (
              <HexagonIcon
                key={i}
                className="w-4 h-4 text-amber-400 animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4">
        <div className="container mx-auto text-center max-w-6xl relative z-10">
          <Badge
            variant="outline"
            className="mb-8 px-6 py-3 text-sm border-amber-400/30 text-amber-300 bg-amber-500/10 backdrop-blur-sm"
          >
            <Bot className="w-4 h-4 mr-2" />
            AI Agents Working in the Shadows
          </Badge>

          {/* Logo and Title */}
          <div className="flex items-center justify-center gap-6 mb-8">
            <div className="relative">
              <div className="h-20 w-20 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-amber-500/25 rotate-3 hover:rotate-0 transition-transform duration-700">
                {/* Custom Honeycomb Logo */}
                <div className="relative">
                  <HexagonIcon className="w-8 h-8 text-slate-900 absolute" />
                  <HexagonIcon className="w-6 h-6 text-slate-900 absolute top-1 left-1" />
                  <HexagonIcon className="w-4 h-4 text-slate-900 absolute top-2 left-2" />
                </div>
              </div>
              <div className="absolute -inset-2 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-2xl blur-lg opacity-30 animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-6xl md:text-8xl font-black bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-400 bg-clip-text text-transparent leading-tight">
                Honeycomb
              </h1>
              <div className="text-2xl md:text-3xl font-bold text-amber-400/80 -mt-2">AI</div>
            </div>
          </div>

          <h2 className="text-3xl md:text-5xl font-bold text-slate-100 mb-6 leading-tight">
            AI Agents That
            <span className="bg-gradient-to-r from-amber-300 to-yellow-400 bg-clip-text text-transparent"> Harvest </span>
            The Sweetest Leads
          </h2>

          <p className="text-xl md:text-2xl text-slate-300 mb-4 font-medium">
            Gathering and nurturing the sweetest leads for your hive
          </p>

          <p className="text-lg text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            Our AI agents conduct deep social and web analysis to uncover hidden buyer intent,
            operating in the shadows to transform prospects into your most valuable pipeline
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            {user ? (
              <>
                <Button
                  size="lg"
                  className="text-xl px-12 py-6 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 font-bold transition-all duration-500 ease-out shadow-lg shadow-amber-500/25 hover:shadow-amber-400/50 hover:-translate-y-1 hover:shadow-2xl"
                  onClick={() => router.push("/contacts")}
                >
                  Enter The Hive <LayoutDashboard className="ml-3 h-6 w-6" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="lg"
                  className="text-xl px-12 py-6 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 font-bold transition-all duration-500 ease-out shadow-lg shadow-amber-500/25 hover:shadow-amber-400/50 hover:-translate-y-1 hover:shadow-2xl"
                  onClick={() => router.push("/login")}
                >
                  Start Gathering <ArrowRight className="ml-3 h-6 w-6" />
                </Button>
                <Button
                  size="lg"
                  className="text-xl px-12 py-6 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 font-bold transition-all duration-500 ease-out shadow-lg shadow-amber-500/25 hover:shadow-amber-400/50 hover:-translate-y-1 hover:shadow-2xl"
                >
                  Watch The Swarm
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Mysterious AI Capabilities */}
      <section className="py-32 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-3 mb-6">
              <HexagonIcon className="w-8 h-8 text-amber-400" />
              <h3 className="text-5xl font-black text-slate-100">
                The Swarm Intelligence
              </h3>
              <HexagonIcon className="w-8 h-8 text-amber-400" />
            </div>
            <p className="text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Invisible agents gathering intelligence that human analysis cannot perceive
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="bg-slate-800/50 border-amber-500/20 hover:border-amber-400/40 transition-all duration-500 backdrop-blur-sm hover:shadow-2xl hover:shadow-amber-500/10 group">
              <CardHeader className="text-center pb-4">
                <div className="relative mx-auto mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full flex items-center justify-center group-hover:-translate-y-1 transition-all duration-500 ease-out">
                    <Eye className="h-10 w-10 text-amber-400" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-full blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
                </div>
                <CardTitle className="text-2xl font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                  Deep Social Intelligence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-slate-300 text-lg leading-relaxed">
                  AI agents analyze digital footprints across the web, revealing patterns invisible to traditional methods
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-orange-500/20 hover:border-orange-400/40 transition-all duration-500 backdrop-blur-sm hover:shadow-2xl hover:shadow-orange-500/10 group">
              <CardHeader className="text-center pb-4">
                <div className="relative mx-auto mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-full flex items-center justify-center group-hover:-translate-y-1 transition-all duration-500 ease-out">
                    <Target className="h-10 w-10 text-orange-400" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-500 rounded-full blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
                </div>
                <CardTitle className="text-2xl font-bold text-slate-100 group-hover:text-orange-300 transition-colors">
                  Intent Prediction
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-slate-300 text-lg leading-relaxed">
                  Uncover buying signals hidden in behavioral data through advanced pattern recognition algorithms
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-purple-500/20 hover:border-purple-400/40 transition-all duration-500 backdrop-blur-sm hover:shadow-2xl hover:shadow-purple-500/10 group">
              <CardHeader className="text-center pb-4">
                <div className="relative mx-auto mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center group-hover:-translate-y-1 transition-all duration-500 ease-out">
                    <Brain className="h-10 w-10 text-purple-400" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
                </div>
                <CardTitle className="text-2xl font-bold text-slate-100 group-hover:text-purple-300 transition-colors">
                  Behavioral Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-slate-300 text-lg leading-relaxed">
                  Track engagement cycles and activity patterns to identify the perfect moment for outreach
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-green-500/20 hover:border-green-400/40 transition-all duration-500 backdrop-blur-sm hover:shadow-2xl hover:shadow-green-500/10 group">
              <CardHeader className="text-center pb-4">
                <div className="relative mx-auto mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center group-hover:-translate-y-1 transition-all duration-500 ease-out">
                    <Bot className="h-10 w-10 text-green-400" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
                </div>
                <CardTitle className="text-2xl font-bold text-slate-100 group-hover:text-green-300 transition-colors">
                  Autonomous Nurturing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-slate-300 text-lg leading-relaxed">
                  AI agents maintain relationships through intelligent automation, working tirelessly in the background
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Product Showcase */}
      <section className="py-32 bg-slate-800/30 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h3 className="text-5xl font-black text-slate-100 mb-6">
              Intelligence In Action
            </h3>
            <p className="text-2xl text-slate-300 max-w-3xl mx-auto">
              Witness how our AI agents transform raw data into actionable pipeline intelligence
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
            <div className="space-y-8">
              <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 p-8 rounded-2xl border border-amber-500/20 backdrop-blur-sm">
                <div className="w-full h-80 bg-gradient-to-br from-slate-700 to-slate-600 rounded-xl border border-amber-500/10 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent"></div>
                  <Image
                    src="/ContactsDashboard.png"
                    alt="Honeycomb AI Social Intelligence Dashboard"
                    fill
                    className="object-cover rounded-xl"
                  />
                  <HexagonIcon className="absolute top-4 right-4 w-8 h-8 text-amber-400/40 z-10" />
                  <HexagonIcon className="absolute bottom-4 left-4 w-6 h-6 text-amber-400/30 z-10" />
                </div>
                <h4 className="text-2xl font-bold mt-6 mb-3 text-slate-100">Lead Intelligence Matrix</h4>
                <p className="text-slate-300 text-lg">
                  Deep social and web analysis reveals behavioral patterns and engagement signals across multiple touchpoints
                </p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 p-8 rounded-2xl border border-orange-500/20 backdrop-blur-sm">
                <div className="w-full h-80 bg-gradient-to-br from-slate-700 to-slate-600 rounded-xl border border-orange-500/10 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent"></div>
                  <Image
                    src="/Recommendations.png"
                    alt="Honeycomb AI Strategic Recommendations"
                    fill
                    className="object-cover rounded-xl"
                  />
                  <HexagonIcon className="absolute top-4 right-4 w-8 h-8 text-orange-400/40 z-10" />
                  <HexagonIcon className="absolute bottom-4 left-4 w-6 h-6 text-orange-400/30 z-10" />
                </div>
                <h4 className="text-2xl font-bold mt-6 mb-3 text-slate-100">Strategic Recommendations</h4>
                <p className="text-slate-300 text-lg">
                  AI-generated insights guide your outreach strategy with precision timing and personalized messaging
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h3 className="text-5xl font-black text-slate-100 mb-6">
              Complete Pipeline Arsenal
            </h3>
            <p className="text-2xl text-slate-300 max-w-3xl mx-auto">
              Every weapon your sales team needs, forged by mysterious AI intelligence
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-gradient-to-br from-slate-800/60 to-slate-700/40 border-amber-500/20 hover:border-amber-400/60 transition-all duration-500 ease-out backdrop-blur-sm group hover:-translate-y-2 hover:shadow-xl hover:shadow-amber-500/10">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500/30 to-yellow-500/30 rounded-2xl flex items-center justify-center mb-4 group-hover:rotate-3 group-hover:-translate-y-1 transition-all duration-500 ease-out">
                  <Search className="h-8 w-8 text-amber-400" />
                </div>
                <CardTitle className="text-2xl text-slate-100">Social & Web Intelligence</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-300 text-lg">
                  AI agents scan digital presence across platforms, hunting for buying signals and behavioral patterns in the shadows
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-800/60 to-slate-700/40 border-orange-500/20 hover:border-orange-400/60 transition-all duration-500 ease-out backdrop-blur-sm group hover:-translate-y-2 hover:shadow-xl hover:shadow-orange-500/10">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500/30 to-red-500/30 rounded-2xl flex items-center justify-center mb-4 group-hover:rotate-3 group-hover:-translate-y-1 transition-all duration-500 ease-out">
                  <Target className="h-8 w-8 text-orange-400" />
                </div>
                <CardTitle className="text-2xl text-slate-100">Smart Lead Scoring</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-300 text-lg">
                  Automated ICP matching and intent detection through advanced machine learning algorithms that never sleep
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-800/60 to-slate-700/40 border-purple-500/20 hover:border-purple-400/60 transition-all duration-500 ease-out backdrop-blur-sm group hover:-translate-y-2 hover:shadow-xl hover:shadow-purple-500/10">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-2xl flex items-center justify-center mb-4 group-hover:rotate-3 group-hover:-translate-y-1 transition-all duration-500 ease-out">
                  <Brain className="h-8 w-8 text-purple-400" />
                </div>
                <CardTitle className="text-2xl text-slate-100">Behavioral Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-300 text-lg">
                  Deep pattern recognition across web activity to identify engagement opportunities when prospects are most receptive
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-800/60 to-slate-700/40 border-blue-500/20 hover:border-blue-400/60 transition-all duration-500 ease-out backdrop-blur-sm group hover:-translate-y-2 hover:shadow-xl hover:shadow-blue-500/10">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500/30 to-cyan-500/30 rounded-2xl flex items-center justify-center mb-4 group-hover:rotate-3 group-hover:-translate-y-1 transition-all duration-500 ease-out">
                  <MessageSquare className="h-8 w-8 text-blue-400" />
                </div>
                <CardTitle className="text-2xl text-slate-100">Personalized Outreach</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-300 text-lg">
                  AI-crafted messaging based on gathered intelligence and behavioral insights, striking at the perfect moment
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-800/60 to-slate-700/40 border-green-500/20 hover:border-green-400/60 transition-all duration-500 ease-out backdrop-blur-sm group hover:-translate-y-2 hover:shadow-xl hover:shadow-green-500/10">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-green-500/30 to-emerald-500/30 rounded-2xl flex items-center justify-center mb-4 group-hover:rotate-3 group-hover:-translate-y-1 transition-all duration-500 ease-out">
                  <Network className="h-8 w-8 text-green-400" />
                </div>
                <CardTitle className="text-2xl text-slate-100">Relationship Automation</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-300 text-lg">
                  Long-term prospect nurturing through intelligent AI agents and automated workflows that work tirelessly
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-800/60 to-slate-700/40 border-pink-500/20 hover:border-pink-400/60 transition-all duration-500 ease-out backdrop-blur-sm group hover:-translate-y-2 hover:shadow-xl hover:shadow-pink-500/10">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500/30 to-rose-500/30 rounded-2xl flex items-center justify-center mb-4 group-hover:rotate-3 group-hover:-translate-y-1 transition-all duration-500 ease-out">
                  <TrendingUp className="h-8 w-8 text-pink-400" />
                </div>
                <CardTitle className="text-2xl text-slate-100">Pipeline Optimization</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-300 text-lg">
                  Intelligent lead filtering and prioritization to maximize conversion rates and revenue potential
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-32 bg-slate-800/30 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h3 className="text-5xl font-black text-slate-100 mb-6">
              The Hive Protocol
            </h3>
            <p className="text-2xl text-slate-300 max-w-3xl mx-auto">
              Three phases of AI agent deployment to dominate your sales pipeline
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 max-w-6xl mx-auto">
            <div className="text-center group">
              <div className="relative mb-8">
                <div className="w-28 h-28 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-amber-500/25 group-hover:-translate-y-2 transition-all duration-500 ease-out">
                  <span className="text-4xl font-black text-slate-900">1</span>
                </div>
                <div className="absolute -inset-4 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                <HexagonIcon className="absolute -top-2 -right-2 w-6 h-6 text-amber-400 animate-spin-slow" />
              </div>
              <h4 className="text-3xl font-bold mb-6 text-slate-100 group-hover:text-amber-300 transition-colors">
                Deploy The Swarm
              </h4>
              <p className="text-slate-300 text-xl leading-relaxed">
                AI agents infiltrate social and web networks, continuously scanning for intelligence that humans miss
              </p>
            </div>

            <div className="text-center group">
              <div className="relative mb-8">
                <div className="w-28 h-28 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-orange-500/25 group-hover:-translate-y-2 transition-all duration-500 ease-out">
                  <span className="text-4xl font-black text-slate-900">2</span>
                </div>
                <div className="absolute -inset-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                <HexagonIcon className="absolute -top-2 -right-2 w-6 h-6 text-orange-400 animate-spin-slow" />
              </div>
              <h4 className="text-3xl font-bold mb-6 text-slate-100 group-hover:text-orange-300 transition-colors">
                Analyze & Prioritize
              </h4>
              <p className="text-slate-300 text-xl leading-relaxed">
                Machine learning algorithms process hidden intent signals, identifying your most valuable targets
              </p>
            </div>

            <div className="text-center group">
              <div className="relative mb-8">
                <div className="w-28 h-28 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-purple-500/25 group-hover:-translate-y-2 transition-all duration-500 ease-out">
                  <span className="text-4xl font-black text-slate-900">3</span>
                </div>
                <div className="absolute -inset-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                <HexagonIcon className="absolute -top-2 -right-2 w-6 h-6 text-purple-400 animate-spin-slow" />
              </div>
              <h4 className="text-3xl font-bold mb-6 text-slate-100 group-hover:text-purple-300 transition-colors">
                Execute & Convert
              </h4>
              <p className="text-slate-300 text-xl leading-relaxed">
                Personalized campaigns launch automatically based on behavioral triggers and optimal timing
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Social Proof */}
      <section className="py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h3 className="text-5xl font-black text-slate-100 mb-6">
              Trusted By The Bold
            </h3>
            <p className="text-2xl text-slate-300 max-w-3xl mx-auto">
              Join visionary companies already harvesting success with our AI swarm
            </p>
          </div>

          <div className="flex justify-center items-center gap-20 opacity-60 hover:opacity-100 transition-opacity duration-500">
            <div className="flex items-center justify-center group">
              <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700 backdrop-blur-sm group-hover:border-amber-500/40 transition-all duration-300">
                <Image
                  src="/Justbooks.webp"
                  alt="JustBooks Solutions Pvt. Ltd."
                  width={180}
                  height={80}
                  className="object-contain grayscale group-hover:grayscale-0 transition-all duration-500"
                />
              </div>
            </div>
            <div className="flex items-center justify-center group">
              <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700 backdrop-blur-sm group-hover:border-amber-500/40 transition-all duration-300">
                <Image
                  src="/cocreate.webp"
                  alt="CoCreate Ventures"
                  width={180}
                  height={80}
                  className="object-contain grayscale group-hover:grayscale-0 transition-all duration-500"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 bg-gradient-to-br from-slate-900 via-amber-900/20 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-yellow-500/10"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-5xl mx-auto">
            <div className="flex justify-center mb-8">
              <HexagonIcon className="w-16 h-16 text-amber-400 animate-pulse" />
            </div>
            <h3 className="text-6xl md:text-7xl font-black text-slate-100 mb-8 leading-tight">
              Ready To
              <span className="bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">
                Unleash
              </span>
              <br />The Swarm?
            </h3>
            <p className="text-2xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Join the hive and start gathering the sweetest leads while your competitors sleep
            </p>

            <div className="flex flex-col sm:flex-row gap-8 justify-center">
              {user ? (
                <>
                  <Button
                    size="lg"
                    className="text-xl px-12 py-6 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 font-bold transition-all duration-500 ease-out shadow-lg shadow-amber-500/25 hover:shadow-amber-400/50 hover:-translate-y-1 hover:shadow-2xl"
                    onClick={() => router.push("/contacts")}
                  >
                    Enter The Hive <LayoutDashboard className="ml-3 h-6 w-6" />
                  </Button>
                  <Button
                    size="lg"
                    className="text-xl px-12 py-6 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 font-bold transition-all duration-500 ease-out shadow-lg shadow-amber-500/25 hover:shadow-amber-400/50 hover:-translate-y-1 hover:shadow-2xl"
                  >
                    Contact The Queens
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="lg"
                   className="text-xl px-12 py-6 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 font-bold transition-all duration-500 ease-out shadow-lg shadow-amber-500/25 hover:shadow-amber-400/50 hover:-translate-y-1 hover:shadow-2xl"
                    onClick={() => router.push("/login")}
                  >
                    Start Harvesting <ArrowRight className="ml-2 h-8 w-8" />
                  </Button>
                  <Button
                    size="lg"
                   className="text-xl px-12 py-6 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 font-bold transition-all duration-500 ease-out shadow-lg shadow-amber-500/25 hover:shadow-amber-400/50 hover:-translate-y-1 hover:shadow-2xl"
                  >
                    Contact The Queens
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="relative">
              <div className="h-12 w-12 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl flex items-center justify-center">
                <HexagonIcon className="w-6 h-6 text-slate-900" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl blur opacity-40"></div>
            </div>
            <h4 className="text-3xl font-black text-slate-100">Honeycomb AI</h4>
          </div>
          <p className="text-slate-400 mb-8 text-xl">
            Gathering and nurturing the sweetest leads for your hive
          </p>
          <div className="flex justify-center space-x-12 text-slate-400 mb-8">
            <a href="#" className="hover:text-amber-400 transition-colors text-lg font-medium">Privacy Policy</a>
            <a href="#" className="hover:text-amber-400 transition-colors text-lg font-medium">Terms of Service</a>
            <a href="#" className="hover:text-amber-400 transition-colors text-lg font-medium">Support</a>
            <a href="#" className="hover:text-amber-400 transition-colors text-lg font-medium">Contact</a>
          </div>
          <div className="pt-8 border-t border-slate-800 text-slate-500">
            © 2025 Honeycomb AI. All rights reserved. Built by the swarm, for the swarm.
          </div>
        </div>
      </footer>
    </div>
  );
}