import React, { useEffect, useRef, useState } from 'react';
import { X, ShoppingCart, Plus, Minus, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

interface Variant {
  id: string;
  name: string;
  price: number;
  stock: number;
}

interface QuickAddModalProps {
  productId: string | number | null;
  productName?: string;
  productImage?: string;
  basePrice?: number;
  onClose: () => void;
}

const QuickAddModal: React.FC<QuickAddModalProps> = ({
  productId,
  productName,
  productImage,
  basePrice = 0,
  onClose,
}) => {
  const navigate = useNavigate();
  const [variants, setVariants] = useState<Variant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [stock, setStock] = useState(0);

  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear the pending auto-close timer if the modal unmounts first
  useEffect(() => () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
  }, []);

  useEffect(() => {
    if (!productId) return;
    let cancelled = false;

    const fetchVariants = async () => {
      setLoading(true);
      // Reset per-product state so a previous product's variant/stock is never reused
      setVariants([]);
      setSelectedVariant(null);
      setStock(0);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('stock, product_variants (id, name, price, stock)')
          .eq('id', productId)
          .single();

        if (cancelled) return;
        if (error) throw error;
        if (data) {
          const fetchedVariants: Variant[] = data.product_variants || [];
          setVariants(fetchedVariants);
          setStock(data.stock ?? 0);
          // Default to the first variant that is actually in stock
          setSelectedVariant(fetchedVariants.find((v) => v.stock > 0) ?? fetchedVariants[0] ?? null);
        }
      } catch (err) {
        console.error('Failed to load variants:', err);
        if (!cancelled) setMessage({ text: 'Failed to load product options.', type: 'error' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    setQuantity(1);
    setMessage(null);
    fetchVariants();

    return () => {
      cancelled = true;
    };
  }, [productId]);

  const currentPrice = selectedVariant ? selectedVariant.price : basePrice;
  const maxStock = selectedVariant ? selectedVariant.stock : stock;
  const isOutOfStock = maxStock <= 0;

  const handleAddToCart = async () => {
    if (adding || !productId) return;
    setAdding(true);
    setMessage(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate('/login');
        return;
      }

      let cartId: string | null = null;
      const { data: existingCart, error: cartError } = await supabase
        .from('carts')
        .select('id')
        .eq('customer_id', user.id)
        .maybeSingle();
      if (cartError) throw cartError;

      if (existingCart) {
        cartId = existingCart.id;
      } else {
        const { data: newCart, error: newCartError } = await supabase
          .from('carts')
          .insert({ customer_id: user.id })
          .select('id')
          .single();
        if (newCartError) throw newCartError;
        cartId = newCart?.id;
      }

      if (!cartId) throw new Error('Could not initialize cart.');

      // `.eq(col, null)` never matches NULL rows in PostgREST — use `.is()` for products without variants
      let itemQuery = supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('cart_id', cartId)
        .eq('product_id', productId);
      itemQuery = selectedVariant
        ? itemQuery.eq('variant_id', selectedVariant.id)
        : itemQuery.is('variant_id', null);
      const { data: existingItem, error: itemError } = await itemQuery.maybeSingle();
      if (itemError) throw itemError;

      if (existingItem) {
        // The bag already holds everything in stock — nothing more can be added
        if (existingItem.quantity >= maxStock) {
          setMessage({ text: 'You already have the maximum available in your bag.', type: 'error' });
          return;
        }
        // Never merge beyond available stock
        const newQuantity = Math.min(existingItem.quantity + quantity, maxStock);
        const { error: updateError } = await supabase
          .from('cart_items')
          .update({ quantity: newQuantity })
          .eq('id', existingItem.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from('cart_items').insert({
          cart_id: cartId,
          product_id: productId,
          quantity,
          variant_id: selectedVariant?.id ?? null,
        });
        if (insertError) throw insertError;
      }

      setMessage({ text: 'Added to your bag! 🎉', type: 'success' });
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      closeTimerRef.current = setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Error adding to cart:', err);
      setMessage({ text: 'Failed to add item. Try again.', type: 'error' });
    } finally {
      setAdding(false);
    }
  };

  if (!productId) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative z-10 bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors z-10"
          >
            <X size={20} />
          </button>

          {/* Product Header */}
          <div className="flex items-center gap-4 p-5 pb-4 border-b border-gray-100">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100">
              {productImage ? (
                <img src={productImage} alt={productName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-200">
                  <ShoppingCart size={28} />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-base leading-tight line-clamp-2 pr-8">
                {productName}
              </h3>
              <p className="text-pink-600 font-bold text-lg mt-1">
                ₱{currentPrice.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="p-5 space-y-5">
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="animate-spin text-pink-500" size={28} />
              </div>
            ) : (
              <>
                {/* Variant Selector */}
                {variants.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
                      Select Option
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {variants.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => {
                            setSelectedVariant(v);
                            if (quantity > v.stock) setQuantity(Math.max(1, v.stock));
                          }}
                          className={`px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${
                            selectedVariant?.id === v.id
                              ? 'border-pink-500 bg-pink-50 text-pink-700'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          } ${v.stock <= 0 ? 'opacity-40 pointer-events-none' : ''}`}
                        >
                          {v.name}
                          {v.stock <= 0 && <span className="ml-1 text-xs text-red-400">(sold out)</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
                    Quantity
                  </p>
                  <div
                    className={`flex items-center border-2 border-gray-200 rounded-xl w-full overflow-hidden transition-opacity ${
                      isOutOfStock ? 'opacity-40 pointer-events-none' : ''
                    }`}
                  >
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="w-12 h-11 flex items-center justify-center text-gray-500 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-30 transition-colors"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="flex-1 text-center font-bold text-gray-900">{quantity}</span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(maxStock, q + 1))}
                      disabled={quantity >= maxStock}
                      className="w-12 h-11 flex items-center justify-center text-gray-500 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-30 transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  {!isOutOfStock && (
                    <p className="text-xs text-gray-400 mt-1.5">{maxStock} available</p>
                  )}
                  {isOutOfStock && (
                    <p className="text-xs text-red-500 font-medium mt-1.5">This item is out of stock.</p>
                  )}
                </div>

                {/* Feedback */}
                <AnimatePresence>
                  {message && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`px-4 py-3 rounded-xl text-sm font-medium ${
                        message.type === 'success'
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}
                    >
                      {message.text}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Add to Cart */}
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || adding}
                  className={`w-full h-13 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-md text-base ${
                    isOutOfStock
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                      : 'bg-pink-600 text-white hover:bg-pink-700 hover:shadow-lg'
                  }`}
                >
                  {adding ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      <ShoppingCart size={20} />
                      {isOutOfStock ? 'Out of Stock' : 'Add to Bag'}
                    </>
                  )}
                </button>

                {/* View Full Product Link */}
                <button
                  onClick={() => navigate(`/product/${productId}`)}
                  className="w-full text-center text-sm text-pink-600 hover:text-pink-700 font-semibold hover:underline"
                >
                  View full product details →
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default QuickAddModal;
