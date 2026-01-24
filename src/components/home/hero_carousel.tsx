import React, { useState, useEffect } from 'react';
import { ArrowRight, Star, Heart } from 'lucide-react'; // Assuming you use lucide-react

const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // 1. Define your 3 cards here
  const slides = [
    {
      id: 1,
      title: "Beautiful everyday goods",
      description: "Shop a small curated collection of lifestyle and home items crafted for calm, cozy living.",
      primaryBtn: "Start shopping",
      secondaryBtn: "Learn more",
      icon: <Star className="w-12 h-12 text-pink-300" />, // Placeholder for image
      bgColor: "bg-pink-50"
    },
    {
      id: 2,
      title: "Sustainable & Eco-friendly",
      description: "Our materials are sourced responsibly. Good for your home, even better for the planet.",
      primaryBtn: "View Collection",
      secondaryBtn: "Our Story",
      icon: <Heart className="w-12 h-12 text-green-300" />,
      bgColor: "bg-green-50"
    },
    {
      id: 3,
      title: "New Summer Arrivals",
      description: "Refresh your space with our latest seasonal drops. Bright colors and airy textures await.",
      primaryBtn: "Shop New",
      secondaryBtn: "Lookbook",
      icon: <ArrowRight className="w-12 h-12 text-blue-300" />,
      bgColor: "bg-blue-50"
    }
  ];

  // 2. Automatic switching logic (5 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 5000); // 5000ms = 5 seconds

    // Cleanup timer when component unmounts
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="relative w-full bg-white rounded-2xl shadow mb-8 overflow-hidden">
      
      {/* 3. The Slide Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center p-8 min-h-[400px]">
        
        {/* Text Side - with a key to trigger fade animation on change */}
        <div key={`text-${currentSlide}`} className="animate-fade-in">
          <h1 className="text-4xl font-bold text-pink-600 mb-4 transition-all duration-500">
            {slides[currentSlide].title}
          </h1>
          <p className="text-gray-700 mb-6 text-lg">
            {slides[currentSlide].description}
          </p>
          <div className="flex gap-3">
            <a href="#products" className="px-5 py-3 bg-pink-600 text-white rounded-lg shadow hover:bg-pink-700 transition-colors">
              {slides[currentSlide].primaryBtn}
            </a>
            <a href="#" className="px-5 py-3 border border-pink-600 text-pink-600 rounded-lg hover:bg-pink-50 transition-colors">
              {slides[currentSlide].secondaryBtn}
            </a>
          </div>
        </div>

        {/* Image Side */}
        <div key={`img-${currentSlide}`} className="flex items-center justify-center animate-fade-in">
          <div className={`w-64 h-64 ${slides[currentSlide].bgColor} rounded-2xl flex items-center justify-center border border-gray-100 shadow-sm transition-colors duration-500`}>
             {/* Replace this icon with your <img> tag */}
             {slides[currentSlide].icon}
          </div>
        </div>
      </div>

      {/* 4. Navigation Dots (Bottom Center) */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              currentSlide === index ? "bg-pink-600 w-8" : "bg-gray-300 hover:bg-pink-300"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Simple Fade Animation Style */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </section>
  );
};

export default HeroCarousel;