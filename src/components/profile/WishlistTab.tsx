import React, { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Heart, ShoppingBag, Loader2, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ITEMS_PER_PAGE = 16;

interface WishlistItem {
  id: string;
  product_id: string;
  products: {
    id: string;
    name: string;
    price: number | null;
    image_urls: string[] | null;
    description: string | null;
  } | null;
}

const WishlistTab: React.FC = () => {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const navigate = useNavigate();
  const observer = useRef<IntersectionObserver | null>(null);
  // Items removed since loading started; shifts the offset of later pages so nothing gets skipped
  const removedCountRef = useRef(0);
  const removingIdsRef = useRef<Set<string>>(new Set());

  const lastElementRef = useCallback((node: HTMLDivElement | null) => {
    if (observer.current) observer.current.disconnect();
    if (loading || loadingMore || !hasMore || !node) return;
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        // Stop observing right away so a single scroll can't request the same page twice
        observer.current?.disconnect();
        setLoadingMore(true);
        setPage(prevPage => prevPage + 1);
      }
    });
    observer.current.observe(node);
  }, [loading, loadingMore, hasMore]);

  // Disconnect the observer on unmount
  useEffect(() => () => observer.current?.disconnect(), []);

  useEffect(() => {
    let cancelled = false;

    const fetchWishlist = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) return;

        if (page === 0) removedCountRef.current = 0;
        const from = Math.max(0, page * ITEMS_PER_PAGE - removedCountRef.current);
        const to = from + ITEMS_PER_PAGE - 1;

        // Also get total count on first load
        if (page === 0) {
          const { count, error: countError } = await supabase
            .from('user_favorites')
            .select('*', { count: 'exact', head: true })
            .eq('customer_id', user.id);
          if (countError) throw countError;
          if (cancelled) return;
          setTotalCount(count || 0);
        }

        const { data, error } = await supabase
          .from('user_favorites')
          .select(`
            id,
            product_id,
            products (
              id,
              name,
              price,
              image_urls,
              description
            )
          `)
          .eq('customer_id', user.id)
          .order('id', { ascending: false }) // Use ID as a stable sort if created_at isn't available or preferred
          .range(from, to);

        if (error) throw error;
        if (cancelled) return;

        const rows = (data as unknown as WishlistItem[] | null) || [];
        setWishlist(prev => {
          if (page === 0) return rows;
          // Skip anything already shown (guards against offset drift)
          const seen = new Set(prev.map(item => item.id));
          return [...prev, ...rows.filter(item => !seen.has(item.id))];
        });
        setHasMore(rows.length === ITEMS_PER_PAGE);
      } catch (err) {
        if (!cancelled) {
          console.error('Error fetching wishlist:', err);
          setHasMore(false);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    };

    fetchWishlist();
    return () => { cancelled = true; };
  }, [page]);

  const removeFromWishlist = async (favoriteId: string) => {
    // Ignore repeated clicks while the delete is in flight
    if (removingIdsRef.current.has(favoriteId)) return;
    removingIdsRef.current.add(favoriteId);
    try {
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('id', favoriteId);

      if (error) throw error;
      removedCountRef.current += 1;
      setWishlist(prev => prev.filter(item => item.id !== favoriteId));
      setTotalCount(prev => Math.max(0, prev - 1));
      // If that was the last loaded item but more exist, pull in the next page
      if (wishlist.length === 1 && wishlist[0].id === favoriteId && hasMore) {
        setLoadingMore(true);
        setPage(prev => prev + 1);
      }
    } catch (err) {
      console.error('Error removing from wishlist:', err);
    } finally {
      removingIdsRef.current.delete(favoriteId);
    }
  };

  if (loading && page === 0) return (
    <div className="flex justify-center py-20">
      <Loader2 className="animate-spin text-pink-600" size={32} />
    </div>
  );

  if (wishlist.length === 0 && !loading && !loadingMore) return (
    <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
      <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <Heart size={32} className="text-pink-300" />
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">Your wishlist is empty</h3>
      <p className="mb-8">Save items you love to find them later!</p>
      <button
        onClick={() => navigate('/')}
        className="px-8 py-3 bg-pink-600 text-white rounded-xl font-bold hover:bg-pink-700 transition-all cursor-pointer"
      >
        Start Shopping
      </button>
    </div>
  );

  return (
    <div className="space-y-6 flex-1 flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">My Wishlist</h2>
        <span className="text-sm font-medium text-gray-500">{totalCount} Items</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {wishlist.map((item, index) => (
          <div
            key={item.id}
            ref={index === wishlist.length - 1 ? lastElementRef : null}
            className="bg-white border-2 border-gray-100 rounded-2xl p-4 flex gap-4 hover:shadow-md transition-all group relative"
          >
            <button
              onClick={() => removeFromWishlist(item.id)}
              className="absolute top-2 right-2 text-gray-300 hover:text-red-500 transition-colors p-1 z-10"
            >
              <Trash2 size={18} />
            </button>
            <div
              onClick={() => navigate(`/product/${item.product_id}`)}
              className="w-24 h-24 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0 cursor-pointer"
            >
              <img
                src={item.products?.image_urls?.[0] || 'https://via.placeholder.com/150'}
                alt={item.products?.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="flex-1 flex flex-col text-left">
              <h3
                onClick={() => navigate(`/product/${item.product_id}`)}
                className="font-semibold text-gray-800 hover:text-pink-600 cursor-pointer transition-colors line-clamp-1 pr-6"
              >
                {item.products?.name}
              </h3>
              <p className="text-pink-600 font-semibold text-lg mt-1">₱{item.products?.price?.toLocaleString()}</p>
              <button
                onClick={() => navigate(`/product/${item.product_id}`)}
                className="mt-auto w-full py-2 bg-pink-50 text-pink-600 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-pink-100 transition-all cursor-pointer"
              >
                <ShoppingBag size={14} /> View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {loadingMore && (
        <div className="flex justify-center py-6">
          <Loader2 className="animate-spin text-pink-600" size={24} />
        </div>
      )}

      {!hasMore && wishlist.length > 0 && (
        <p className="text-center text-gray-400 text-sm py-8">
          You've reached the end of your wishlist.
        </p>
      )}
    </div>
  );
};

export default WishlistTab;
