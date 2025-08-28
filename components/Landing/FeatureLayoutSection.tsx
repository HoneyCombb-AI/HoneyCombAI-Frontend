"use client";

import React, { JSX, useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";

type WordData = {
  text: string;
  animated: boolean;
  isSpecial?: boolean;
};

// First paragraph: Only "UNTIL NOW." will animate; earlier lines stay dark.
const firstParagraphData: { line: number; words: WordData[] }[] = [
  {
    line: 1,
    words: [
      { text: "Sales", animated: false },
      { text: "teams", animated: false },
      { text: "have", animated: false },
      { text: "been", animated: false },
      { text: "burdened", animated: false },
      { text: "with", animated: false },
      { text: "manual,", animated: false },
      { text: "slow,", animated: false },
      { text: "and", animated: false },
      { text: "generic", animated: false },
      { text: "outreach", animated: false },
      { text: "that", animated: false },
      { text: "misses", animated: false },
      { text: "the", animated: false },
      { text: "mark", animated: false },
    ],
  },
  {
    line: 2,
    words: [
      { text: "and", animated: false },
      { text: "fails", animated: false },
      { text: "to", animated: false },
      { text: "align", animated: false },
      { text: "with", animated: false },
      { text: "real-time", animated: false },
      { text: "custom", animated: false },
      { text: "buying", animated: false },
      { text: "signals.", animated: false },
    ],
  },
  {
    line: 3,
    words: [
      { text: "UNTIL", animated: true, isSpecial: true },
      { text: "NOW.", animated: true, isSpecial: true },
    ],
  },
];

// After "UNTIL NOW.", every word should animate from light to dark.
const animatedTextData: { line: number; words: WordData[] }[] = [
  {
    line: 1,
    words: [
      { text: "HoneyComb", animated: true },
      { text: "AI", animated: true },
      { text: "is", animated: true },
      { text: "the", animated: true },
      { text: "platform", animated: true },
      { text: "that", animated: true },
      { text: "helps", animated: true },
    ],
  },
  {
    line: 2,
    words: [
      { text: "sales", animated: true },
      { text: "teams", animated: true },
      { text: "start", animated: true },
      { text: "selling", animated: true },
      { text: "to", animated: true },
      { text: "customers", animated: true },
      { text: "who", animated: true },
    ],
  },
  {
    line: 3,
    words: [
      { text: "already", animated: true },
      { text: "want", animated: true },
      { text: "to", animated: true },
      { text: "buy,", animated: true },
      { text: "with", animated: true },
      { text: "all", animated: true },
      { text: "the", animated: true },
    ],
  },
  {
    line: 4,
    words: [
      { text: "context", animated: true },
      { text: "they", animated: true },
      { text: "need.", animated: true },
      { text: "It", animated: true },
      { text: "provides", animated: true },
      { text: "custom,", animated: true },
    ],
  },
  {
    line: 5,
    words: [
      { text: "real-time,", animated: true },
      { text: "actionable", animated: true },
      { text: "intent", animated: true },
      { text: "signals", animated: true },
      { text: "and", animated: true },
      { text: "rich", animated: true },
    ],
  },
  {
    line: 6,
    words: [
      { text: "social", animated: true },
      { text: "intelligence", animated: true },
      { text: "to", animated: true },
      { text: "give", animated: true },
      { text: "sales", animated: true },
      { text: "teams", animated: true },
    ],
  },
  {
    line: 7,
    words: [
      { text: "confidence", animated: true },
      { text: "and", animated: true },
      { text: "relevance", animated: true },
      { text: "for", animated: true },
      { text: "every", animated: true },
      { text: "outreach", animated: true },
    ],
  },
  {
    line: 8,
    words: [
      { text: "at", animated: true },
      { text: "the", animated: true },
      { text: "perfect", animated: true },
      { text: "time.", animated: true },
    ],
  },
];

// Feature layout section
export function FeatureLayoutSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // Combine lines and collect indices of animated words
  const allLines = [...firstParagraphData, ...animatedTextData];
  const animatedIndices: { lineIndex: number; wordIndex: number }[] = [];
  allLines.forEach((line, i) => {
    line.words.forEach((word, j) => {
      if (word.animated) animatedIndices.push({ lineIndex: i, wordIndex: j });
    });
  });

  // Allocate scroll ranges for each animated word
  const startReading = 0.2;
  const endReading = 0.8;
  const segment =
    animatedIndices.length > 0
      ? (endReading - startReading) / animatedIndices.length
      : 0;
  const colorRanges = animatedIndices.map((_, idx) => {
    const s = startReading + idx * segment;
    return [s, s + segment] as [number, number];
  });

  // Motion values for color: light to dark
  const wordColors = colorRanges.map(([start, end]) =>
    useTransform(
      scrollYProgress,
      [start, end],
      ["rgba(15,79,72,0.3)", "#0f4f48"]
    )
  );

  // Fade-in/out of the whole container
  const containerOpacity = useTransform(
    scrollYProgress,
    [startReading - 0.05, startReading, endReading, endReading + 0.05],
    [0, 1, 1, 0]
  );

  return (
    <section
      ref={sectionRef}
      className="relative w-full h-[250vh] overflow-hidden"
    >
      {/* Fixed container for animated text */}
      <motion.div
        className="fixed left-1/2 top-[15%] z-10 w-full max-w-4xl px-8"
        style={{
          opacity: containerOpacity,
          transform: "translateX(-50%)",
        }}
      >
        <div className="flex flex-col space-y-2">
          {allLines.map((line, lineIndex) => (
            <div
              key={lineIndex}
              className="flex flex-wrap items-baseline gap-x-2"
            >
              {line.words.map((word, wordIndex) => {
                const animIdx = animatedIndices.findIndex(
                  (ai) =>
                    ai.lineIndex === lineIndex && ai.wordIndex === wordIndex
                );
                
                // Handle special color for "UNTIL NOW" words
                let color;
                if (word.isSpecial) {
                  color = "#ff6b35"; // Vibrant orange that complements the teal theme
                } else if (animIdx >= 0) {
                  color = wordColors[animIdx];
                } else {
                  color = "#0f4f48";
                }

                return (
                  <motion.span
                    key={`${lineIndex}-${wordIndex}`}
                    style={{
                      color,
                      fontFamily: "'Inter-Medium', Helvetica",
                      fontWeight: 500,
                      fontSize: "30.1px",
                      lineHeight: "40px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {word.text}
                  </motion.span>
                );
              })}
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

// Testimonial section (unchanged)
export function TestimonialSection(): JSX.Element {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const curtainScale = useTransform(
    scrollYProgress,
    [0, 0.2, 0.8, 1],
    [0, 1, 1, 0]
  );

  const cardRanges: [number, number][] = [
    [0.2, 0.35],
    [0.35, 0.5],
    [0.5, 0.65],
    [0.65, 0.8],
  ];

  const cards = [
    {
      quote: "Comulate changed our lives",
      author: "Chelle George",
      position: "Senior Accountant",
    },
    {
      quote:
        "Comulate continually pushes the boundaries of what we imagined possible",
      author: "Philip Mortimer",
      position: "Chief Financial Officer",
    },
    {
      quote: "Best thing since sliced bread",
      author: "Lexi Luce",
      position: "Billing Specialist",
    },
    {
      quote: "Our accounting team raves about it with unique passion",
      author: "Jeff Nickles",
      position: "Chief Innovation Officer",
    },
  ];

  const cardMotion = cardRanges.map(([start, end]) => ({
    opacity: useTransform(scrollYProgress, [start, end], [0, 1]),
    rotateY: useTransform(scrollYProgress, [start, end], [-90, 0]),
  }));

  const containerOpacity = useTransform(
    scrollYProgress,
    [0.2, 0.25, 0.75, 0.8],
    [0, 1, 1, 0]
  );

  return (
    <section
      ref={sectionRef}
      className="relative w-full h-[300vh] overflow-hidden"
    >
      <div className="fixed inset-0 z-0">
        <motion.div
          className="absolute top-0 left-0 w-1/2 h-full bg-yellow-400"
          style={{ scaleX: curtainScale, transformOrigin: "right center" }}
        />
        <motion.div
          className="absolute top-0 right-0 w-1/2 h-full bg-yellow-400"
          style={{ scaleX: curtainScale, transformOrigin: "left center" }}
        />
      </div>

      <motion.div
        className="fixed left-1/2 top-1/2 z-10"
        style={{
          opacity: containerOpacity,
          transform: "translate(-50%, -50%)",
        }}
      >
        <div className="relative w-[600px] h-[400px]">
          {cards.map((card, index) => (
            <motion.div
              key={index}
              className="absolute inset-0 flex justify-center items-center"
              style={{
                opacity: cardMotion[index].opacity,
                rotateY: cardMotion[index].rotateY,
                perspective: "1000px",
                transformStyle: "preserve-3d",
              }}
            >
              <Card className="w-full h-full bg-white border border-gray-300 shadow-md">
                <CardContent className="flex flex-col justify-center items-center p-8 h-full">
                  <p className="font-medium text-xl text-[#0f4f48] text-center mb-4">
                    “{card.quote}”
                  </p>
                  <span className="font-medium text-[#0f4f48]">
                    {card.author}
                  </span>
                  <span className="text-sm text-[#0f4f48]">
                    {card.position}
                  </span>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
