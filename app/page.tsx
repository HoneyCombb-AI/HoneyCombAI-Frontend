"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Users, Building2, BarChart3, Shield, Zap, Globe, LayoutDashboard } from "lucide-react";
import Image from "next/image";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Don't auto-redirect authenticated users - let them see the landing page

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-200 rounded-full"></div>
            <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Accountify
          </h1>
          <p className="text-gray-600 animate-pulse">Loading your experience...</p>
        </div>
      </div>
    );
  }

  // Landing page for unauthenticated users
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        <div className="container mx-auto px-4 py-24 relative">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="outline" className="mb-6 px-4 py-2 text-sm">
              ✨ Transform Your Business Relationships
            </Badge>
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                <Image 
                  src="/vercel.svg" 
                  alt="Accountify Logo" 
                  width={32} 
                  height={40} 
                  className="object-contain" 
                  style={{ background: "transparent" }} 
                />
              </div>
              <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent animate-fade-in">
                Accountify
              </h1>
            </div>
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-6">
              Your Complete Contact & Company Management Solution
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Streamline your business relationships with powerful contact management, 
              company insights, and intelligent automation. Built for modern teams who value efficiency.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                // Logged in user buttons
                <>
                  <Button 
                    size="lg" 
                    className="text-lg px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors duration-200"
                    onClick={() => router.push("/contacts")}
                  >
                    Go to Dashboard <LayoutDashboard className="ml-2 h-5 w-5" />
                  </Button>
                  <Button 
                    variant="secondary"
                    size="lg" 
                    className="text-lg px-8 py-4 bg-gray-100 text-gray-900 hover:bg-gray-200 font-medium transition-colors duration-200"
                  >
                    Watch Demo
                  </Button>
                </>
              ) : (
                // Logged out user buttons
                <>
                  <Button 
                    size="lg" 
                    className="text-lg px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors duration-200"
                    onClick={() => router.push("/login")}
                  >
                    Get Started <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button 
                    variant="secondary"
                    size="lg" 
                    className="text-lg px-8 py-4 bg-gray-100 text-gray-900 hover:bg-gray-200 font-medium transition-colors duration-200"
                  >
                    Watch Demo
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Manage Your Network
            </h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to help you build stronger business relationships
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow duration-300 border-0 bg-gradient-to-br from-blue-50 to-blue-100">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-semibold">Smart Contact Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-gray-600">
                  Organize, categorize, and track all your contacts with intelligent tagging and advanced search capabilities.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-300 border-0 bg-gradient-to-br from-purple-50 to-purple-100">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-semibold">Company Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-gray-600">
                  Get comprehensive company profiles with detailed information, relationships, and business intelligence.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-300 border-0 bg-gradient-to-br from-green-50 to-green-100">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-semibold">Analytics & Reporting</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-gray-600">
                  Track engagement, monitor relationships, and generate insights with powerful analytics tools.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-300 border-0 bg-gradient-to-br from-orange-50 to-orange-100">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-semibold">Enterprise Security</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-gray-600">
                  Bank-level security with end-to-end encryption, role-based access, and compliance standards.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-300 border-0 bg-gradient-to-br from-indigo-50 to-indigo-100">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-semibold">Automation</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-gray-600">
                  Automate follow-ups, notifications, and workflows to save time and never miss important connections.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-300 border-0 bg-gradient-to-br from-pink-50 to-pink-100">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Globe className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-semibold">Global Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-gray-600">
                  Connect with popular tools and platforms to create a seamless workflow across your business.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Business?
          </h3>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of professionals who trust Accountify to manage their most important business relationships.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              // Logged in user CTA buttons
              <>
                <Button 
                  size="lg" 
                  className="text-lg px-8 py-4 bg-white text-blue-600 hover:bg-blue-50 font-medium transition-colors duration-200"
                  onClick={() => router.push("/contacts")}
                >
                  Go to Dashboard <LayoutDashboard className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  className="text-lg px-8 py-4 bg-blue-800 text-white hover:bg-blue-900 font-medium transition-colors duration-200"
                >
                  Contact Sales
                </Button>
              </>
            ) : (
              // Logged out user CTA buttons
              <>
                <Button 
                  size="lg" 
                  className="text-lg px-8 py-4 bg-white text-blue-600 hover:bg-blue-50 font-medium transition-colors duration-200"
                  onClick={() => router.push("/login")}
                >
                  Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  className="text-lg px-8 py-4 bg-blue-800 text-white hover:bg-blue-900 font-medium transition-colors duration-200"
                >
                  Contact Sales
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h4 className="text-2xl font-bold mb-4">Accountify</h4>
          <p className="text-gray-400 mb-6">
            Empowering businesses through intelligent relationship management.
          </p>
          <div className="flex justify-center space-x-8 text-sm text-gray-400">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Support</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-sm text-gray-500">
            © 2025 Accountify. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
