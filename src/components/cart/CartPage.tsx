import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Loader2, Store, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../common/Navbar';

const CartPage: React.FC = () => {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<string[]>([]); 
  const navigate = useNavigate();

  const [promoCode, setPromoCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [promoMessage, setPromoMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: cartData } = await supabase
          .from('carts')
          .select('id')
          .eq('customer_id', user.id)
          .maybeSingle();

        if (cartData) {
          const { data: items } = await supabase
            .from('cart_items')
            .select(`id, quantity, product_id, products (name, price, image_url, shop_name)`)
            .eq('cart_id', cartData.id);

          if (items && items.length > 0) {
            setCartItems(items);
            setSelectedItems(items.map(item => item.id)); 
            setLoading(false);
            return;
          }
        }
      }

      // Mock data for testing
      const mockItems = [
        {
          id: 'mock-1',
          quantity: 1,
          products: { name: 'Classic White Edelweiss Tee', price: 899, image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200', shop_name: 'Edelweiss Official' }
        },
        {
          id: 'mock-2',
          quantity: 2,
          products: { name: 'Pink Linen Shorts', price: 1200, image_url: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=200', shop_name: 'Summer Bloom' }
        }
      ];
      setCartItems(mockItems);
      setSelectedItems(mockItems.map(m => m.id));
    } catch (err) {
      console.error("Error fetching cart:", err);
    } finally {
      setLoading(false);
    }
  };

  const groupedItems = cartItems.reduce((acc: any, item) => {
    const shop = item.products?.shop_name || "Unknown Shop";
    if (!acc[shop]) acc[shop] = [];
    acc[shop].push(item);
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

  const toggleShopSelection = (shopName: string) => {
    const shopItemIds = groupedItems[shopName].map((i: any) => i.id);
    const allShopSelected = shopItemIds.every((id: string) => selectedItems.includes(id));

    if (allShopSelected) {
      setSelectedItems(prev => prev.filter(id => !shopItemIds.includes(id)));
    } else {
      setSelectedItems(prev => [...new Set([...prev, ...shopItemIds])]);
    }
  };

  const updateQuantity = async (id: string, newQty: number) => {
    if (newQty < 1) return;
    const { error } = await supabase.from('cart_items').update({ quantity: newQty }).eq('id', id);
    if (!error) fetchCart();
  };

  const removeItem = async (id: string) => {
    const { error } = await supabase.from('cart_items').delete().eq('id', id);
    if (!error) {
      setSelectedItems(prev => prev.filter(itemId => itemId !== id));
      fetchCart();
    }
  };

  const handleApplyPromo = () => {
  // Mock validation logic
  if (promoCode.toUpperCase() === 'EDELWEISS2026') {
    setAppliedDiscount(100); // Flat ₱100 off
    setPromoMessage({ text: 'Promo code applied!', type: 'success' });
  } else {
    setAppliedDiscount(0);
    setPromoMessage({ text: 'Invalid promo code', type: 'error' });
  }
};

  const selectedCartData = cartItems.filter(item => selectedItems.includes(item.id));
  const subtotal = selectedCartData.reduce((acc, item) => acc + (item.products?.price * item.quantity), 0);
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
              {Object.keys(groupedItems).map((shopName) => (
                <div key={shopName} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  
                  {/* Shop Header Section */}
                  <div className=" px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                    <input 
                      type="checkbox"
                      checked={groupedItems[shopName].every((item: any) => selectedItems.includes(item.id))}
                      onChange={() => toggleShopSelection(shopName)}
                      className="w-5 h-5 accent-pink-600 rounded cursor-pointer"
                    />
                    <button 
                      onClick={() => navigate(`/shop/${shopName.toLowerCase().replace(/\s+/g, '-')}`)}
                      className="flex items-center gap-1.5 text-gray-800 hover:text-pink-600 transition-colors group cursor-pointer"
                    >
                      <Store size={18} className="text-[#F4898E]" />
                      <span className="font-semibold text-sm uppercase tracking-widest">{shopName}</span>
                      <ChevronRight size={16} className="text-gray-400 group-hover:text-pink-600 transition-colors" />
                    </button>
                  </div>

                  {/* Product List with Internal Dividers */}
                  <div className="divide-y divide-gray-50">
                    {groupedItems[shopName].map((item: any) => (
                      <div key={item.id} className="p-5 flex gap-5 items-center transition-colors hover:bg-gray-50/30">
                        <input 
                          type="checkbox" 
                          checked={selectedItems.includes(item.id)}
                          onChange={() => toggleItemSelection(item.id)}
                          className="w-5 h-5 accent-pink-600 rounded cursor-pointer"
                        />
                        <img 
                          src={item.products?.image_url} 
                          className="w-24 h-24 object-cover rounded-xl border border-gray-100" 
                          alt={item.products?.name} 
                        />
                        <div className="flex-1 text-left">
                          <h3 className="text-gray-800 text-base mb-1">{item.products?.name}</h3>
                          <p className="text-pink-600 font-semibold text-lg">₱{item.products?.price.toLocaleString()}</p>
                          <div className="flex items-center gap-4 mt-3">
                            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
                              <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1.5 hover:bg-gray-50 cursor-pointer"><Minus size={14}/></button>
                              <span className="px-4 font-bold text-sm text-gray-700">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1.5 hover:bg-gray-50 cursor-pointer"><Plus size={14}/></button>
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
                        className="bg-[#F4898E] text-white px-6 py-2 text-sm font-bold hover:bg-pink-700 transition-colors cursor-pointer"
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
                  onClick={() => navigate('/checkout', { state: { items: selectedCartData } })}
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