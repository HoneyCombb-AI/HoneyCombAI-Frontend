"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle, Zap, TrendingUp, Users } from "lucide-react";
import React, { JSX } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface CallToActionSectionMobileProps {
  user?: any;
}

export function CallToActionSectionMobile({ user }: CallToActionSectionMobileProps): JSX.Element {
  const features = [
    "Get custom intents unique to your sales process",
    "Complete social understanding of your prospects",
    "Know who to contact, what will resonate, and when to reach out -Automatically",
  ];
  const router = useRouter();

  const handleLoginClick = () => {
    if (user) {
      router.push("/contacts");
    } else {
      router.push("/login");
    }
  };

  return (
    <section className="relative w-full px-4 py-16 md:hidden">
      <div className="max-w-sm mx-auto">

        {/* Header section with animation */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          viewport={{ once: true, margin: "-50px" }}
        >
          <Badge
            variant="outline"
            className="bg-[#ff6b35]/20 border-[#ff6b35]/40 text-[#0f4f48] px-4 py-2 mb-4 inline-flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            <span className="font-medium text-sm">Ready to transform?</span>
          </Badge>

          <h2 className="font-semibold text-[#0f4f48] text-2xl leading-tight mb-4">
            Transform your lead pipeline today
          </h2>
        </motion.div>

        {/* Features with staggered animation */}
        <motion.div
          className="space-y-4 mb-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true, margin: "-50px" }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-100 shadow-sm"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
              viewport={{ once: true }}
            >
              <CheckCircle className="w-5 h-5 text-[#4adf7d] flex-shrink-0 mt-0.5" />
              <span className="text-[#0f4f48] text-sm font-medium leading-relaxed">
                {feature}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* Floating stats cards */}
        <motion.div
          className="relative mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true, margin: "-50px" }}
        >
          <div className="flex justify-center gap-3">
            <Card className="bg-gradient-to-br from-[#4adf7d]/20 to-[#4adf7d]/10 border-[#4adf7d]/30 shadow-sm">
              <CardContent className="p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TrendingUp className="w-4 h-4 text-[#4adf7d]" />
                  <span className="font-bold text-lg text-[#0f4f48]">85%</span>
                </div>
                <span className="text-xs text-[#0f4f48] font-medium">Pipeline Growth</span>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-[#ff6b35]/20 to-[#ff6b35]/10 border-[#ff6b35]/30 shadow-sm">
              <CardContent className="p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Users className="w-4 h-4 text-[#ff6b35]" />
                  <span className="font-bold text-lg text-[#0f4f48]">3x</span>
                </div>
                <span className="text-xs text-[#0f4f48] font-medium">More Leads</span>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* CTA Buttons with animation */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          viewport={{ once: true, margin: "-50px" }}
        >
          <Button
            onClick={handleLoginClick}
            className="w-full bg-[#4adf7d] hover:bg-[#4adf7d]/90 text-[#0f4f48] shadow-lg h-12 rounded-lg font-semibold text-base"
          >
            {user ? "Access Dashboard" : "Get Started Free"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          <Button
            variant="outline"
            className="w-full border-2 border-[#0f4f48]/20 hover:border-[#0f4f48]/40 text-[#0f4f48] h-12 rounded-lg font-semibold text-base"
          >
            Book a Demo
          </Button>
        </motion.div>
      </div>
    </section>
  );
}