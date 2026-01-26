import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Timer, ShoppingCart } from 'lucide-react';

const FlashSale = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 1. TIMER STATE: Start with 4 hours, 23 mins, 11 seconds (in total seconds)
  // 4h * 3600 + 23m * 60 + 11s = 15791 seconds
  const [timeLeft, setTimeLeft] = useState(15791);

  // 2. TIMER LOGIC: Decrement every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Cleanup interval on component unmount
    return () => clearInterval(timer);
  }, []);

  // 3. FORMATTER: Convert seconds to HH:MM:SS
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    // padStart(2, '0') ensures "9" becomes "09"
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Mock Data
  const products = [
    { id: 1, name: "Velvet Cushion", price: 24.99, oldPrice: 49.99, discount: "-50%", image: "bg-red-100" },
    { id: 2, name: "Ceramic Vase", price: 18.50, oldPrice: 28.00, discount: "-35%", image: "bg-orange-100" },
    { id: 3, name: "Cotton Throw", price: 32.00, oldPrice: 64.00, discount: "-50%", image: "bg-yellow-100" },
    { id: 4, name: "Table Lamp", price: 45.00, oldPrice: 70.00, discount: "-35%", image: "bg-green-100" },
    { id: 5, name: "Scented Candle", price: 12.00, oldPrice: 20.00, discount: "-40%", image: "bg-blue-100" },
    { id: 6, name: "Woven Basket", price: 22.00, oldPrice: 35.00, discount: "-37%", image: "bg-indigo-100" },
    { id: 7, name: "Wall Mirror", price: 55.00, oldPrice: 90.00, discount: "-38%", image: "bg-purple-100" },
    { id: 8, name: "Plant Pot", price: 15.00, oldPrice: 25.00, discount: "-40%", image: "bg-pink-100" },
    { id: 9, name: "Desk Clock", price: 35.00, oldPrice: 50.00, discount: "-30%", image: "bg-teal-100" },
    { id: 10, name: "Floor Rug", price: 85.00, oldPrice: 120.00, discount: "-25%", image: "bg-cyan-100" },
  ];

  // Scroll Handler
  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const { current } = scrollContainerRef;
      const scrollAmount = current.clientWidth; 

      if (direction === 'left') {
        current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  };

  return (
    <section className="relative group">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold font-serif text-gray-900">Flash Sale</h2>
          {/* Timer Display */}
          <div className="flex items-center gap-2 bg-pink-600 text-white px-3 py-1 rounded-md text-sm font-semibold tabular-nums">
            <Timer className="w-4 h-4" />
            <span>Ends in {formatTime(timeLeft)}</span>
          </div>
        </div>
        <a href="#" className="text-pink-600 font-medium hover:underline">View All</a>
      </div>

      {/* Navigation Arrows */}
      <button 
        onClick={() => scroll('left')} 
        className="absolute left-0 top-[50%] -translate-y-1/2 -ml-4 z-10 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center text-gray-600 hover:text-pink-600 hover:scale-110 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-30 border border-gray-100"
        aria-label="Scroll left"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button 
        onClick={() => scroll('right')} 
        className="absolute right-0 top-[50%] -translate-y-1/2 -mr-4 z-10 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center text-gray-600 hover:text-pink-600 hover:scale-110 transition-all opacity-0 group-hover:opacity-100 border border-gray-100"
        aria-label="Scroll right"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Scrollable Container */}
      <div 
        ref={scrollContainerRef}
        className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} 
      >
        {products.map((product) => (
          <div 
            key={product.id} 
            className="min-w-[calc(20%-15px)] flex-shrink-0 bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-300"
          >
            {/* Product Image Area */}
            <div className={`relative h-48 w-full ${product.image} flex items-center justify-center`}>
              <span className="text-gray-400">Image</span>
              <span className="absolute top-2 left-2 bg-pink-600 text-white text-xs font-bold px-2 py-1 rounded">
                {product.discount}
              </span>
            </div>

            {/* Product Details */}
            <div className="p-4">
              <h3 className="font-semibold text-gray-800 mb-1 truncate">{product.name}</h3>
              
              <div className="flex items-center gap-2 mb-3">
                <span className="text-pink-600 font-bold">${product.price.toFixed(2)}</span>
                <span className="text-gray-400 text-sm line-through">${product.oldPrice.toFixed(2)}</span>
              </div>

              <button className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-pink-600 transition-colors">
                <ShoppingCart className="w-4 h-4" />
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FlashSale;