import { ArrowRight, TrendingDown, TrendingUp, Users, DollarSign, Briefcase, Building, MessageCircle } from "lucide-react";
import React from "react";

export function HeroSectionMobile() {
  return (
    <section className="relative w-full mb-12 md:hidden">
      {/* Mobile hero container - stacked vertically */}
      <div className="relative w-full border-t border-[#0f4f48]">

        {/* Main gradient section with headline and floating cards */}
        <div className="relative bg-gradient-to-br from-yellow-300 via-orange-400 to-red-500 border-b border-[#0f4f48] min-h-[65vh] p-4">
          
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

          {/* Floating signal badges - split left and right */}
          <div className="absolute inset-0 pointer-events-none z-10">
            
            {/* LEFT SIDE BADGES */}
            
            {/* ICP Match badge */}
            <div className="absolute top-[40%] left-2">
              <div className="flex items-center gap-0.5 px-2 py-1 bg-[#0f4f48]/20 rounded text-[10px] text-black w-fit pointer-events-auto shadow-sm">
                ICP MATCH
                <TrendingUp className="w-2 h-2" />
              </div>
            </div>

            {/* Recently Funded badge */}
            <div className="absolute top-[48%] left-2">
              <div className="flex items-center gap-0.5 px-2 py-1 bg-green-100 rounded text-[10px] text-black w-fit pointer-events-auto shadow-sm">
                Recently Funded
                <DollarSign className="w-2 h-2" />
              </div>
            </div>

            {/* Open Roles badge */}
            <div className="absolute top-[56%] left-2">
              <div className="flex items-center gap-0.5 px-2 py-1 bg-blue-100 rounded text-[10px] text-black w-fit pointer-events-auto shadow-sm">
                3 Open Roles
                <Users className="w-2 h-2" />
              </div>
            </div>

            {/* Likes Books badge */}
            <div className="absolute top-[64%] left-2">
              <div className="bg-[#ffb84e]/20 px-2 py-1 rounded text-[10px] text-black flex items-center gap-0.5 w-fit pointer-events-auto shadow-sm">
                Likes Books
              </div>
            </div>

            {/* RIGHT SIDE BADGES */}

            {/* CTO New Hire badge */}
            <div className="absolute top-[40%] right-2">
              <div className="bg-purple-100 px-2 py-1 rounded text-[10px] text-black flex items-center gap-0.5 w-fit pointer-events-auto shadow-sm">
                CTO New Hire
                <Briefcase className="w-2 h-2" />
              </div>
            </div>

            {/* Expansion badge */}
            <div className="absolute top-[48%] right-2">
              <div className="bg-orange-100 px-2 py-1 rounded text-[10px] text-black flex items-center gap-0.5 w-fit pointer-events-auto shadow-sm">
                Expansion
                <Building className="w-2 h-2" />
              </div>
            </div>

            {/* CTO under 35 badge */}
            <div className="absolute top-[56%] right-2">
              <div className="bg-[#ff3c11]/20 px-2 py-1 rounded flex items-center gap-0.5 w-fit pointer-events-auto shadow-sm">
                <span className="text-[10px] text-black">CTO under 35</span>
                <TrendingDown className="w-2 h-2" />
              </div>
            </div>

            {/* Pain Point badge */}
            <div className="absolute top-[64%] right-2">
              <div className="bg-yellow-100 px-2 py-1 rounded flex items-center gap-0.5 w-fit pointer-events-auto shadow-sm">
                <span className="text-[10px] text-black">Pain Point</span>
                <MessageCircle className="w-2 h-2" />
              </div>
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