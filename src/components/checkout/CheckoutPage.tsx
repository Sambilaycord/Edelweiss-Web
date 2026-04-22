import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { MapPin, CreditCard, ChevronDown, ChevronUp, Loader2, ArrowLeft, CheckCircle2, ChevronRight, Plus, Mail, MessageSquare, X } from 'lucide-react';
import Navbar from '../common/Navbar';

const CheckoutPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { items = [], discount: initialDiscount = 0 } = location.state || {};
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAllAddresses, setShowAllAddresses] = useState(false); 
  const [paymentMethod, setPaymentMethod] = useState('cod');

  // Leave a Message States
  const [showMessageOptions, setShowMessageOptions] = useState(false);
  const [messageType, setMessageType] = useState<'free' | 'envelope'>('free');
  const [personalMessage, setPersonalMessage] = useState('');

  const [promoCode, setPromoCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(initialDiscount);
  const [promoMessage, setPromoMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (items.length === 0) { navigate('/cart'); return; }
    fetchAllAddresses();

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowAllAddresses(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [items, navigate]);

  const fetchAllAddresses = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });
      
      setAddresses(data || []);
      const defaultAddr = data?.find(a => a.is_default) || data?.[0];
      if (defaultAddr) setSelectedAddressId(defaultAddr.id);
    }
    setLoading(false);
  };

  const activeAddress = addresses.find(a => a.id === selectedAddressId);
  const otherAddresses = addresses.filter(a => a.id !== selectedAddressId);

  const handleApplyPromo = () => {
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
  
  // Logic: Fee only applies if Options are visible AND Envelope is chosen
  const addonFee = (showMessageOptions && messageType === 'envelope') ? 10 : 0;
  const total = Math.max(0, subtotal + shipping + addonFee - appliedDiscount);

  const handlePlaceOrder = async () => {
    setProcessing(true);
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
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 relative" ref={dropdownRef}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <MapPin size={22} className="text-[#F4898E]" /> Delivery Address
                </h2>
                <button 
                  onClick={() => navigate('/profile', { state: { activeTab: 'address' } })}
                  className="text-sm font-semibold text-pink-600 hover:underline flex items-center gap-1 cursor-pointer transition-all"
                >
                  Manage Addresses <ChevronRight size={14} />
                </button>
              </div>
              
              {activeAddress ? (
                <div className="space-y-2">
                  <div className="bg-pink-50/30 border-2 border-pink-500 rounded-2xl p-6 transition-all">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-900">{activeAddress.receiver_name}</span>
                      <span className="text-gray-400 text-sm">| {activeAddress.phone_number}</span>
                      {activeAddress.is_default && (
                        <span className="text-[9px] bg-pink-100 text-pink-600 px-1.5 py-0.5 rounded-full font-bold uppercase">Default</span>
                      )}
                    </div>
                    <p className="text-gray-500 text-sm leading-relaxed pr-24">
                      {activeAddress.detailed_address}, {activeAddress.barangay}, {activeAddress.city_municipality}, {activeAddress.province}
                    </p>
                  </div>

                  <div className="flex justify-end px-1">
                    <button 
                      onClick={() => setShowAllAddresses(!showAllAddresses)}
                      className="flex items-center gap-1 text-[10px] mt-2 font-semibold text-pink-600 hover:text-pink-700 uppercase tracking-widest cursor-pointer transition-all"
                    >
                      {showAllAddresses ? "Show Less" : "Show More"}
                      {showAllAddresses ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>

                  {showAllAddresses && (
                    <div className="grid grid-cols-1 gap-3 mt-4 animate-in slide-in-from-top-2 duration-200">
                      {otherAddresses.map((addr) => (
                        <button 
                          key={addr.id}
                          onClick={() => {
                            setSelectedAddressId(addr.id);
                            setShowAllAddresses(false);
                          }}
                          className="text-left p-5 border border-gray-100 rounded-2xl hover:border-pink-200 hover:bg-pink-50 transition-all bg-white flex justify-between items-center group cursor-pointer"
                        >
                          <div className="space-y-1">
                            <p className="font-bold text-gray-800 text-sm">
                              {addr.receiver_name} <span className="text-gray-400 font-normal text-xs">| {addr.phone_number}</span>
                            </p>
                            <p className="text-gray-500 text-xs truncate max-w-sm">{addr.detailed_address}, {addr.barangay}</p>
                          </div>
                          <div className="text-gray-200 group-hover:text-pink-300 transition-colors">
                            <CheckCircle2 size={18} />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <button onClick={() => navigate('/profile', { state: { activeTab: 'address' } })} className="w-full py-10 border-2 border-dashed border-gray-200 rounded-3xl text-gray-400 font-bold hover:border-pink-300 hover:text-pink-500 transition-all flex flex-col items-center gap-3">
                  <Plus size={32} /> Add a Delivery Address
                </button>
              )}
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Order Items</h2>
              <div className="divide-y divide-gray-50">
                {items.map((item: any) => (
                  <div key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0 items-center">
                    <img src={item.products.image_url} className="w-16 h-16 object-cover rounded-xl border border-gray-100" alt="" />
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800 text-sm">{item.products.name}</h4>
                      <p className="text-gray-400 text-xs mt-0.5">Quantity: {item.quantity}</p>
                    </div>
                    <p className="font-bold text-gray-800 text-sm">₱{(item.products.price * item.quantity).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Leave a Message Section (Updated) */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 transition-all overflow-hidden">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <MessageSquare size={22} className="text-[#F4898E]" /> Leave a Message
                </h2>
                {!showMessageOptions ? (
                  <button 
                    onClick={() => setShowMessageOptions(true)}
                    className="flex items-center gap-1 text-sm font-semibold text-pink-600 hover:text-pink-700 cursor-pointer"
                  >
                    Show Options <ChevronDown size={14} />
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      setShowMessageOptions(false);
                      setPersonalMessage(''); // Optional: reset message on cancel
                    }}
                    className="flex items-center gap-1 text-sm font-semibold text-gray-400 hover:text-red-500 cursor-pointer"
                  >
                    Cancel <X size={14} />
                  </button>
                )}
              </div>
              
              {showMessageOptions && (
                <div className="mt-8 space-y-6 animate-in slide-in-from-top-4 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button onClick={() => setMessageType('free')} className={`p-4 border-2 rounded-2xl text-left transition-all flex justify-between items-center ${messageType === 'free' ? 'border-pink-500 bg-pink-50 text-pink-600' : 'border-gray-100 text-gray-500 hover:border-pink-100 cursor-pointer'}`}>
                      <div>
                        <p className="font-bold text-sm">Simple Card</p>
                        <p className="text-[10px] uppercase font-bold tracking-tight opacity-60">Free</p>
                      </div>
                      {messageType === 'free' && <CheckCircle2 size={18} />}
                    </button>
                    <button onClick={() => setMessageType('envelope')} className={`p-4 border-2 rounded-2xl text-left transition-all flex justify-between items-center ${messageType === 'envelope' ? 'border-pink-500 bg-pink-50 text-pink-600' : 'border-gray-100 text-gray-500 hover:border-pink-100 cursor-pointer'}`}>
                      <div className="flex gap-3 items-center">
                        <Mail size={20} className={messageType === 'envelope' ? 'text-pink-600' : 'text-gray-300'} />
                        <div>
                          <p className="font-bold text-sm">Card with Envelope</p>
                          <p className="text-[10px] uppercase font-bold tracking-tight opacity-60">+₱10.00</p>
                        </div>
                      </div>
                      {messageType === 'envelope' && <CheckCircle2 size={18} />}
                    </button>
                  </div>
                  <textarea 
                    value={personalMessage}
                    onChange={(e) => setPersonalMessage(e.target.value)}
                    placeholder="Write your message here..."
                    className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-pink-500 outline-none transition-all resize-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Payment & Summary */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 sticky top-24">
              <div className="mb-8 text-left">
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <CreditCard size={22} className="text-[#F4898E]" /> Payment Method
                </h2>
                <div className="space-y-3">
                  <PaymentOption id="cod" label="Cash on Delivery" active={paymentMethod === 'cod'} onClick={() => setPaymentMethod('cod')} />
                  <PaymentOption id="gcash" label="GCash / E-Wallet" active={paymentMethod === 'gcash'} onClick={() => setPaymentMethod('gcash')} />
                </div>
              </div>

              <div className="mb-8 border-t border-gray-50 pt-8 text-left">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Payment Details</h2>
                <div className="mb-6">
                  <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-[0.2em]">Promo Code</label>
                  <div className="flex border border-gray-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-pink-500 transition-all">
                    <input 
                      type="text" 
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="Enter code"
                      className="flex-1 px-4 py-3 text-sm outline-none bg-transparent"
                    />
                    <button onClick={handleApplyPromo} className="bg-black text-white px-6 py-2 text-xs font-bold hover:bg-gray-800 transition-colors cursor-pointer">Apply</button>
                  </div>
                  {promoMessage && <p className={`text-[10px] mt-2 font-bold ${promoMessage.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>{promoMessage.text}</p>}
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-gray-500">
                    <span className="text-sm">Merchandise Subtotal</span>
                    <span className="font-semibold text-gray-800">₱{subtotal.toLocaleString()}</span>
                  </div>
                  
                  {/* Conditional Message Envelope Fee */}
                  {showMessageOptions && (
                    <div className="flex justify-between text-gray-500">
                      <span className="text-sm">Message Envelope</span>
                      <span className="font-semibold text-gray-800">
                        {addonFee === 0 ? (
                          <span className="uppercase text-sm font-bold tracking-wider">Free</span>
                        ) : (
                          `₱${addonFee.toLocaleString()}`
                        )}
                      </span>
                    </div>
                  )}

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
                  <div className="flex justify-between items-end pt-6 border-t border-gray-50">
                    <span className="font-bold text-gray-800">Total Payment</span>
                    <span className="font-bold text-pink-600 text-3xl">₱{total.toLocaleString()}</span>
                  </div>
                </div>

                <button 
                  onClick={handlePlaceOrder}
                  disabled={processing || !selectedAddressId}
                  className="w-full bg-pink-600 text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-pink-700 transition-all shadow-xl shadow-pink-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {processing ? <Loader2 className="animate-spin" /> : "Place Order"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PaymentOption = ({ label, active, onClick }: any) => (
  <button onClick={onClick} className={`w-full p-4 border-2 rounded-2xl text-left transition-all cursor-pointer group ${active ? 'border-pink-500 bg-pink-50' : 'border-gray-100 text-gray-500 hover:border-pink-100'}`}>
    <div className="flex justify-between items-center">
      <span className={`font-bold text-sm ${active ? 'text-pink-600' : 'text-gray-600'}`}>{label}</span>
      {active ? <CheckCircle2 size={18} className="text-pink-600" /> : <div className="w-[18px] h-[18px] border-2 border-gray-100 rounded-full group-hover:border-pink-200" />}
    </div>
  </button>
);

export default CheckoutPage;