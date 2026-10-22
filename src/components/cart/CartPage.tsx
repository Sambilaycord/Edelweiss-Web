import React, { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Loader2, Store, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../common/Navbar';

interface CartVariant {
  id: string;
  name: string;
  price: number;
  stock?: number | null;
}

interface CartItem {
  id: string;
  quantity: number;
  product_id: string;
  variant_id: string | null;
  products: {
    id: string;
    name: string;
    price: number;
    stock?: number | null;
    image_urls: string[] | null;
    shops: { id: string; name: string } | null;
    product_variants: CartVariant[] | null;
  } | null;
  product_variants: CartVariant | null;
}

interface ShopGroup {
  name: string;
  items: CartItem[];
}

const CartPage: React.FC = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [updatingVariant, setUpdatingVariant] = useState(false);
  const navigate = useNavigate();
  // Tracks whether the initial load has happened, so background refreshes keep the user's selection
  const hasLoadedRef = useRef(false);

  const [promoCode, setPromoCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [appliedPromoCode, setAppliedPromoCode] = useState('');
  const [promoMessage, setPromoMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const fetchCart = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      let items: CartItem[] = [];
      if (user) {
        const { data: cartData, error: cartError } = await supabase
          .from('carts')
          .select('id')
          .eq('customer_id', user.id)
          .maybeSingle();
        if (cartError) throw cartError;

        if (cartData) {
          const { data, error: itemsError } = await supabase
            .from('cart_items')
            .select(`
                id, 
                quantity, 
                product_id, 
                variant_id,
                products (
                    id, 
                    name, 
                    price, 
                    stock,
                    image_urls,
                    shops (id, name),
                    product_variants (id, name, price, stock)
                ),
                product_variants (
                    id,
                    name,
                    price,
                    stock
                )
            `)
            .eq('cart_id', cartData.id);
          if (itemsError) throw itemsError;
          items = (data as unknown as CartItem[] | null) || [];
        }
      }

      setCartItems(items);
      const ids = items.map(item => item.id);
      if (!hasLoadedRef.current) {
        // First load: select everything
        setSelectedItems(ids);
      } else {
        // Background refresh: keep the user's selection, dropping items that no longer exist
        setSelectedItems(prev => prev.filter(id => ids.includes(id)));
      }
      hasLoadedRef.current = true;
    } catch (err) {
      console.error("Error fetching cart:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const groupedItems = cartItems.reduce((acc: Record<string, ShopGroup>, item) => {
    const shopId = item.products?.shops?.id || "unknown";
    const shopName = item.products?.shops?.name || "Unknown Shop";
    if (!acc[shopId]) acc[shopId] = { name: shopName, items: [] };
    acc[shopId].items.push(item);
    return acc;
  }, {});

  const toggleItemSelection = (id: string) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === cartItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(cartItems.map(item => item.id));
    }
  };

  const toggleShopSelection = (shopId: string) => {
    const shopItemIds = groupedItems[shopId].items.map(i => i.id);
    const allShopSelected = shopItemIds.every(id => selectedItems.includes(id));

    if (allShopSelected) {
      setSelectedItems(prev => prev.filter(id => !shopItemIds.includes(id)));
    } else {
      setSelectedItems(prev => [...new Set([...prev, ...shopItemIds])]);
    }
  };

  // Latest quantity the user asked for per item, and which items currently have a write in flight.
  // Writes are serialized per item so rapid +/- clicks can't land in the DB out of order.
  const pendingQtyRef = useRef<Record<string, number>>({});
  const syncingRef = useRef<Set<string>>(new Set());

  const syncQuantity = async (id: string) => {
    if (syncingRef.current.has(id)) return;
    syncingRef.current.add(id);
    try {
      while (pendingQtyRef.current[id] !== undefined) {
        const qty = pendingQtyRef.current[id];
        const { error } = await supabase.from('cart_items').update({ quantity: qty }).eq('id', id);
        if (error) {
          console.error(error);
          delete pendingQtyRef.current[id];
          fetchCart(); // Revert on sync failure
          break;
        }
        if (pendingQtyRef.current[id] === qty) delete pendingQtyRef.current[id];
      }
    } finally {
      syncingRef.current.delete(id);
    }
  };

  // Untracked (null) or zero stock doesn't cap the stepper; place_order enforces stock at checkout
  const stockCap = (stock: number | null | undefined) =>
    typeof stock === 'number' && stock > 0 ? stock : Infinity;

  const getMaxQuantity = (item: CartItem) =>
    stockCap(item.variant_id ? item.product_variants?.stock : item.products?.stock);

  const updateQuantity = (item: CartItem, newQty: number) => {
    if (newQty < 1 || newQty > getMaxQuantity(item)) return;

    // Optimistic UI Update
    setCartItems(prev => prev.map(i => i.id === item.id ? { ...i, quantity: newQty } : i));

    // Background sync
    pendingQtyRef.current[item.id] = newQty;
    syncQuantity(item.id);
  };

  const removeItem = async (id: string) => {
    // Optimistic UI Update
    setCartItems(prev => prev.filter(item => item.id !== id));
    setSelectedItems(prev => prev.filter(itemId => itemId !== id));
    delete pendingQtyRef.current[id];

    // Background sync
    const { error } = await supabase.from('cart_items').delete().eq('id', id);
    if (error) {
      console.error(error);
      fetchCart(); // Revert on sync failure
    }
  };

  const handleUpdateVariant = async (itemId: string, newVariantId: string) => {
    if (updatingVariant) return;
    const item = cartItems.find(i => i.id === itemId);
    if (!item) return;
    if (item.variant_id === newVariantId) {
      setEditingItemId(null);
      return;
    }

    setUpdatingVariant(true);
    try {
      // Check if another item with the same product and NEW variant already exists
      const existingMatch = cartItems.find(i =>
        i.product_id === item.product_id &&
        i.variant_id === newVariantId &&
        i.id !== itemId
      );

      const newVariant = item.products?.product_variants?.find(v => v.id === newVariantId);
      const maxForNewVariant = stockCap(newVariant?.stock);

      if (existingMatch) {
        // Merge: Update existing item quantity (never beyond the variant's stock) and delete current item
        const mergedQty = Math.max(1, Math.min(existingMatch.quantity + item.quantity, maxForNewVariant));
        const { error: updateError } = await supabase
          .from('cart_items')
          .update({ quantity: mergedQty })
          .eq('id', existingMatch.id);
        if (updateError) throw updateError;

        const { error: deleteError } = await supabase.from('cart_items').delete().eq('id', itemId);
        if (deleteError) throw deleteError;

        // Carry the selection over to the merged row
        setSelectedItems(prev =>
          prev.includes(itemId)
            ? [...new Set([...prev.filter(id => id !== itemId), existingMatch.id])]
            : prev
        );
      } else {
        // Simple update (clamp the quantity to the new variant's stock)
        const { error } = await supabase
          .from('cart_items')
          .update({ variant_id: newVariantId, quantity: Math.max(1, Math.min(item.quantity, maxForNewVariant)) })
          .eq('id', itemId);
        if (error) throw error;
      }
    } catch (err) {
      console.error('Error updating variant:', err);
    } finally {
      setEditingItemId(null);
      setUpdatingVariant(false);
      fetchCart();
    }
  };

  const handleApplyPromo = () => {
    // Mock validation logic
    const code = promoCode.trim().toUpperCase();
    if (code === 'EDELWEISS2026') {
      setAppliedDiscount(100); // Flat ₱100 off
      setAppliedPromoCode(code);
      setPromoMessage({ text: 'Promo code applied!', type: 'success' });
    } else {
      setAppliedDiscount(0);
      setAppliedPromoCode('');
      setPromoMessage({ text: 'Invalid promo code', type: 'error' });
    }
  };

  const selectedCartData = cartItems.filter(item => selectedItems.includes(item.id));
  const subtotal = selectedCartData.reduce((acc, item) => {
    const itemPrice = item.product_variants?.price ?? item.products?.price ?? 0;
    return acc + (itemPrice * item.quantity);
  }, 0);
  const shipping = selectedItems.length > 0 ? 50 : 0;
  const total = Math.max(0, subtotal + shipping - appliedDiscount);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-pink-600" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-3 text-left">
          <ShoppingBag className="text-[#F4898E]" /> Shopping Bag
        </h1>

        {cartItems.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
            <ShoppingBag size={80} className="mx-auto text-gray-100 mb-6" />
            <p className="text-gray-400 text-lg mb-8 font-medium">Your bag is empty.</p>
            <button onClick={() => navigate('/')} className="bg-pink-600 text-white px-8 py-3 rounded-full font-bold hover:bg-pink-700 transition-all shadow-lg shadow-pink-100 cursor-pointer">
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">

              {/* Global Select All */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedItems.length === cartItems.length && cartItems.length > 0}
                  onChange={toggleSelectAll}
                  className="w-5 h-5 accent-pink-600 rounded cursor-pointer"
                />
                <span className="text-sm font-semibold text-gray-700">Select All Items ({cartItems.length})</span>
              </div>

              {/* Grouped Shop Containers */}
              {Object.entries(groupedItems).map(([shopId, shopData]) => (
                <div key={shopId} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

                  {/* Shop Header Section */}
                  <div className=" px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={shopData.items.every(item => selectedItems.includes(item.id))}
                      onChange={() => toggleShopSelection(shopId)}
                      className="w-5 h-5 accent-pink-600 rounded cursor-pointer"
                    />
                    <button
                      onClick={() => navigate(`/shop/${shopId}`)}
                      className="flex items-center gap-1.5 text-gray-800 hover:text-pink-600 transition-colors group cursor-pointer"
                    >
                      <Store size={18} className="text-[#F4898E]" />
                      <span className="font-semibold text-sm uppercase tracking-widest">{shopData.name}</span>
                      <ChevronRight size={16} className="text-gray-400 group-hover:text-pink-600 transition-colors" />
                    </button>
                  </div>

                  {/* Product List with Internal Dividers */}
                  <div className="divide-y divide-gray-50">
                    {shopData.items.map(item => (
                      <div key={item.id} className="p-5 flex gap-5 items-center transition-colors hover:bg-gray-50/30">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.id)}
                          onChange={() => toggleItemSelection(item.id)}
                          className="w-5 h-5 accent-pink-600 rounded cursor-pointer"
                        />
                        <img
                          src={item.products?.image_urls?.[0]}
                          className="w-24 h-24 object-cover rounded-xl border border-gray-100"
                          alt={item.products?.name}
                        />
                        <div className="flex-1 text-left">
                          <div className="flex justify-between items-start mb-1">
                            <h3 
                              onClick={() => navigate(`/product/${item.product_id}`)}
                              className="text-gray-800 text-base font-semibold hover:text-pink-600 cursor-pointer transition-colors"
                            >
                              {item.products?.name}
                            </h3>
                            <p className="text-pink-600 font-medium text-lg">
                              ₱{((item.product_variants?.price ?? item.products?.price ?? 0) * item.quantity).toLocaleString()}
                            </p>
                          </div>

                          {editingItemId === item.id ? (
                            <div className="mb-2 mt-2">
                              <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest block mb-1">Select Variant</label>
                              <div className="flex flex-wrap gap-2">
                                {item.products?.product_variants?.map(v => (
                                  <button
                                    key={v.id}
                                    onClick={() => handleUpdateVariant(item.id, v.id)}
                                    disabled={updatingVariant}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${item.variant_id === v.id
                                      ? 'bg-pink-600 text-white border-pink-600'
                                      : 'bg-white text-gray-600 border-gray-200 hover:border-pink-300'
                                      }`}
                                  >
                                    {v.name}
                                  </button>
                                ))}
                                <button
                                  onClick={() => setEditingItemId(null)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-400 hover:text-gray-600"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 mb-1">
                              <p className="text-sm text-gray-500">Variant: </p>
                              <button
                                onClick={() => (item.products?.product_variants?.length ?? 0) > 0 && setEditingItemId(item.id)}
                                className={`text-sm text-pink-600 font-medium ${(item.products?.product_variants?.length ?? 0) > 0 ? 'underline hover:text-pink-700 cursor-pointer' : 'no-underline cursor-default'}`}
                              >
                                {item.product_variants?.name || "Default"}
                              </button>
                            </div>
                          )}


                          <div className="flex items-center gap-4 mt-3">
                            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
                              <button onClick={() => updateQuantity(item, item.quantity - 1)} className="p-1.5 hover:bg-gray-50 cursor-pointer"><Minus size={14} /></button>
                              <span className="px-4 font-medium text-sm text-gray-700">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item, item.quantity + 1)} className="p-1.5 hover:bg-gray-50 cursor-pointer"><Plus size={14} /></button>
                            </div>
                            <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700 transition-colors cursor-pointer p-1">
                              <Trash2 size={20} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 sticky top-24">
                <h2 className="text-xl font-bold text-gray-800 mb-6 text-left">Order Summary</h2>
                <div className="space-y-4 mb-6">
                  <div className="mb-6">
                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest text-left">Promo Code</label>
                    <div className="flex border border-gray-300 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-pink-500 transition-all">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        placeholder="Promo Code"
                        className="flex-1 px-4 py-2 text-sm outline-none bg-transparent"
                      />
                      <button
                        onClick={handleApplyPromo}
                        className="bg-black text-white px-6 py-2 text-sm font-bold hover:bg-pink-700 transition-colors cursor-pointer"
                      >
                        Submit
                      </button>
                    </div>
                    {promoMessage && (
                      <p className={`text-[10px] mt-2 font-bold ${promoMessage.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                        {promoMessage.text}
                      </p>
                    )}
                  </div>
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between text-gray-500">
                      <span className="text-sm">Subtotal</span>
                      <span className="font-semibold text-gray-800">₱{subtotal.toLocaleString()}</span>
                    </div>

                    {/* Discount Row (Conditional) */}
                    {appliedDiscount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span className="text-sm">Discount</span>
                        <span className="font-semibold">-₱{appliedDiscount.toLocaleString()}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-gray-500 border-b border-gray-50 pb-4">
                      <span className="text-sm">Shipping Fee</span>
                      <span className="font-semibold text-gray-800">₱{shipping.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-lg">
                      <span className="font-bold text-gray-800">Total</span>
                      <span className="font-bold text-pink-600">₱{total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/checkout', { state: { items: selectedCartData, discount: appliedDiscount, promoCode: appliedPromoCode } })}
                  disabled={selectedItems.length === 0}
                  className="w-full bg-pink-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-pink-700 transition-all shadow-xl shadow-pink-100 cursor-pointer disabled:opacity-50"
                >
                  Proceed to Checkout ({selectedItems.length}) <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;