import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, TrendingDown, TrendingUp, Users, DollarSign, Briefcase, Building, MessageCircle } from "lucide-react";
import React from "react";

export function HeroSectionMobile() {
  return (
    <section className="relative w-full mb-12 md:hidden">
      {/* Mobile hero container - stacked vertically */}
      <div className="relative w-full border-t border-[#0f4f48]">

        {/* Main gradient section with headline and floating cards */}
        <div className="relative bg-gradient-to-br from-yellow-300 via-orange-400 to-red-500 border-b border-[#0f4f48] min-h-[85vh] p-4">
          
          {/* Hero headline - positioned like desktop */}
          <div className="relative z-10 pt-8 pb-4">
            <div className="space-y-1">
              <h1 className="font-medium text-[#0f4f48] text-3xl sm:text-4xl leading-tight">
                How the top Businesses
              </h1>
              <h1 className="font-medium text-[#0f4f48] text-3xl sm:text-4xl leading-tight">
                get intents in 2025
              </h1>
            </div>
          </div>

          {/* Floating signal cards positioned to match desktop layout */}
          <div className="absolute inset-0 pointer-events-none z-10">
            
            {/* Top right card - ICP Match */}
            <div className="absolute top-[30%] right-4">
              <Card className="w-48 bg-white rounded-md border border-gray-200 shadow-lg pointer-events-auto">
                <CardContent className="p-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 px-2 py-1 bg-[#0f4f48]/20 rounded text-xs text-black">
                      ICP MATCH
                      <TrendingUp className="w-3 h-3" />
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded text-xs text-black">
                      Recently Funded
                      <DollarSign className="w-3 h-3" />
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 rounded text-xs text-black">
                      3 Open Roles
                      <Users className="w-3 h-3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Center card - Custom Signals */}
            <div className="absolute top-[55%] left-1/2 transform -translate-x-1/2">
              <Card className="bg-white rounded-md border border-gray-200 shadow-lg pointer-events-auto">
                <CardContent className="p-2">
                  <div className="text-xs text-gray-600 mb-1">
                    Custom Signals
                  </div>
                  <div className="space-y-1">
                    <div className="bg-[#ffb84e]/20 px-2 py-1 rounded text-xs text-black flex items-center gap-1">
                      Likes Books
                    </div>
                    <div className="bg-purple-100 px-2 py-1 rounded text-xs text-black flex items-center gap-1">
                      <Briefcase className="w-3 h-3" />
                      CTO New Hire
                    </div>
                    <div className="bg-orange-100 px-2 py-1 rounded text-xs text-black flex items-center gap-1">
                      <Building className="w-3 h-3" />
                      Expansion
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bottom left card - Pain Points */}
            <div className="absolute bottom-[15%] left-4">
              <Card className="bg-white rounded-md border border-gray-200 shadow-lg pointer-events-auto">
                <CardContent className="p-2">
                  <div className="space-y-1">
                    <div className="bg-[#ff3c11]/20 px-2 py-1 rounded flex items-center gap-1 w-fit">
                      <span className="text-xs text-black">CTO under 35</span>
                      <TrendingDown className="w-2 h-2" />
                    </div>
                    <div className="bg-yellow-100 px-2 py-1 rounded flex items-center gap-1 w-fit">
                      <MessageCircle className="w-3 h-3" />
                      <span className="text-xs text-black">Pain Point</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

          </div>
        </div>
        
        {/* Company logos section below gradient */}
        <div className="bg-white border-b border-[#0f4f48] grid grid-cols-3">
          <div className="h-20 border-r border-[#0f4f48] flex items-center justify-center">
            <div className="text-[#0f4f48] font-medium text-sm text-center">
              JUST BOOKS INDIA
            </div>
          </div>
          <div className="h-20 border-r border-[#0f4f48] flex items-center justify-center">
            <div className="text-[#0f4f48] font-medium text-sm text-center">
              BONHOMIA WORLD
            </div>
          </div>
          <div className="h-20 flex items-center justify-center">
            <div className="text-[#0f4f48] font-medium text-xs text-center">
              <p className="text-xs mb-1">Backed By</p>
              <p className="text-sm">CoCreate Ventures</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}