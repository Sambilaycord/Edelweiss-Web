import React, { useState, useEffect } from 'react';
import { Truck, ShieldCheck, RefreshCw, Bell, Sparkles } from 'lucide-react';

const PromoCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 1,
      text: "Same-Day Flower Delivery Across Northern Mindanao",
      subtext: "Order before 12 PM for guaranteed same-day delivery",
      icon: <Truck className="w-6 h-6 mr-3 flex-shrink-0" />,
      color: "bg-pink-500 text-white"
    },
    {
      id: 2,
      text: "Fresh Blooms, Guaranteed — Or Your Money Back",
      subtext: "Every arrangement is freshness-verified before dispatch",
      icon: <ShieldCheck className="w-6 h-6 mr-3 flex-shrink-0" />,
      color: "bg-black text-white"
    },
    {
      id: 3,
      text: "New Local Florists Join Edelweiss Every Week",
      subtext: "Discover unique arrangements from shops near you",
      icon: <RefreshCw className="w-6 h-6 mr-3 flex-shrink-0" />,
      color: "bg-pink-600 text-white"
    },
    {
      id: 4,
      text: "Never Miss a Special Occasion Again",
      subtext: "Set gift reminders and let Edelweiss do the rest",
      icon: <Bell className="w-6 h-6 mr-3 flex-shrink-0" />,
      color: "bg-black text-white"
    },
    {
      id: 5,
      text: "Subscribe & Save — Fresh Flowers Weekly",
      subtext: "Get curated bouquets delivered right to your doorstep",
      icon: <Sparkles className="w-6 h-6 mr-3 flex-shrink-0" />,
      color: "bg-pink-700 text-white"
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 4000); // Switches slightly faster (4 seconds)
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    // "h-16" sets a fixed short height. "overflow-hidden" hides the other slides.
    <div className="relative w-full overflow-hidden rounded-xl shadow-sm h-16">

      {/* Sliding Track */}
      <div
        className="flex transition-transform duration-500 ease-in-out h-full"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {slides.map((slide) => (
          <div
            key={slide.id}
            className={`w-full flex-shrink-0 flex items-center justify-center py-4 ${slide.color}`}
          >
            {/* Content Container */}
            <div className="flex items-center">
              {slide.icon}
              <div className="flex flex-col md:flex-row md:items-center md:gap-2">
                <span className="font-bold text-base md:text-lg">
                  {slide.text}
                </span>
                <span className="hidden md:block text-white/80 text-sm">|</span>
                <span className="text-xs md:text-sm text-white/90">
                  {slide.subtext}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Optional: Tiny Arrows (Left/Right) if you want manual control */}
      <button
        onClick={() => setCurrentSlide(curr => curr === 0 ? slides.length - 1 : curr - 1)}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-white/75 hover:text-white cursor-pointer"
      >
        &lt;
      </button>
      <button
        onClick={() => setCurrentSlide(curr => curr === slides.length - 1 ? 0 : curr + 1)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/75 hover:text-white cursor-pointer"
      >
        &gt;
      </button>

    </div>
  );
};

export default PromoCarousel;