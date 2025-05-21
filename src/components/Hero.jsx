import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRightIcon,
  BoltIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

function Hero() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-64 h-64 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>
      
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col items-center justify-center min-h-screen py-12 gap-10 sm:gap-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center space-y-4 sm:space-y-6"
          >
            <div className="inline-block mb-4">
              <span className="px-3 py-1 text-xs font-medium uppercase tracking-wider text-yellow-700 bg-yellow-100 rounded-full"></span>
            </div>
            
            <h1 className="text-4xl font-extralight tracking-tight sm:text-5xl md:text-6xl lg:text-7xl mb-2 sm:mb-4 leading-none">
              <span className="relative">
                <span className="block font-serif bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-900 text-transparent bg-clip-text font-semibold">
                  Déclarer votre objet
                </span>
                <motion.span 
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1, delay: 0.5, ease: "easeInOut" }}
                  className="absolute -bottom-1 left-0 h-[1px] bg-yellow-600 opacity-50"
                ></motion.span>
                <span className="block bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-900 text-transparent bg-clip-text mt-2 font-light">
                  en 2 minutes
                </span>
              </span>
            </h1>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="flex flex-col items-center gap-8 sm:gap-10 w-full"
          >
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-16 justify-center">
              <Link
                to="/report"
                className="group relative inline-flex items-center gap-2 overflow-hidden"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-500 rounded-xl opacity-90 group-hover:opacity-100 transition-opacity duration-300"></span>
                <span className="relative z-10 rounded-xl px-8 py-3.5 text-sm font-medium text-white transition-all duration-500 sm:text-base text-center flex items-center">
                  J'ai trouvé
                </span>
              </Link>
              <Link
                to="/report"
                className="group relative inline-flex items-center gap-2 overflow-hidden"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-yellow-600 to-yellow-500 rounded-xl opacity-90 group-hover:opacity-100 transition-opacity duration-300"></span>
                <span className="relative z-10 rounded-xl px-8 py-3.5 text-sm font-medium text-white transition-all duration-500 sm:text-base text-center flex items-center">
                  J'ai perdu
                </span>
              </Link>
            </div>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="text-center tracking-tight max-w-xs sm:max-w-2xl mx-auto text-lg sm:text-xl md:text-2xl font-light text-zinc-800 px-2 leading-relaxed"
            >
              <span className="block mt-1 text-zinc-600">Avec TLEFLI, nous transformons chaque perte en une retrouvaille réussie.</span>
            </motion.p>
          </motion.div>

          <div className="flex flex-wrap justify-center gap-3 sm:gap-6 px-2 sm:px-0">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.0 }}
              className="flex items-center space-x-2 border-[0.5px] border-zinc-800/30 rounded-full px-4 sm:px-6 py-2 sm:py-2.5 bg-white/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <BoltIcon className="h-4 sm:h-5 w-4 sm:w-5 text-yellow-500" />
              <span className="text-xs sm:text-sm text-zinc-800 font-medium">Correspondance Rapide</span>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.2 }}
              className="flex items-center space-x-2 border-[0.5px] border-zinc-800/30 rounded-full px-4 sm:px-6 py-2 sm:py-2.5 bg-white/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <ShieldCheckIcon className="h-4 sm:h-5 w-4 sm:w-5 text-yellow-500" />
              <span className="text-xs sm:text-sm text-zinc-800 font-medium">Plateforme Sécurisée</span>
            </motion.div>
          </div>
          
          {/* Mobile scroll indicator */}
          <motion.div 
            className="absolute bottom-6 left-1/2 transform -translate-x-1/2 sm:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.8, 0] }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              repeatType: "loop" 
            }}
          >
            <div className="flex flex-col items-center">
              <svg className="w-6 h-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default Hero;
