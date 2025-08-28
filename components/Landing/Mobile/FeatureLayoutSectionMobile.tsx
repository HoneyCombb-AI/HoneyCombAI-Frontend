"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";

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

export function FeatureLayoutSectionMobile() {
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

  // Allocate scroll ranges for each animated word - much faster animation
  const startReading = 0.25;
  const endReading = 0.5;
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
    [startReading - 0.05, startReading, endReading, endReading + 0.2],
    [0, 1, 1, 0]
  );

  return (
    <section
      ref={sectionRef}
      className="relative w-full h-[75vh] overflow-hidden md:hidden"
    >
      {/* Sticky container for animated text */}
      <motion.div
        className="sticky top-[10%] left-1/2 z-10 w-full max-w-sm px-4 mx-auto"
        style={{
          opacity: containerOpacity,
        }}
      >
        <div className="flex flex-col space-y-1">
          {allLines.map((line, lineIndex) => (
            <div
              key={lineIndex}
              className="flex flex-wrap items-baseline gap-x-1"
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
                    className="text-lg leading-tight"
                    style={{
                      color,
                      fontFamily: "'Inter-Medium', Helvetica",
                      fontWeight: 500,
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