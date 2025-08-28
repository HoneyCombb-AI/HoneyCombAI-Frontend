import React from "react";
import { motion } from "framer-motion";
import { Hexagon } from "lucide-react";

export function FooterSection() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative w-full bg-gradient-to-br from-slate-900 via-slate-800 to-amber-900 border-t border-[#0f4f48]">
      <div className="relative z-10 px-8 py-12 lg:px-16">
        <div className="grid grid-cols-4 gap-8">
          {/* Brand section */}
          <div className="col-span-2 space-y-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center space-x-2"
            >
              <div className="relative">
                <Hexagon className="w-8 h-8 text-amber-400" />
                <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-xl" />
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">
                Honeycomb AI
              </h3>
            </motion.div>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-slate-300 text-lg max-w-md leading-relaxed"
            >
              Transforming business intelligence with AI-powered insights and seamless data visualization.
            </motion.p>
          </div>

          {/* Links section */}
          <div className="col-span-1 space-y-4">
            <motion.h4 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-amber-300 font-semibold text-lg"
            >
              Product
            </motion.h4>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="space-y-2"
            >
              <a href="#features" className="block text-slate-400 hover:text-amber-300 transition-colors">
                Features
              </a>
              <a href="#testimonials" className="block text-slate-400 hover:text-amber-300 transition-colors">
                Testimonials
              </a>
              <a href="#call-to-action" className="block text-slate-400 hover:text-amber-300 transition-colors">
                Get Started
              </a>
            </motion.div>
          </div>

          {/* Contact section */}
          <div className="col-span-1 space-y-4">
            <motion.h4 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-amber-300 font-semibold text-lg"
            >
              Company
            </motion.h4>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="space-y-2"
            >
              <a href="#about" className="block text-slate-400 hover:text-amber-300 transition-colors">
                About Us
              </a>
              <a href="#contact" className="block text-slate-400 hover:text-amber-300 transition-colors">
                Contact
              </a>
              <a href="#privacy" className="block text-slate-400 hover:text-amber-300 transition-colors">
                Privacy Policy
              </a>
            </motion.div>
          </div>
        </div>

        {/* Honeycomb pattern decoration */}
        <div className="absolute right-8 top-8 opacity-10">
          <div className="grid grid-cols-3 gap-1">
            {[...Array(6)].map((_, i) => (
              <Hexagon key={i} className="w-4 h-4 text-amber-400" />
            ))}
          </div>
        </div>

        {/* Copyright section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12 pt-8 border-t border-slate-700"
        >
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-slate-400 text-sm">
              © {currentYear} Honeycomb AI. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <a href="#terms" className="text-slate-400 hover:text-amber-300 transition-colors text-sm">
                Terms of Service
              </a>
              <a href="#privacy" className="text-slate-400 hover:text-amber-300 transition-colors text-sm">
                Privacy Policy
              </a>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent" />
    </footer>
  );
}