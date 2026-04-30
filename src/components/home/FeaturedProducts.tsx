import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Star, Image as ImageIcon, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

// 1. Define the shape of a single Product
export type Product = {
  id: string | number;
  name: string;
  desc: string;
  price: number;
  image?: string;
  average_rating?: number;
  review_count?: number;
};

// 2. Define the props
interface FeaturedProductsProps {
  products: Product[];
  onAddToCart?: (product: Product) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

const FeaturedProducts: React.FC<FeaturedProductsProps> = ({
  products,
  onLoadMore,
  hasMore = true,
  isLoadingMore = false
}) => {
  const navigate = useNavigate();

  // STATE: Control whether automatic infinite scroll is enabled
  // It only enables after the first manual "Explore More" click
  const [isInfiniteEnabled, setIsInfiniteEnabled] = useState(false);

  // REF: Sentinel for intersection observer
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // HANDLER: First "Explore More" click
  const handleInitialLoadMore = () => {
    setIsInfiniteEnabled(true);
    if (onLoadMore) onLoadMore();
  };

  // EFFECT: Set up IntersectionObserver for infinite scroll
  useEffect(() => {
    if (!isInfiniteEnabled || !hasMore || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          if (onLoadMore) onLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => {
      if (sentinelRef.current) {
        observer.unobserve(sentinelRef.current);
      }
    };
  }, [isInfiniteEnabled, hasMore, isLoadingMore, onLoadMore]);

  return (
    <section id="products" className="py-12 max-w-7xl mx-auto px-4">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
          Featured Products
        </h2>
        <div className="h-[2px] bg-pink-100 flex-1 ml-6 rounded-full hidden md:block opacity-50"></div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {products.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-xl transition-all cursor-pointer flex flex-col h-full"
            onClick={() => navigate(`/product/${p.id}`)}
          >
            {/* Image */}
            <div className="relative aspect-square bg-gray-50 overflow-hidden">
              {p.image ? (
                <img
                  src={p.image}
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                  <ImageIcon size={40} />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-5 flex flex-col flex-1">
              <h3 className="font-medium text-gray-800 text-sm mb-1 line-clamp-2 md:text-base group-hover:text-pink-600 transition-colors">
                {p.name}
              </h3>
              {p.desc && (
                <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">
                  {p.desc}
                </p>
              )}

              <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between">
                <span className="text-pink-600 font-bold text-base md:text-lg">
                  ₱{p.price.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </span>

                {p.review_count !== undefined && p.review_count > 0 && (
                  <div className="flex items-center gap-1 text-xs bg-yellow-50 px-2 py-1 rounded-lg text-gray-800 font-bold border border-yellow-100">
                    <Star size={12} className="text-yellow-500 fill-yellow-500" />
                    <span>{Number(p.average_rating || 0).toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Sentinel for Infinite Scroll */}
      <div ref={sentinelRef} className="h-4" />

      {/* Loading & "See More" Button Area */}
      <div className="mt-12 flex flex-col items-center justify-center gap-4">
        {isLoadingMore && (
          <div className="flex items-center gap-2 text-pink-600 font-medium animate-pulse">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Finding more gifts...</span>
          </div>
        )}

        {!isInfiniteEnabled && hasMore && !isLoadingMore && (
          <button
            onClick={handleInitialLoadMore}
            className="flex items-center gap-2 px-10 py-3.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-2xl hover:bg-pink-50 hover:border-pink-200 hover:text-pink-600 transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer group"
          >
            Explore More Gifts
            <ChevronDown className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
          </button>
        )}

        {!hasMore && products.length > 0 && (
          <p className="text-gray-400 text-sm font-medium italic">
            You've reached the end of our gift collection.
          </p>
        )}
      </div>
    </section>
  );
};

export default FeaturedProducts;
