"use client";

import React from "react";
import { motion } from "framer-motion";

export function FeatureLayoutSectionMobile() {
  return (
    <section className="relative w-full min-h-screen bg-white px-4 py-8 md:hidden">
      <div className="max-w-sm mx-auto space-y-8">
        
        {/* First paragraph - problem statement */}
        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <p className="text-lg leading-relaxed text-[#0f4f48] font-medium">
            Sales teams have been burdened with manual, slow, and generic outreach that misses the mark and fails to align with real-time custom buying signals.
          </p>
          <p className="text-xl font-semibold text-[#ff6b35] leading-relaxed">
            UNTIL NOW.
          </p>
        </motion.div>

        {/* Second paragraph - solution */}
        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <p className="text-lg leading-relaxed text-[#0f4f48] font-medium">
            <span className="font-semibold">HoneyComb AI</span> is the platform that helps sales teams start selling to customers who already want to buy, with all the context they need.
          </p>
          
          <p className="text-lg leading-relaxed text-[#0f4f48] font-medium">
            It provides custom, real-time, actionable intent signals and rich social intelligence to give sales teams confidence and relevance for every outreach at the perfect time.
          </p>
        </motion.div>

        {/* Key benefits */}
        <motion.div 
          className="space-y-3 pt-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
          viewport={{ once: true, margin: "-100px" }}
        >
          {[
            "Custom intent signals",
            "Real-time buyer intelligence", 
            "Actionable social data",
            "Perfect timing insights"
          ].map((benefit, index) => (
            <motion.div 
              key={benefit}
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="w-2 h-2 bg-[#ff6b35] rounded-full"></div>
              <span className="text-base text-[#0f4f48] font-medium">{benefit}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}