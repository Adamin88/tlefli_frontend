import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  BoltIcon,
  ShieldCheckIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import heroImage from '../assets/herosection1.png';

function Hero() {
  return (
    <>
      <div className="relative min-h-[100svh] h-auto flex items-center justify-center overflow-hidden bg-white pt-2 pb-2 sm:pt-2 sm:pb-10 lg:py-10">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-64 h-64 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-blob animation-delay-4000"></div>
        </div>
        
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row items-center justify-between h-full py-6 md:py-8 lg:py-12 gap-8 sm:gap-10 lg:gap-16">
            {/* Content column - full width on mobile/tablet, half on desktop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="flex flex-col items-center lg:items-start max-w-2xl w-full lg:w-1/2 mt-10 sm:mt-8 lg:mt-0"
            >
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="text-center lg:text-left space-y-3 sm:space-y-4 lg:space-y-6"
              >
                <h1 className="mb-2 sm:mb-3 lg:mb-4 leading-none">
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="inline-flex items-center gap-2  px-4 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200/50 rounded-full shadow-sm"
                  >
                    
                    <span className="text-sm font-semibold text-amber-700 tracking-wide">
                      Solution #1 au Maroc
                    </span>
                  </motion.div>
                  <span className="relative">
                    <span 
                      className="block text-4xl sm:text-4xl md:text-5xl lg:text-7xl text-stone-700 font-extrabold pt-5"
                    >
                      Déclarer votre objet
                    </span>
                    <motion.span 
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 1, delay: 0.5, ease: "easeInOut" }}
                      className="absolute -bottom-1 left-0 h-[1px] bg-yellow-600 opacity-70"
                    ></motion.span>
                    <span 
                      className="block text-2xl sm:text-3xl md:text-4xl lg:text-6xl mt-2 sm:mt-3 font-light text-stone-700"
                    >
                      en 2 minutes
                    </span>
                  </span>
                </h1>
              
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 0.6 }}
                  className="tracking-tight max-w-xs sm:max-w-md mx-auto lg:mx-0 text-sm sm:text-base md:text-lg lg:text-xl font-normal text-stone-800 leading-relaxed"                >
                  Avec TLEFLI, nous transformons chaque perte en une retrouvaille réussie.
                </motion.p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                className="flex flex-col items-center lg:items-start gap-4 md:gap-6 w-full mt-10 sm:mt-12 md:mt-14"
              >
                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5 md:gap-6 justify-center lg:justify-start w-full sm:w-auto">
                  <Link
                    to="/report"
                    className="group relative inline-flex items-center gap-2 overflow-hidden w-32 sm:w-32"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-600 rounded-xl  group-hover:opacity-80 transition-opacity duration-300"></span>
                    <span 
                      className="relative z-10 rounded-xl px-2 sm:px-2 py-1 sm:py-1 text-xl sm:text-xl font-bold text-white transition-all duration-500 text-center flex items-center justify-center w-full"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      J'ai trouvé
                    </span>
                  </Link>
                  <Link
                    to="/report"
                    className="group relative inline-flex items-center gap-2 overflow-hidden w-32 sm:w-32"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-yellow-600 to-yellow-600 rounded-xl group-hover:opacity-80 transition-opacity duration-300"></span>
                    <span 
                      className="relative z-10 rounded-xl px-2 sm:px-2 py-1 sm:py-1 text-xl sm:text-xl font-bold text-white transition-all duration-500 text-center flex items-center justify-center w-full"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      J'ai perdu
                    </span>
                  </Link>
                </div>
              </motion.div>

              <div className="flex flex-wrap justify-center lg:justify-start lg:flex-nowrap gap-3 md:gap-4 px-2 sm:px-0 mt-10 sm:mt-12 md:mt-14 mb-6 sm:mb-8">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 1.0 }}
                  className="flex items-center text-center space-x-1 sm:space-x-2 border-[0.5px] border-zinc-800/30 rounded-full px-2 py-1 bg-white/90 shadow-sm hover:shadow-md transition-shadow duration-300"
                >
                  <BoltIcon className="h-3 sm:h-4 md:h-5 w-3 sm:w-4 md:w-5 text-yellow-500" />
                  <span 
                    className="text-xs md:text-sm text-zinc-800 font-medium"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    Correspondance Rapide
                  </span>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 1.2 }}
                  className="flex items-center text-center space-x-1 sm:space-x-2 border-[0.5px] border-zinc-800/30 rounded-full px-2 py-1 bg-white/90 shadow-sm hover:shadow-md transition-shadow duration-300"
                >
                  <ShieldCheckIcon className="h-3 sm:h-4 md:h-5 w-3 sm:w-4 md:w-5 text-yellow-500" />
                  <span 
                    className="text-xs md:text-sm text-zinc-800 font-medium"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    Plateforme Sécurisée
                  </span>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 1.4 }}
                  className="flex items-center text-center space-x-1 sm:space-x-2 border-[0.5px] border-zinc-800/30 rounded-full px-2 py-1 sm:py-2 md:py-2.5 bg-white/90 shadow-sm hover:shadow-md transition-shadow duration-300"
                >
                  <MapPinIcon className="h-3 sm:h-4 md:h-5 w-3 sm:w-4 md:w-5 text-yellow-500" />
                  <span 
                    className="text-xs md:text-sm text-zinc-800 font-medium"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    Géolocalisation Précise
                  </span>
                </motion.div>
              </div>
            </motion.div>
            
            {/* Right image column - shown ONLY on large (desktop) devices */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="hidden lg:block lg:w-1/2 relative h-full"
            >
              <div className="relative w-full h-[450px] overflow-hidden">
                <img 
                  src={heroImage} 
                  alt="TLEFLI Hero" 
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>
            
            {/* Mobile scroll indicator - visible on small screens only */}
            <motion.div 
              className="absolute bottom-4 left-1/2 transform -translate-x-1/2 sm:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.8, 0] }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                repeatType: "loop" 
              }}
            >
              <div className="flex flex-col items-center">
                <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Hero;
