import React from 'react';

const Hero = () => {
  return (
    <div className="relative overflow-hidden rounded-3xl glass-panel my-8 p-12 lg:p-20 text-center animate-fade-in flex flex-col items-center justify-center min-h-[40vh]">
      {/* Background glowing orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[100px] translate-y-1/2"></div>
      
      <div className="relative z-10 max-w-3xl mx-auto">
        <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-6">
          Discover Your <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Next Obsession</span>
        </h1>
        <p className="text-xl text-gray-300 mb-10 leading-relaxed">
          Shop millions of real Amazon products, powered by AI that learns your taste. The more you browse, the smarter your recommendations get.
        </p>
        <div className="flex gap-4 justify-center">
          <button 
            onClick={() => document.getElementById('explore')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-8 py-4 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-colors"
          >
            Shop Now
          </button>
          <button 
            onClick={() => document.getElementById('explore')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-8 py-4 glass-panel hover:bg-surfaceHover rounded-full font-bold transition-colors border border-white/20"
          >
            Explore Categories
          </button>
        </div>
      </div>
    </div>
  );
};

export default Hero;
