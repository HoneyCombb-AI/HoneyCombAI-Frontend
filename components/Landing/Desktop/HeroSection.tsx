import { Card, CardContent } from "@/components/ui/card";
import { TrendingDown, TrendingUp, Users, DollarSign, Briefcase, Building, MessageCircle } from "lucide-react";
import React from "react";
import { motion } from "framer-motion";

export function HeroSection() {
  return (
    <section className="relative w-full mb-40">
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
                <motion.h1 
                  className="font-medium text-[#0f4f48] text-4xl md:text-5xl lg:text-6xl leading-tight"
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
                  className="font-medium text-[#0f4f48] text-4xl md:text-5xl lg:text-6xl leading-tight"
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
                    {"get intents in 2025".split("").map((char, index) => (
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

            {/* Floating UI cards positioned within the gradient area */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Financial metrics card - aligned with first border */}
              <div className="absolute top-[26%] right-56">
                <motion.div 
                  className="relative"
                  initial={{ opacity: 0, x: 50, y: 20 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  transition={{ duration: 0.6, delay: 2.5, ease: "easeOut" }}
                >
                  {/* Horizontal connecting line to sidebar */}
                  <motion.div 
                    className="absolute -right-40 top-1/2 w-40 h-px bg-gradient-to-l from-transparent to-[#0f4f48]"
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    transition={{ duration: 0.4, delay: 2.8, ease: "easeOut" }}
                  ></motion.div>
                  {/* Vertical connecting line */}
                  <motion.div 
                    className="absolute left-1/2 top-full w-px h-40 bg-gradient-to-b from-[#0f4f48] to-transparent"
                    initial={{ scaleY: 0, opacity: 0 }}
                    animate={{ scaleY: 1, opacity: 1 }}
                    transition={{ duration: 0.4, delay: 2.9, ease: "easeOut" }}
                  ></motion.div>
                  <Card className="w-44 h-28 bg-white rounded-md border border-gray-200 shadow-lg">
                    <CardContent className="p-3 h-full flex flex-col justify-center">
                      <div className="space-y-1">
                        <motion.div 
                          className="flex items-center gap-1 px-2 py-1 bg-[#0f4f48]/20 rounded text-xs text-black"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: 3.0, ease: "easeOut" }}
                        >
                          ICP MATCH
                          <TrendingUp className="w-3 h-3" />
                        </motion.div>
                        <motion.div 
                          className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded text-xs text-black"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: 3.1, ease: "easeOut" }}
                        >
                          Recently Funded
                          <DollarSign className="w-3 h-3" />
                        </motion.div>
                        <motion.div 
                          className="flex items-center gap-1 px-2 py-1 bg-blue-100 rounded text-xs text-black"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: 3.2, ease: "easeOut" }}
                        >
                          3 Open Roles
                          <Users className="w-3 h-3" />
                        </motion.div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Policy card with connecting line - aligned with Bonhomia World bottom border */}
              <div className="absolute top-[65%] left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <motion.div 
                  className="relative"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 3.3, ease: "easeOut" }}
                >
                  {/* Connecting line to the right */}
                  <motion.div 
                    className="absolute -right-32 top-1/2 w-32 h-px bg-gradient-to-l from-transparent to-[#0f4f48]"
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    transition={{ duration: 0.4, delay: 3.6, ease: "easeOut" }}
                  ></motion.div>
                  {/* Vertical connecting line */}
                  <motion.div 
                    className="absolute left-1/2 top-full w-px h-40 bg-gradient-to-b from-[#0f4f48] to-transparent"
                    initial={{ scaleY: 0, opacity: 0 }}
                    animate={{ scaleY: 1, opacity: 1 }}
                    transition={{ duration: 0.4, delay: 3.7, ease: "easeOut" }}
                  ></motion.div>
                  <Card className="w-44 h-28 bg-white rounded-md border border-gray-200 shadow-lg">
                    <CardContent className="p-3 h-full flex flex-col justify-center">
                      <motion.div 
                        className="text-xs text-gray-600 mb-1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: 3.8, ease: "easeOut" }}
                      >
                        Custom Signals
                      </motion.div>
                      <div className="space-y-1">
                        <motion.div 
                          className="bg-[#ffb84e]/20 px-2 py-1 rounded text-xs text-black flex items-center gap-1"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: 3.9, ease: "easeOut" }}
                        >
                          Likes Books
                        </motion.div>
                        <motion.div 
                          className="bg-purple-100 px-2 py-1 rounded text-xs text-black flex items-center gap-1"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: 4.0, ease: "easeOut" }}
                        >
                          <Briefcase className="w-3 h-3" />
                          CTO New Hire
                        </motion.div>
                        <motion.div 
                          className="bg-orange-100 px-2 py-1 rounded text-xs text-black flex items-center gap-1"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: 4.1, ease: "easeOut" }}
                        >
                          <Building className="w-3 h-3" />
                          Expansion
                        </motion.div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Amount card - bottom left */}
              <div className="absolute bottom-16 left-32">
                <motion.div 
                  className="relative"
                  initial={{ opacity: 0, x: -50, y: 20 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  transition={{ duration: 0.6, delay: 4.2, ease: "easeOut" }}
                >
                  {/* Connecting line */}
                  <motion.div 
                    className="absolute -left-32 top-1/2 w-32 h-px bg-gradient-to-r from-transparent to-[#0f4f48]"
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    transition={{ duration: 0.4, delay: 4.5, ease: "easeOut" }}
                  ></motion.div>
                  {/* Vertical connecting line */}
                  <motion.div 
                    className="absolute left-1/2 top-full w-px h-32 bg-gradient-to-b from-[#0f4f48] to-transparent"
                    initial={{ scaleY: 0, opacity: 0 }}
                    animate={{ scaleY: 1, opacity: 1 }}
                    transition={{ duration: 0.4, delay: 4.6, ease: "easeOut" }}
                  ></motion.div>
                  <Card className="w-44 h-28 bg-white rounded-md border border-gray-200 shadow-lg">
                    <CardContent className="p-3 h-full flex flex-col justify-center">
                      <div className="space-y-1">
                        <motion.div 
                          className="bg-[#ff3c11]/20 px-2 py-1 rounded flex items-center gap-1"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: 4.7, ease: "easeOut" }}
                        >
                          <span className="text-xs text-black">CTO under 35</span>
                          <TrendingDown className="w-2 h-2" />
                        </motion.div>
                        <motion.div 
                          className="bg-yellow-100 px-2 py-1 rounded flex items-center gap-1"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: 4.8, ease: "easeOut" }}
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span className="text-xs text-black">Pain Point</span>
                        </motion.div>
                        <motion.div 
                          className="bg-gray-100 px-2 py-1 rounded flex items-center gap-1"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: 4.9, ease: "easeOut" }}
                        >
                          <span className="text-xs text-black">High Intent</span>
                        </motion.div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Right section - Grid with logos */}
          <motion.div 
            className="relative border-b border-[#0f4f48]"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 1.8, ease: "easeOut" }}
          >
            {/* Top section - placeholder for logo/content */}
            <motion.div 
              className="h-1/3 border-b border-[#0f4f48] flex items-center justify-center"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 2.0, ease: "easeOut" }}
            >
              <motion.div 
                className="text-[#0f4f48] font-medium text-xl"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: 2.2, ease: "easeOut" }}
              >
                JUST BOOKS INDIA
              </motion.div>
            </motion.div>

            {/* Middle section - placeholder for logo/content */}
            <motion.div 
              className="h-1/3 border-b border-[#0f4f48] flex items-center justify-center"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 2.3, ease: "easeOut" }}
            >
              <motion.div 
                className="text-[#0f4f48] font-medium text-xl"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: 2.5, ease: "easeOut" }}
              >
                BONHOMIA WORLD
              </motion.div>
            </motion.div>

            {/* Bottom section - placeholder for logo/content */}
            <motion.div 
              className="h-1/3 flex items-center justify-center"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 2.6, ease: "easeOut" }}
            >
              <motion.div 
                className="text-[#0f4f48] font-medium text-lg"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: 2.8, ease: "easeOut" }}
              >
                <motion.p 
                  className="text-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 2.9 }}
                > 
                  Backed By 
                </motion.p>
                CoCreate Ventures
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Company logos section at bottom */}
      </section>
  );
}
