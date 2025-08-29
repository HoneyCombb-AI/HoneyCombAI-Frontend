import {
  TrendingDown,
  TrendingUp,
  Users,
  DollarSign,
  Briefcase,
  Building,
  MessageCircle,
} from "lucide-react";
import React from "react";
import { motion } from "framer-motion";

export function HeroSectionMobile() {
  return (
    <section className="relative w-full mb-16 md:hidden z-0">
      {/* Mobile hero container - stacked vertically */}
      <div className="relative w-full border-t border-[#0f4f48]">
        {/* Main gradient section with headline and floating cards */}
        <div className="relative bg-gradient-to-br from-yellow-300 via-orange-400 to-red-500 border-b border-[#0f4f48] min-h-[65vh] p-4">
          {/* Hero headline - positioned like desktop */}
          <div className="relative z-10 pt-8 pb-4">
            <div className="space-y-1">
              <motion.h1
                className="font-medium text-[#0f4f48] text-3xl sm:text-4xl leading-tight"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.1 }}
              >
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    duration: 2,
                    ease: "easeInOut",
                  }}
                >
                  {"How the top Businesses".split("").map((char, index) => (
                    <motion.span
                      key={index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{
                        duration: 0.1,
                        delay: index * 0.05,
                        ease: "easeInOut",
                      }}
                    >
                      {char}
                    </motion.span>
                  ))}
                </motion.span>
              </motion.h1>
              <motion.h1
                className="font-medium text-[#0f4f48] text-3xl sm:text-4xl leading-tight"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.1, delay: 1.2 }}
              >
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    duration: 2,
                    delay: 1.2,
                    ease: "easeInOut",
                  }}
                >
                  {"do Sales in 2025".split("").map((char, index) => (
                    <motion.span
                      key={index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{
                        duration: 0.1,
                        delay: 1.2 + index * 0.05,
                        ease: "easeInOut",
                      }}
                    >
                      {char}
                    </motion.span>
                  ))}
                </motion.span>
              </motion.h1>
            </div>
          </div>

          {/* Floating signal badges - split left and right */}
          <div className="absolute inset-0 pointer-events-none z-10">
            {/* LEFT SIDE BADGES */}

            {/* ICP Match badge */}
            <div className="absolute top-[40%] left-2">
              <motion.div
                className="flex items-center gap-0.5 px-2 py-1 bg-[#0f4f48]/20 rounded text-[10px] text-black w-fit pointer-events-auto shadow-sm"
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
              >
                ICP MATCH
                <TrendingUp className="w-2 h-2" />
              </motion.div>
            </div>

            {/* Recently Funded badge */}
            <div className="absolute top-[48%] left-2">
              <motion.div
                className="flex items-center gap-0.5 px-2 py-1 bg-green-100 rounded text-[10px] text-black w-fit pointer-events-auto shadow-sm"
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
              >
                Recently Funded
                <DollarSign className="w-2 h-2" />
              </motion.div>
            </div>

            {/* Open Roles badge */}
            <div className="absolute top-[56%] left-2">
              <motion.div
                className="flex items-center gap-0.5 px-2 py-1 bg-blue-100 rounded text-[10px] text-black w-fit pointer-events-auto shadow-sm"
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }}
              >
                3 Open Roles
                <Users className="w-2 h-2" />
              </motion.div>
            </div>

            {/* Likes Books badge */}
            <div className="absolute top-[64%] left-2">
              <motion.div
                className="bg-[#ffb84e]/20 px-2 py-1 rounded text-[10px] text-black flex items-center gap-0.5 w-fit pointer-events-auto shadow-sm"
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8, ease: "easeOut" }}
              >
                Likes Books
              </motion.div>
            </div>

            {/* RIGHT SIDE BADGES */}

            {/* CTO New Hire badge */}
            <div className="absolute top-[40%] right-2">
              <motion.div
                className="bg-purple-100 px-2 py-1 rounded text-[10px] text-black flex items-center gap-0.5 w-fit pointer-events-auto shadow-sm"
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
              >
                CTO New Hire
                <Briefcase className="w-2 h-2" />
              </motion.div>
            </div>

            {/* Expansion badge */}
            <div className="absolute top-[48%] right-2">
              <motion.div
                className="bg-orange-100 px-2 py-1 rounded text-[10px] text-black flex items-center gap-0.5 w-fit pointer-events-auto shadow-sm"
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
              >
                Expansion
                <Building className="w-2 h-2" />
              </motion.div>
            </div>

            {/* CTO under 35 badge */}
            <div className="absolute top-[56%] right-2">
              <motion.div
                className="bg-[#ff3c11]/20 px-2 py-1 rounded flex items-center gap-0.5 w-fit pointer-events-auto shadow-sm"
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7, ease: "easeOut" }}
              >
                <span className="text-[10px] text-black">CTO under 35</span>
                <TrendingDown className="w-2 h-2" />
              </motion.div>
            </div>

            {/* Pain Point badge */}
            <div className="absolute top-[64%] right-2">
              <motion.div
                className="bg-yellow-100 px-2 py-1 rounded flex items-center gap-0.5 w-fit pointer-events-auto shadow-sm"
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.9, ease: "easeOut" }}
              >
                <span className="text-[10px] text-black">Pain Point</span>
                <MessageCircle className="w-2 h-2" />
              </motion.div>
            </div>
          </div>
        </div>

        {/* Company logos section below gradient */}
        <div className="bg-white border-b border-[#0f4f48] grid grid-cols-3">
          <div className="h-20 border-r border-[#0f4f48] flex items-center justify-center">
            <p className="text-[#0f4f48] font-medium text-sm text-center">
              JUST BOOKS INDIA
            </p>
          </div>
          <div className="h-20 border-r border-[#0f4f48] flex items-center justify-center">
            <p className="text-[#0f4f48] font-medium text-sm text-center">
              BONHOMIA WORLD
            </p>
          </div>
          <div className="h-20 flex items-center justify-center">
            <div className="text-[#0f4f48] font-medium text-xs text-center">
              <p className="text-[10px] mb-1">Backed By</p>
              <p className="text-sm">CoCreate Ventures</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
