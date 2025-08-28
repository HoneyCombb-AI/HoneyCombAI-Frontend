"use client";

import React, { JSX, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

export function TestimonialSectionMobile(): JSX.Element {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const cards = [
    {
      heading: "Custom Intent Signals",
      quote: "HoneyComb AI provides real-time, custom intent signals that are unique to your specific sales process and ideal customer profile (ICP). This allows you to know who is in the market to buy, what they care about, and how to approach them for maximum impact.",
    },
    {
      heading: "Deep Social and Web Research",
      quote: "HoneyComb AI utilizes agents to scan digital presences across platforms to uncover hidden buying signals and behavioral patterns. This social intelligence helps you understand your prospects' recent activities, interests, and personal triggers.",
    },
    {
      heading: "Automated Lead Scoring", 
      quote: "HoneyComb AI automates the process of assessing ICP fit, generating intent scores, and identifying \"explainable triggers\" for each contact. This eliminates guesswork and helps you focus on timely, tailored conversations.",
    },
    {
      heading: "Relationship Manager Agent",
      quote: "The AI-powered Relationship Manager Agent continuously nurtures leads over time. It re-engages prospects precisely when new signals emerge, so you never miss a window of opportunity.",
    },
    {
      heading: "Hyperpersonalized Outreach",
      quote: "By providing a deep understanding of who a buyer is, their role in the decision-making process, and what matters most to them, the platform enables confident, relevant, and personalized outreach. You'll know who to contact, what will resonate, and when to reach out—automatically.",
    },
  ];

  const nextCard = () => {
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  const prevCard = () => {
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  // Auto-advance cards every 5 seconds
  useEffect(() => {
    const interval = setInterval(nextCard, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative w-full py-12 md:hidden bg-white overflow-hidden">
      {/* Subtle animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50/30 to-white animate-pulse"></div>
      
      <div className="relative z-10 px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-[#0f4f48] mb-4">
            Why Choose HoneyComb AI?
          </h2>
        </div>

        <div className="relative overflow-hidden">
          <motion.div
            className="flex"
            animate={{ x: `-${currentIndex * 100}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            drag="x"
            dragConstraints={{
              left: -((cards.length - 1) * window.innerWidth || 400),
              right: 0,
            }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              const threshold = 50;
              if (info.offset.x > threshold && currentIndex > 0) {
                prevCard();
              } else if (info.offset.x < -threshold && currentIndex < cards.length - 1) {
                nextCard();
              }
            }}
          >
            {cards.map((card, index) => (
              <div key={index} className="w-full flex-shrink-0 px-2">
                <Card className="w-full bg-white border border-gray-200 shadow-lg min-h-[300px] cursor-grab active:cursor-grabbing select-none">
                  <CardContent className="p-6 flex flex-col justify-between h-full">
                    <h3 className="font-semibold text-xl text-[#0f4f48] mb-4 leading-tight">
                      {card.heading}
                    </h3>
                    <p className="font-medium text-base text-[#0f4f48] leading-relaxed flex-1">
                      {card.quote}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </motion.div>

          {/* Dots indicator */}
          <div className="flex justify-center space-x-2 mt-6">
            {cards.map((_, index) => (
              <motion.div
                key={index}
                className={`w-3 h-3 rounded-full cursor-pointer ${
                  index === currentIndex
                    ? 'bg-[#0f4f48]'
                    : 'bg-gray-300'
                }`}
                animate={{
                  scale: index === currentIndex ? 1.2 : 1,
                  opacity: index === currentIndex ? 1 : 0.6
                }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>

          {/* Progress indicator */}
          <div className="mt-4 text-center">
            <span className="text-sm text-gray-600 font-medium">
              {currentIndex + 1} of {cards.length}
            </span>
          </div>
        </div>
      </div>
    
    </section>
  );
}