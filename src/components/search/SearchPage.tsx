import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronDown, Image as ImageIcon, Loader2, Search, ShoppingCart, Star } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import Navbar from '../common/Navbar';
import QuickAddModal from '../common/QuickAddModal';

const PAGE_SIZE = 20;

interface ProductRow {
  id: string;
  name: string;
  description: string | null;
  price: number | string;
  stock: number | null;
  image_urls: string[] | null;
  average_rating?: number | null;
  review_count?: number | null;
  product_variants?: { price: number; stock: number }[] | null;
  shops?: { id: string; name: string } | null;
}

interface SearchProduct {
  id: string;
  name: string;
  desc: string;
  price: number;
  image: string;
  average_rating?: number;
  review_count?: number;
  hasVariants: boolean;
  isOutOfStock: boolean;
  shopName?: string;
}

interface Results {
  key: string;
  items: SearchProduct[];
  hasMore: boolean;
  error: string;
}

// Escape LIKE wildcards so user input is matched literally
const escapeLike = (value: string) => value.replace(/[\\%_]/g, (c) => `\\${c}`);

const fetchSearchPage = async (
  terms: string[],
  start: number,
  signal: AbortSignal,
): Promise<SearchProduct[]> => {
  let query = supabase
    .from('products')
    .select('*, product_variants(price, stock), shops(id, name)')
    .eq('is_active', true);

  // Products have no category column, so a category is matched against the name like a search term
  for (const term of terms) {
    query = query.ilike('name', `%${escapeLike(term)}%`);
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .range(start, start + PAGE_SIZE - 1)
    .abortSignal(signal);

  if (error) throw error;

  return ((data ?? []) as ProductRow[]).map((p) => {
    const variants = p.product_variants ?? [];
    const hasVariants = variants.length > 0;
    return {
      id: p.id,
      name: p.name,
      desc: p.description ?? '',
      price: Number(p.price),
      image: p.image_urls?.[0] || '',
      average_rating: p.average_rating ?? undefined,
      review_count: p.review_count ?? undefined,
      hasVariants,
      isOutOfStock: hasVariants ? variants.every((v) => v.stock <= 0) : (p.stock ?? 0) <= 0,
      shopName: p.shops?.name,
    };
  });
};

const isAbort = (err: unknown) =>
  err instanceof Error && (err.name === 'AbortError' || err.message.includes('AbortError'));

const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const q = (searchParams.get('q') ?? '').trim();
  const category = (searchParams.get('category') ?? '').trim();

  // Identifies the current filter set; results tagged with an older key are stale
  const resultsKey = JSON.stringify([q, category]);

  const [results, setResults] = useState<Results | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<SearchProduct | null>(null);

  const controllerRef = useRef<AbortController | null>(null);
  const keyRef = useRef(resultsKey);

  const terms = [q, category].filter(Boolean);
  const termsKey = JSON.stringify(terms);

  // Initial page for the current filters; aborts the previous fetch when filters change
  useEffect(() => {
    const controller = new AbortController();
    controllerRef.current = controller;
    keyRef.current = resultsKey;
    const currentTerms = JSON.parse(termsKey) as string[];

    fetchSearchPage(currentTerms, 0, controller.signal)
      .then((items) => {
        if (controller.signal.aborted) return;
        setResults({ key: resultsKey, items, hasMore: items.length === PAGE_SIZE, error: '' });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted || isAbort(err)) return;
        console.error('Search failed:', err);
        setResults({ key: resultsKey, items: [], hasMore: false, error: 'Something went wrong while searching. Please try again.' });
      });

    return () => {
      controller.abort();
      // An aborted "load more" skips its own reset, so clear the spinner here
      setLoadingMore(false);
    };
  }, [resultsKey, termsKey]);

  const current = results?.key === resultsKey ? results : null;
  const loading = current === null;

  const handleLoadMore = useCallback(async () => {
    const controller = controllerRef.current;
    if (!current || !current.hasMore || loadingMore || !controller) return;
    const key = keyRef.current;
    setLoadingMore(true);
    try {
      const items = await fetchSearchPage(JSON.parse(termsKey) as string[], current.items.length, controller.signal);
      if (controller.signal.aborted || keyRef.current !== key) return;
      setResults((prev) => {
        if (!prev || prev.key !== key) return prev;
        // Skip duplicates in case new products shifted the page window
        const seen = new Set(prev.items.map((p) => p.id));
        return {
          ...prev,
          items: [...prev.items, ...items.filter((p) => !seen.has(p.id))],
          hasMore: items.length === PAGE_SIZE,
        };
      });
    } catch (err: unknown) {
      if (controller.signal.aborted || isAbort(err)) return;
      console.error('Failed to load more results:', err);
    } finally {
      if (!controller.signal.aborted) setLoadingMore(false);
    }
  }, [current, loadingMore, termsKey]);

  const heading = q
    ? `Results for "${q}"`
    : category
      ? category
      : 'All Products';

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 w-full py-10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 break-words min-w-0">
            {heading}
          </h2>
          <div className="h-[2px] bg-pink-100 flex-1 ml-6 rounded-full hidden md:block opacity-50"></div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
          </div>
        ) : current.error ? (
          <div className="text-center py-20 text-red-600">
            <p>{current.error}</p>
          </div>
        ) : current.items.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm text-center py-20 px-6 border border-gray-100">
            <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-6 text-pink-400">
              <Search size={40} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No products found</h3>
            <p className="text-gray-500">
              {terms.length > 0
                ? 'Try a different search term or browse all products.'
                : 'There are no products available yet. Check back soon!'}
            </p>
            {terms.length > 0 && (
              <button
                onClick={() => navigate('/search')}
                className="mt-6 px-6 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold shadow-sm transition-colors text-sm cursor-pointer"
              >
                View all products
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {current.items.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -5 }}
                  className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-xl transition-all cursor-pointer flex flex-col h-full ${p.isOutOfStock ? 'opacity-70 grayscale-[0.3]' : ''}`}
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
                    {p.isOutOfStock && (
                      <div className="absolute top-3 right-3 bg-red-600/90 backdrop-blur-sm px-3 py-1 text-white text-xs font-bold rounded-lg uppercase tracking-wider shadow-sm">
                        Sold Out
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-medium text-gray-800 text-sm mb-1 line-clamp-2 md:text-base group-hover:text-pink-600 transition-colors">
                      {p.name}
                    </h3>
                    {p.shopName && (
                      <p className="text-xs text-gray-400 mb-1 truncate">{p.shopName}</p>
                    )}
                    {p.desc && (
                      <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">
                        {p.desc}
                      </p>
                    )}

                    <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between">
                      <span className="text-pink-600 font-bold text-base md:text-lg">
                        {p.hasVariants && <span className="text-gray-400 font-medium text-xs mr-1">from</span>}
                        ₱{p.price.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {p.review_count !== undefined && p.review_count > 0 && (
                          <div className="flex items-center gap-1 text-xs bg-yellow-50 px-2 py-1 rounded-lg text-gray-800 font-bold border border-yellow-100">
                            <Star size={12} className="text-yellow-500 fill-yellow-500" />
                            <span>{Number(p.average_rating || 0).toFixed(1)}</span>
                          </div>
                        )}
                        {!p.isOutOfStock && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProduct(p);
                            }}
                            className="p-2 text-gray-700 hover:text-black hover:scale-110 cursor-pointer transition-all"
                            aria-label="Quick add to cart"
                          >
                            <ShoppingCart size={24} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-12 flex flex-col items-center justify-center gap-4">
              {loadingMore ? (
                <div className="flex items-center gap-2 text-pink-600 font-medium animate-pulse">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Loading more...</span>
                </div>
              ) : current.hasMore ? (
                <button
                  onClick={handleLoadMore}
                  className="flex items-center gap-2 px-10 py-3.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-2xl hover:bg-pink-50 hover:border-pink-200 hover:text-pink-600 transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer group"
                >
                  Load more
                  <ChevronDown className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
                </button>
              ) : (
                <p className="text-gray-400 text-sm font-medium italic">
                  You've reached the end of the results.
                </p>
              )}
            </div>
          </>
        )}
      </main>

      {selectedProduct && (
        <QuickAddModal
          productId={selectedProduct.id}
          productName={selectedProduct.name}
          productImage={selectedProduct.image}
          basePrice={selectedProduct.price}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
};

export default SearchPage;
