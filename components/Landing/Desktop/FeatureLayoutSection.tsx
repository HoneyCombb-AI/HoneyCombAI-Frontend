"use client";

import React from "react";
import { motion } from "motion/react";

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
  // Combine lines
  const allLines = [...firstParagraphData, ...animatedTextData];

  return (
    <section className="relative w-full py-20 overflow-hidden">
      {/* Simple container for text */}
      <motion.div
        className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="flex flex-col space-y-1 md:space-y-2">
          {allLines.map((line, lineIndex) => (
            <div
              key={lineIndex}
              className="flex flex-wrap items-baseline gap-x-1 sm:gap-x-2"
            >
              {line.words.map((word, wordIndex) => {
                const wordKey = `${lineIndex}-${wordIndex}`;
                
                // Simple color handling
                let color;
                if (word.isSpecial) {
                  color = "#ff6b35"; // Vibrant orange
                } else {
                  color = "#0f4f48";
                }

                return (
                  <span
                    key={wordKey}
                    className="text-lg sm:text-xl md:text-2xl lg:text-3xl leading-tight"
                    style={{
                      color,
                      fontFamily: "'Inter-Medium', Helvetica",
                      fontWeight: 500,
                    }}
                  >
                    {word.text}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}