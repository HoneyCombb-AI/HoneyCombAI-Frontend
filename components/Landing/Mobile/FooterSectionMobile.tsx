import React from "react";
import { motion } from "framer-motion";
import { Hexagon } from "lucide-react";

export function FooterSectionMobile() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative w-full bg-gradient-to-br from-slate-900 via-slate-800 to-amber-900 border-t border-[#0f4f48]">
      <div className="relative z-10 px-4 py-8">
        {/* Brand section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-4 mb-8"
        >
          <div className="flex items-center justify-center space-x-2">
            <div className="relative">
              <Hexagon className="w-6 h-6 text-amber-400" />
              <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-xl" />
            </div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">
              Honeycomb AI
            </h3>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed max-w-xs mx-auto">
            Transforming business intelligence with AI-powered insights and seamless data visualization.
          </p>
        </motion.div>

        {/* Links sections */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Product links */}
          <div className="space-y-3">
            <motion.h4 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-amber-300 font-semibold text-sm"
            >
              Product
            </motion.h4>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-2"
            >
              <a href="#features" className="block text-slate-400 hover:text-amber-300 transition-colors text-sm">
                Features
              </a>
              <a href="#testimonials" className="block text-slate-400 hover:text-amber-300 transition-colors text-sm">
                Testimonials
              </a>
              <a href="#call-to-action" className="block text-slate-400 hover:text-amber-300 transition-colors text-sm">
                Get Started
              </a>
            </motion.div>
          </div>

          {/* Company links */}
          <div className="space-y-3">
            <motion.h4 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-amber-300 font-semibold text-sm"
            >
              Company
            </motion.h4>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="space-y-2"
            >
              <a href="#about" className="block text-slate-400 hover:text-amber-300 transition-colors text-sm">
                About Us
              </a>
              <a href="#contact" className="block text-slate-400 hover:text-amber-300 transition-colors text-sm">
                Contact
              </a>
              <a href="#privacy" className="block text-slate-400 hover:text-amber-300 transition-colors text-sm">
                Privacy Policy
              </a>
            </motion.div>
          </div>
        </div>

        {/* Honeycomb pattern decoration */}
        <div className="absolute right-4 top-4 opacity-10">
          <div className="grid grid-cols-2 gap-1">
            {[...Array(4)].map((_, i) => (
              <Hexagon key={i} className="w-3 h-3 text-amber-400" />
            ))}
          </div>
        </div>

        {/* Copyright section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="pt-6 border-t border-slate-700 text-center space-y-3"
        >
          <p className="text-slate-400 text-xs">
            © {currentYear} Honeycomb AI. All rights reserved.
          </p>
          <div className="flex flex-col space-y-2">
            <a href="#terms" className="text-slate-400 hover:text-amber-300 transition-colors text-xs">
              Terms of Service
            </a>
            <a href="#privacy" className="text-slate-400 hover:text-amber-300 transition-colors text-xs">
              Privacy Policy
            </a>
          </div>
        </motion.div>
      </div>

      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent" />
    </footer>
  );
}