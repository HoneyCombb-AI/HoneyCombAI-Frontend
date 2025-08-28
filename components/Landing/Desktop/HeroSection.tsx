import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, TrendingDown, TrendingUp, Users, DollarSign, Briefcase, Building, MessageCircle } from "lucide-react";
import React from "react";
import { HeroSectionMobile } from "../Mobile/HeroSectionMobile";

const companyLogos = [
  { name: "ALKEME", className: "text-[#0f4f48] font-medium text-lg" },
  { name: "HORTON", className: "text-[#0f4f48] font-medium text-lg" },
  { name: "INSURICA", className: "text-[#0f4f48] font-medium text-lg" },
  { name: "Shepherd", className: "text-[#0f4f48] font-medium text-lg" },
];

export function HeroSection() {
  return (
    <>
      {/* Mobile version */}
      <HeroSectionMobile />
      
      {/* Desktop version */}
      <section className="relative w-full mb-40 hidden md:block">
      {/* Main hero container with grid structure */}
      <div className="relative w-full h-auto min-h-[60vh] md:h-[85vh] border-t border-[#0f4f48]">
        {/* Main content grid */}
        <div className="grid grid-cols-4 h-full">
          {/* Left section - Hero content with gradient background */}
          <div className="col-span-3 relative bg-gradient-to-br from-yellow-300 via-orange-400 to-red-500 border-r border-b border-[#0f4f48]">
            {/* Hero text section */}
            <div className="relative z-10 px-8 py-12 lg:px-16 lg:py-20">
              {/* Main headline */}
              <div className="space-y-2">
                <h1 className="font-medium text-[#0f4f48] text-4xl md:text-5xl lg:text-6xl leading-tight">
                  How the top Businesses
                </h1>
                <h1 className="font-medium text-[#0f4f48] text-4xl md:text-5xl lg:text-6xl leading-tight">
                  get intents in 2025
                </h1>
                <h1 className="font-medium text-[#0f4f48] text-4xl md:text-5xl lg:text-6xl leading-tight"></h1>
              </div>
            </div>

            {/* Floating UI cards positioned within the gradient area */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Financial metrics card - aligned with first border */}
              <div className="absolute top-[25%] right-56">
                <div className="relative">
                  {/* Horizontal connecting line to sidebar */}
                  <div className="absolute -right-24 top-1/2 w-24 h-px bg-gradient-to-l from-transparent to-[#0f4f48]"></div>
                  {/* Vertical connecting line */}
                  <div className="absolute left-1/2 top-full w-px h-32 bg-gradient-to-b from-[#0f4f48] to-transparent"></div>
                  <Card className="w-40 bg-white rounded-md border border-gray-200 shadow-lg">
                    <CardContent className="p-3">
                      <div className="space-y-2">
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
              </div>

              {/* Policy card with connecting line - aligned with Bonhomia World bottom border */}
              <div className="absolute top-[67%] left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="relative">
                  {/* Connecting line to the right */}
                  <div className="absolute -right-24 top-1/2 w-24 h-px bg-gradient-to-l from-transparent to-[#0f4f48]"></div>
                  {/* Vertical connecting line */}
                  <div className="absolute left-1/2 top-full w-px h-24 bg-gradient-to-b from-[#0f4f48] to-transparent"></div>
                  <Card className="bg-white rounded-md border border-gray-200 shadow-lg">
                    <CardContent className="p-2">
                      <div className="text-xs text-gray-600 mb-2">
                        Custom Signals
                      </div>
                      <div className="space-y-2">
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
              </div>

              {/* Amount card - bottom left */}
              <div className="absolute bottom-32 left-32">
                <div className="relative">
                  {/* Connecting line */}
                  <div className="absolute -left-24 top-1/2 w-24 h-px bg-gradient-to-r from-transparent to-[#0f4f48]"></div>
                  {/* Vertical connecting line */}
                  <div className="absolute left-1/2 top-full w-px h-24 bg-gradient-to-b from-[#0f4f48] to-transparent"></div>
                  <Card className="bg-white rounded-md border border-gray-200 shadow-lg">
                    <CardContent className="p-2">
                      <div className="space-y-2">
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
          </div>

          {/* Right section - Grid with logos */}
          <div className="relative border-b border-[#0f4f48]">
            {/* Top section - placeholder for logo/content */}
            <div className="h-1/3 border-b border-[#0f4f48] flex items-center justify-center">
              <div className="text-[#0f4f48] font-medium text-xl">
                JUST BOOKS INDIA
              </div>
            </div>

            {/* Middle section - placeholder for logo/content */}
            <div className="h-1/3 border-b border-[#0f4f48] flex items-center justify-center">
              <div className="text-[#0f4f48] font-medium text-xl">
                BONHOMIA WORLD
              </div>
            </div>

            {/* Bottom section - placeholder for logo/content */}
            <div className="h-1/3 flex items-center justify-center">
              <div className="text-[#0f4f48] font-medium text-lg">
                <p className="text-sm"> Backed By </p>
                CoCreate Ventures
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Company logos section at bottom */}
      </section>
    </>
  );
}
