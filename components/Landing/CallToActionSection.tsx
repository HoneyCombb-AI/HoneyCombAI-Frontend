"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle, Zap } from "lucide-react";
import React, { JSX } from "react";
import { useRouter } from "next/navigation";

interface HeaderProps {
  user?: any;
}

export function CallToActionSection({ user }: HeaderProps): JSX.Element {
  const features = [
    "Automate 90% of accounting tasks",
    "Real-time financial insights",
    "Seamless integrations with all major platforms",
  ];
    const router = useRouter();

  const handleLoginClick = () => {
    console.log("click")
    if (user) {
      router.push("/contacts");
    } else {
      router.push("/login");
    }
  };

  return (
    <section className="relative w-full pb-16">
      <div className="relative w-full min-h-[40vh] flex items-center justify-center">
        {/* Main CTA container with gradient */}
        <div className="relative w-full max-w-6xl mx-auto px-6">
          <Card className="relative overflow-hidden border-none shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-300 via-orange-400 to-red-500" />

            {/* Content overlay */}
            <CardContent className="relative z-10 p-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[300px]">
                {/* Left content section */}
                <div className="flex flex-col justify-center p-8 lg:p-12">
                  {/* Badge */}
                  <Badge
                    variant="outline"
                    className="flex items-center gap-2 bg-white/20 border-white/30 backdrop-blur-sm text-[#0f4f48] px-4 py-2 mb-6 w-fit"
                  >
                    <Zap className="w-4 h-4" />
                    <span className="[font-family:'Inter-Medium',Helvetica] font-medium text-sm">
                      Experience the radically exciting future
                    </span>
                  </Badge>

                  {/* Main heading */}
                  <h2 className="[font-family:'Inter-Medium',Helvetica] font-medium text-[#0f4f48] text-4xl lg:text-5xl leading-tight mb-6">
                    Ready to transform your
                    <br />
                    broker accounting?
                  </h2>

                  {/* Description */}
                  <p className="[font-family:'Inter-Regular',Helvetica] font-normal text-[#0f4f48] text-lg leading-relaxed mb-6 opacity-90">
                    Join thousands of brokers who have already revolutionized
                    their accounting processes with Comulate.
                  </p>

                  {/* Features list */}
                  <div className="space-y-3 mb-6">
                    {features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <CheckCircle className="w-6 h-6 text-[#0f4f48] flex-shrink-0" />
                        <span className="[font-family:'Inter-Regular',Helvetica] font-normal text-[#0f4f48] text-lg">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* CTA buttons */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button onClick={handleLoginClick} className="bg-[#4adf7d] cursor-pointer hover:bg-[#4adf7d]/90 text-[#0f4f48] shadow-[0px_1px_2px_#1018280d] h-14 px-8 rounded [font-family:'Inter-Medium',Helvetica] font-medium text-lg tracking-[0] leading-6">
                      {user ? "Access Dashboard" : "Log in"}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>

                    <Button
                      variant="outline"
                      className="bg-white/20 hover:bg-white/30 border-white/40 text-[#0f4f48] backdrop-blur-sm h-14 px-8 rounded [font-family:'Inter-Medium',Helvetica] font-medium text-lg tracking-[0] leading-6"
                    >
                      Book demo
                    </Button>
                  </div>
                </div>

                {/* Right visual section */}
                <div className="relative flex items-center justify-center p-12 lg:p-16">
                  {/* Floating cards for visual interest */}
                  <div className="relative w-full max-w-sm">
                    {/* Main dashboard card */}
                    <Card className="bg-white/95 backdrop-blur-sm border border-white/50 shadow-xl transform rotate-3">
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="[font-family:'Inter-Medium',Helvetica] font-medium text-[#0f4f48] text-sm">
                              Monthly Revenue
                            </span>
                            <Badge className="bg-green-100 text-green-800">
                              +23.5%
                            </Badge>
                          </div>
                          <div className="[font-family:'Inter-Medium',Helvetica] font-medium text-[#0f4f48] text-2xl">
                            $2,847,392
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full">
                            <div className="h-2 bg-gradient-to-r from-green-400 to-blue-500 rounded-full w-3/4"></div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Secondary floating card */}
                    <Card className="absolute -top-4 -right-4 bg-white/90 backdrop-blur-sm border border-white/50 shadow-lg transform -rotate-6 w-32">
                      <CardContent className="p-3">
                        <div className="text-center">
                          <div className="[font-family:'Inter-Medium',Helvetica] font-medium text-[#0f4f48] text-lg">
                            98.7%
                          </div>
                          <div className="[font-family:'Inter-Regular',Helvetica] font-normal text-[#0f4f48] text-xs opacity-80">
                            Accuracy
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Third floating card */}
                    <Card className="absolute -bottom-6 -left-6 bg-white/90 backdrop-blur-sm border border-white/50 shadow-lg transform rotate-12 w-36">
                      <CardContent className="p-3">
                        <div className="text-center">
                          <div className="[font-family:'Inter-Medium',Helvetica] font-medium text-[#0f4f48] text-sm">
                            Time Saved
                          </div>
                          <div className="[font-family:'Inter-Medium',Helvetica] font-medium text-[#0f4f48] text-lg">
                            847 hrs
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
