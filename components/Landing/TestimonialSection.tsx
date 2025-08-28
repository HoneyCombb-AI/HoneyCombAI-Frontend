"use client";

import React, { JSX, useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";

export function TestimonialSection(): JSX.Element {
  const sectionRef = useRef<HTMLDivElement>(null);

  // Scroll progress for this section
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // Curtains open later (0.1) with more delay, close smoothly over longer duration
  const curtainScale = useTransform(
    scrollYProgress,
    [0, 0.1, 0.75, 0.9],
    [0, 1, 1, 0]
  );

  // Card flip ranges: start after curtains open, end before they close
  const ranges: [number, number][] = [
    [0.15, 0.27],
    [0.27, 0.39],
    [0.39, 0.51],
    [0.51, 0.63],
    [0.63, 0.75],
  ];

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

  // 3D tilt configurations for each card
  const cardTilts = [
    { x: 0, z: 0, depth: 0 },           // Card 1: straight
    { x: -5, z: 3, depth: 10 },         // Card 2: slight tilt
    { x: 8, z: -4, depth: 15 },         // Card 3: more tilt
    { x: -10, z: 6, depth: 20 },        // Card 4: maximum tilt
    { x: 12, z: -8, depth: 25 },        // Card 5: even more tilt
  ];

  // Motion values for each card
  const cardMotion = ranges.map(([start, end]) => ({
    opacity: useTransform(scrollYProgress, [start, end], [0, 1]),
    rotateY: useTransform(scrollYProgress, [start, end], [-90, 0]),
  }));

  // Container fades in after curtains open, fades out before curtains start closing
  const containerOpacity = useTransform(
    scrollYProgress,
    [0.15, 0.2, 0.75, 0.8],
    [0, 1, 1, 0]
  );

  return (
    <section
      ref={sectionRef}
      className="relative w-full h-[300vh] overflow-hidden"
    >
      {/* Curtains */}
      <div className="fixed inset-0 z-0">
        <motion.div
          className="absolute top-0 left-0 w-1/2 h-full bg-[#FFC300]"
          style={{ scaleX: curtainScale, transformOrigin: "right center" }}
        />
        <motion.div
          className="absolute top-0 right-0 w-1/2 h-full bg-[#FFC300]"
          style={{ scaleX: curtainScale, transformOrigin: "left center" }}
        />
      </div>

      {/* Fixed card container that appears only during the flip sequence */}
      <motion.div
        className="fixed left-1/2 top-1/2 z-10"
        style={{
          opacity: containerOpacity,
          transform: "translate(-50%, -50%)",
        }}
      >
        <div className="relative w-[700px] h-[320px]" style={{ perspective: "1500px" }}>
          {cards.map((card, index) => (
            <motion.div
              key={index}
              className="absolute inset-0 flex justify-center items-center"
              style={{
                opacity: cardMotion[index].opacity,
                rotateY: cardMotion[index].rotateY,
                rotateX: cardTilts[index].x,
                rotateZ: cardTilts[index].z,
                translateZ: cardTilts[index].depth,
                transformStyle: "preserve-3d",
              }}
            >
              <Card className="w-full h-full bg-white border-2 border-amber-900/60 shadow-2xl" style={{ filter: `drop-shadow(0 ${4 + cardTilts[index].depth / 2}px ${8 + cardTilts[index].depth}px rgba(255,195,0,0.3)) drop-shadow(0 ${2 + cardTilts[index].depth / 4}px ${4 + cardTilts[index].depth / 2}px rgba(0,0,0,0.1))` }}>
                <CardContent className="flex flex-col justify-between items-start p-6 h-full">
                  <h3 className="font-semibold text-2xl text-[#0f4f48] mb-3 leading-tight">
                    {card.heading}
                  </h3>
                  <p className="font-medium text-xl text-[#0f4f48] leading-relaxed flex-1 flex items-center">
                    {card.quote}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}