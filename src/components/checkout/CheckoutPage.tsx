import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { MapPin, CreditCard, ChevronRight, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Navbar from '../common/Navbar';

const CheckoutPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // 1. Receive data from CartPage
  const { items = [], discount: initialDiscount = 0 } = location.state || {};
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [address, setAddress] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState('cod');

  // 2. Promo Code States
  const [promoCode, setPromoCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(initialDiscount);
  const [promoMessage, setPromoMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
      return;
    }
    fetchDefaultAddress();
  }, []);

  const fetchDefaultAddress = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .maybeSingle();
      setAddress(data);
    }
    setLoading(false);
  };

  const handleApplyPromo = () => {
    // Validation logic matching your CartPage
    if (promoCode.toUpperCase() === 'EDELWEISS2026') {
      setAppliedDiscount(100); 
      setPromoMessage({ text: 'Promo code applied!', type: 'success' });
    } else {
      setAppliedDiscount(0);
      setPromoMessage({ text: 'Invalid promo code', type: 'error' });
    }
  };

  const subtotal = items.reduce((acc: number, item: any) => acc + (item.products.price * item.quantity), 0);
  const shipping = 50;
  // Final total calculation
  const total = Math.max(0, subtotal + shipping - appliedDiscount);

  const handlePlaceOrder = async () => {
    setProcessing(true);
    // Order creation logic for 'orders' and 'order_items' tables
    setTimeout(() => {
      setProcessing(false);
      navigate('/profile', { state: { confetti: true } });
    }, 2000);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-pink-600" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8 text-left">
        <button onClick={() => navigate('/cart')} className="flex items-center gap-2 text-gray-500 hover:text-pink-600 mb-6 transition-colors font-medium">
          <ArrowLeft size={18} /> Back to Shopping Bag
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            
            {/* Delivery Address Section */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <MapPin size={20} className="text-[#F4898E]" /> Delivery Address
                </h2>
                <button onClick={() => navigate('/profile')} className="text-xs font-bold text-pink-600 hover:text-pink-700">Change</button>
              </div>
              
              {address ? (
                <div className="bg-pink-50/30 border border-pink-100 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-900">{address.receiver_name}</span>
                    <span className="text-gray-400 text-sm">| {address.phone_number}</span>
                  </div>
                  <p className="text-gray-500 text-sm">{address.detailed_address}, {address.barangay}, {address.city_municipality}, {address.province}</p>
                </div>
              ) : (
                <button onClick={() => navigate('/profile')} className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 font-medium hover:border-pink-300 hover:text-pink-500 transition-all">
                  + Add Delivery Address
                </button>
              )}
            </div>

            {/* Order Items Review */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Order Summary</h2>
              <div className="space-y-4">
                {items.map((item: any) => (
                  <div key={item.id} className="flex gap-4 items-center">
                    <img src={item.products.image_url} className="w-16 h-16 object-cover rounded-xl border border-gray-100" alt="" />
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800 text-sm">{item.products.name}</h4>
                      <p className="text-gray-400 text-xs">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-bold text-gray-800 text-sm">₱{(item.products.price * item.quantity).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Method Section */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <CreditCard size={20} className="text-[#F4898E]" /> Payment Method
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <PaymentOption id="cod" label="Cash on Delivery" active={paymentMethod === 'cod'} onClick={() => setPaymentMethod('cod')} />
                <PaymentOption id="gcash" label="GCash / E-Wallet" active={paymentMethod === 'gcash'} onClick={() => setPaymentMethod('gcash')} />
              </div>
            </div>
          </div>

          {/* Checkout Details Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 sticky top-24">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Payment Details</h2>

              {/* Promo Code Input Group */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">Promo Code</label>
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

              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-gray-500">
                  <span className="text-sm">Merchandise Subtotal</span>
                  <span className="font-semibold text-gray-800">₱{subtotal.toLocaleString()}</span>
                </div>
                {appliedDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="text-sm font-medium">Promo Discount</span>
                    <span className="font-semibold">-₱{appliedDiscount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-500">
                  <span className="text-sm">Shipping Total</span>
                  <span className="font-semibold text-gray-800">₱{shipping.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg pt-4 border-t border-gray-50">
                  <span className="font-bold text-gray-800">Total Payment</span>
                  <span className="font-bold text-pink-600 text-2xl">₱{total.toLocaleString()}</span>
                </div>
              </div>

              <button 
                onClick={handlePlaceOrder}
                disabled={processing || !address}
                className="w-full bg-pink-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-pink-700 transition-all shadow-xl shadow-pink-100 disabled:opacity-50 cursor-pointer"
              >
                {processing ? <Loader2 className="animate-spin" /> : "Place Order"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PaymentOption = ({ label, active, onClick }: any) => (
  <button onClick={onClick} className={`p-4 border-2 rounded-2xl text-left transition-all cursor-pointer ${active ? 'border-pink-500 bg-pink-50 text-pink-600' : 'border-gray-100 text-gray-500 hover:border-pink-200'}`}>
    <div className="flex justify-between items-center">
      <span className="font-bold text-sm">{label}</span>
      {active && <CheckCircle2 size={16} />}
    </div>
  </button>
);

export default CheckoutPage;