import React, { useState, useEffect } from 'react';
import { ArrowRight, Star, Heart } from 'lucide-react';

const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 1,
      title: "Beautiful everyday goods",
      description: "Shop a small curated collection of lifestyle and home items crafted for calm, cozy living.",
      primaryBtn: "Start shopping",
      secondaryBtn: "Learn more",
      icon: <Star className="w-12 h-12 text-pink-300" />,
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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="relative w-full bg-white rounded-2xl shadow mb-8 overflow-hidden">
      
      {/* SLIDING TRACK 
         - 'flex' puts items side by side
         - 'transition-transform' animates the slide
         - 'translateX' moves the whole track
      */}
      <div 
        className="flex transition-transform duration-700 ease-in-out" 
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {slides.map((slide) => (
          // Each slide must be 'w-full' and 'flex-shrink-0' to ensure it takes up exactly 100% of the container width
          <div 
            key={slide.id} 
            className="w-full flex-shrink-0 grid grid-cols-1 md:grid-cols-2 gap-8 items-center p-8 min-h-[400px]"
          >
            {/* Text Side */}
            <div>
              <h1 className="text-4xl font-bold text-pink-600 mb-4">
                {slide.title}
              </h1>
              <p className="text-gray-700 mb-6 text-lg">
                {slide.description}
              </p>
              <div className="flex gap-3">
                <a href="#products" className="px-5 py-3 bg-pink-600 text-white rounded-lg shadow hover:bg-pink-700 transition-colors">
                  {slide.primaryBtn}
                </a>
                <a href="#" className="px-5 py-3 border border-pink-600 text-pink-600 rounded-lg hover:bg-pink-50 transition-colors">
                  {slide.secondaryBtn}
                </a>
              </div>
            </div>

            {/* Image Side */}
            <div className="flex items-center justify-center">
              <div className={`w-64 h-64 ${slide.bgColor} rounded-2xl flex items-center justify-center border border-gray-100 shadow-sm`}>
                 {slide.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Dots */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
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
    </section>
  );
};

export default HeroCarousel;