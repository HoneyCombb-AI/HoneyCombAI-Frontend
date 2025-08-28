"use client";

import React from "react";
import { motion } from "motion/react";

type WordData = {
  text: string;
  animated: boolean;
  isSpecial?: boolean;
};

// All words in order - let them wrap naturally
const allWordsData: WordData[] = [
  // First paragraph: Only "UNTIL NOW." will animate; earlier words stay dark
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
  { text: "and", animated: false },
  { text: "fails", animated: false },
  { text: "to", animated: false },
  { text: "align", animated: false },
  { text: "with", animated: false },
  { text: "real-time", animated: false },
  { text: "custom", animated: false },
  { text: "buying", animated: false },
  { text: "signals.", animated: false },
  { text: "UNTIL", animated: true, isSpecial: true },
  { text: "NOW.", animated: true, isSpecial: true },
  
  // After "UNTIL NOW.", every word should animate from light to dark
  { text: "HoneyComb", animated: true },
  { text: "AI", animated: true },
  { text: "is", animated: true },
  { text: "the", animated: true },
  { text: "platform", animated: true },
  { text: "that", animated: true },
  { text: "helps", animated: true },
  { text: "sales", animated: true },
  { text: "teams", animated: true },
  { text: "start", animated: true },
  { text: "selling", animated: true },
  { text: "to", animated: true },
  { text: "customers", animated: true },
  { text: "who", animated: true },
  { text: "already", animated: true },
  { text: "want", animated: true },
  { text: "to", animated: true },
  { text: "buy,", animated: true },
  { text: "with", animated: true },
  { text: "all", animated: true },
  { text: "the", animated: true },
  { text: "context", animated: true },
  { text: "they", animated: true },
  { text: "need.", animated: true },
  { text: "It", animated: true },
  { text: "provides", animated: true },
  { text: "custom,", animated: true },
  { text: "real-time,", animated: true },
  { text: "actionable", animated: true },
  { text: "intent", animated: true },
  { text: "signals", animated: true },
  { text: "and", animated: true },
  { text: "rich", animated: true },
  { text: "social", animated: true },
  { text: "intelligence", animated: true },
  { text: "to", animated: true },
  { text: "give", animated: true },
  { text: "sales", animated: true },
  { text: "teams", animated: true },
  { text: "confidence", animated: true },
  { text: "and", animated: true },
  { text: "relevance", animated: true },
  { text: "for", animated: true },
  { text: "every", animated: true },
  { text: "outreach", animated: true },
  { text: "at", animated: true },
  { text: "the", animated: true },
  { text: "perfect", animated: true },
  { text: "time.", animated: true },
];

export function FeatureLayoutSectionMobile() {

  return (
    <section className="relative w-full py-20 overflow-hidden md:hidden">
      {/* Simple container for text */}
      <motion.div
        className="max-w-sm mx-auto px-4"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="flex flex-wrap items-baseline gap-x-1 text-justify leading-relaxed space-y-2">
          {allWordsData.map((word, wordIndex) => {
            // Simple color handling
            let color;
            if (word.isSpecial) {
              color = "#ff6b35"; // Vibrant orange
            } else {
              color = "#0f4f48";
            }

            // Add line breaks around "UNTIL NOW"
            const shouldBreakBefore = word.text === "UNTIL";
            const shouldBreakAfter = word.text === "NOW.";

            return (
              <React.Fragment key={`word-${wordIndex}`}>
                {shouldBreakBefore && <div className="w-full" key={`break-before-${wordIndex}`}></div>}
                <span
                  className="text-lg leading-relaxed"
                  style={{
                    color,
                    fontFamily: "'Inter-Medium', Helvetica",
                    fontWeight: 500,
                  }}
                >
                  {word.text}
                </span>
                {shouldBreakAfter && <div className="w-full" key={`break-after-${wordIndex}`}></div>}
              </React.Fragment>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
}