"use client";

import React, { JSX, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
    const interval = setInterval(nextCard, 5000);
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

        <div className="relative">
          <Card className="w-full bg-white border border-gray-200 shadow-lg min-h-[300px] transition-all duration-500 ease-out transform hover:shadow-xl hover:scale-[1.02]">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <h3 className="font-semibold text-xl text-[#0f4f48] mb-4 leading-tight transition-all duration-300">
                {cards[currentIndex].heading}
              </h3>
              <p className="font-medium text-base text-[#0f4f48] leading-relaxed flex-1 transition-all duration-300">
                {cards[currentIndex].quote}
              </p>
            </CardContent>
          </Card>

          {/* Navigation buttons */}
          <div className="flex justify-between items-center mt-6">
            <button
              onClick={prevCard}
              className="p-3 rounded-full bg-gray-100 border border-gray-300 shadow-sm hover:bg-gray-200 transition-colors"
              aria-label="Previous card"
            >
              <ChevronLeft className="w-5 h-5 text-[#0f4f48]" />
            </button>

            {/* Dots indicator */}
            <div className="flex space-x-2">
              {cards.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentIndex
                      ? 'bg-[#0f4f48]'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to card ${index + 1}`}
                />
              ))}
            </div>

            <button
              onClick={nextCard}
              className="p-3 rounded-full bg-gray-100 border border-gray-300 shadow-sm hover:bg-gray-200 transition-colors"
              aria-label="Next card"
            >
              <ChevronRight className="w-5 h-5 text-[#0f4f48]" />
            </button>
          </div>

          {/* Progress indicator */}
          <div className="mt-4 text-center">
            <span className="text-sm text-gray-600 font-medium">
              {currentIndex + 1} of {cards.length}
            </span>
          </div>
        </div>
      </div>
      
      {/* Smooth transition to next section */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-transparent via-white to-gray-100/50 pointer-events-none"></div>
      
      {/* Floating transition elements */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <div className="flex space-x-2">
          <div className="w-2 h-2 bg-[#0f4f48]/20 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
          <div className="w-2 h-2 bg-[#0f4f48]/30 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
          <div className="w-2 h-2 bg-[#0f4f48]/40 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
        </div>
      </div>
    </section>
  );
}