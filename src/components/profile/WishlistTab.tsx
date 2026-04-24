import React, { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Heart, ShoppingBag, Loader2, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ITEMS_PER_PAGE = 16;

const WishlistTab: React.FC = () => {
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const navigate = useNavigate();
  const observer = useRef<IntersectionObserver | null>(null);

  const lastElementRef = useCallback((node: HTMLDivElement) => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore]);

  const fetchWishlist = async (pageNum: number) => {
    try {
      if (pageNum === 0) setLoading(true);
      else setLoadingMore(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const from = pageNum * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      // Also get total count on first load
      if (pageNum === 0) {
        const { count } = await supabase
          .from('user_favorites')
          .select('*', { count: 'exact', head: true })
          .eq('customer_id', user.id);
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

      if (data) {
        setWishlist(prev => pageNum === 0 ? data : [...prev, ...data]);
        setHasMore(data.length === ITEMS_PER_PAGE);
      }
    } catch (err) {
      console.error('Error fetching wishlist:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const removeFromWishlist = async (favoriteId: string) => {
    try {
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('id', favoriteId);

      if (error) throw error;
      setWishlist(prev => prev.filter(item => item.id !== favoriteId));
      setTotalCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error removing from wishlist:', err);
    }
  };

  useEffect(() => {
    fetchWishlist(page);
  }, [page]);

  if (loading && page === 0) return (
    <div className="flex justify-center py-20">
      <Loader2 className="animate-spin text-pink-600" size={32} />
    </div>
  );

  if (wishlist.length === 0 && !loading) return (
    <div className="text-center py-20 text-gray-500">
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
    <div className="space-y-6">
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
