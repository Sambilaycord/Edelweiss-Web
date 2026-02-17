import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../common/Navbar';

const CartPage: React.FC = () => {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // 1. Retrieve the user's specific cart ID
      const { data: cartData } = await supabase
        .from('carts')
        .select('id')
        .eq('customer_id', user.id)
        .maybeSingle();

      if (cartData) {
        // 2. Fetch items linked to that cart and join product details
        const { data: items } = await supabase
          .from('cart_items')
          .select(`
            id,
            quantity,
            product_id,
            products (
              name,
              price,
              image_url
            )
          `)
          .eq('cart_id', cartData.id);

        setCartItems(items || []);
      }
    }
    setLoading(false);
  };

  const updateQuantity = async (id: string, newQty: number) => {
    if (newQty < 1) return;
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity: newQty })
      .eq('id', id);
    if (!error) fetchCart();
  };

  const removeItem = async (id: string) => {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', id);
    if (!error) fetchCart();
  };

  // Pricing calculations
  const subtotal = cartItems.reduce((acc, item) => acc + (item.products?.price * item.quantity), 0);
  const shipping = cartItems.length > 0 ? 50 : 0; 
  const total = subtotal + shipping;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-pink-600" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-3">
          <ShoppingBag className="text-pink-600" /> Shopping Bag
        </h1>

        {cartItems.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
            <ShoppingBag size={80} className="mx-auto text-gray-100 mb-6" />
            <p className="text-gray-400 text-lg mb-8 font-medium">Your bag is empty.</p>
            <button 
              onClick={() => navigate('/')}
              className="bg-pink-600 text-white px-8 py-3 rounded-full font-bold hover:bg-pink-700 transition-all shadow-lg shadow-pink-100 cursor-pointer"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* List of items in cart_items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4 items-center">
                  <img src={item.products?.image_url} className="w-24 h-24 object-cover rounded-xl" alt={item.products?.name} />
                  <div className="flex-1 text-left">
                    <h3 className="font-bold text-gray-800">{item.products?.name}</h3>
                    <p className="text-pink-600 font-bold">₱{item.products?.price.toLocaleString()}</p>
                    
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center border border-gray-200 rounded-lg">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 hover:bg-gray-50 cursor-pointer"><Minus size={14}/></button>
                        <span className="px-4 font-bold text-sm">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 hover:bg-gray-50 cursor-pointer"><Plus size={14}/></button>
                      </div>
                      <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-500 transition-colors cursor-pointer">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Panel */}
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 sticky top-24">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Order Summary</h2>
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal</span>
                    <span className="font-bold text-gray-800">₱{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-500 border-b border-gray-50 pb-4">
                    <span>Shipping Fee</span>
                    <span className="font-bold text-gray-800">₱{shipping.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span className="font-bold text-gray-800">Total</span>
                    <span className="font-extrabold text-pink-600">₱{total.toLocaleString()}</span>
                  </div>
                </div>
                <button 
                  onClick={() => navigate('/checkout')}
                  className="w-full bg-pink-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-pink-700 transition-all shadow-xl shadow-pink-100 cursor-pointer"
                >
                  Proceed to Checkout <ArrowRight size={20} />
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