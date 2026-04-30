import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Timer, ShoppingCart, Image as ImageIcon } from 'lucide-react';

export type Product = {
  id: string | number;
  name: string;
  desc: string;
  price: number;
  image?: string;
  image_urls?: string[];
  average_rating?: number;
  review_count?: number;
};

interface FlashSaleProps {
  products: Product[];
  onAddToCart?: (product: Product) => void;
}

const FlashSale: React.FC<FlashSaleProps> = ({ products, onAddToCart }) => {
  // TEMP: Using featured product data for demonstration purposes
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [timeLeft, setTimeLeft] = useState(15791);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev <= 0 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const { current } = scrollContainerRef;
      const scrollAmount = current.clientWidth;
      current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="relative group py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold font-serif text-gray-900">Flash Sale</h2>
          <div className="flex items-center gap-2 bg-pink-600 text-white px-3 py-1 rounded-md text-sm font-semibold tabular-nums">
            <Timer className="w-4 h-4" />
            <span>Ends in {formatTime(timeLeft)}</span>
          </div>
        </div>
        <a href="#" className="text-pink-600 font-medium hover:underline">View All</a>
      </div>

      <button
        onClick={() => scroll('left')}
        className="absolute left-0 top-[50%] -translate-y-1/2 -ml-4 z-10 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center text-gray-600 hover:text-pink-600 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-30 border border-gray-100"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={() => scroll('right')}
        className="absolute right-0 top-[50%] -translate-y-1/2 -mr-4 z-10 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center text-gray-600 hover:text-pink-600 transition-all opacity-0 group-hover:opacity-100 border border-gray-100"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      <div
        ref={scrollContainerRef}
        className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((p) => {
          // Select a random image from image_urls if available
          const displayImage = p.image_urls && p.image_urls.length > 0 
            ? p.image_urls[Math.floor(Math.random() * p.image_urls.length)]
            : p.image;

          return (
            <div
              key={p.id}
              className="w-[calc((100%-16px)/2)] sm:w-[calc((100%-32px)/3)] md:w-[calc((100%-48px)/4)] lg:w-[calc((100%-64px)/5)] flex-shrink-0 bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col"
            >
              <div className="relative h-48 w-full bg-gray-50 flex items-center justify-center overflow-hidden">
                {displayImage ? (
                  <img
                    src={displayImage}
                    alt={p.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <ImageIcon size={32} className="text-gray-200" />
                )}
                <span className="absolute top-2 left-2 bg-pink-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm uppercase">
                  -40% OFF
                </span>
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-gray-800 mb-1 truncate">{p.name}</h3>

                <div className="flex items-center gap-2 mb-3">
                  <span className="text-pink-600 font-bold">₱{(p.price * 0.6).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                  <span className="text-gray-400 text-sm line-through">₱{p.price.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                </div>

                <button 
                  onClick={() => onAddToCart && onAddToCart(p)}
                  className="w-full flex items-center justify-center gap-2 bg-pink-700 text-white py-2 rounded-lg text-sm font-medium hover:bg-pink-600 transition-colors"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Add to Cart
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default FlashSale;