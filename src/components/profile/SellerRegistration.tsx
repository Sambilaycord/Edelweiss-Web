import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import { ArrowLeft, Store, AlertCircle, Loader2 } from 'lucide-react';
import PhoneInput from 'react-phone-number-input'; // Added PhoneInput
import 'react-phone-number-input/style.css'; // Import styles
import bg from '../../assets/pink_bg.jpg';
import '../../styles/index.css';

const SellerRegistration: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<any>(null);

  // Form States
  const [shopName, setShopName] = useState('');
  const [businessPhone, setBusinessPhone] = useState<string | undefined>(''); // Changed to support PhoneInput
  const [description, setDescription] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) {
          setProfile(data);
          setBusinessPhone(data.phone_number || ''); 
        }
      }
    };
    fetchProfile();
  }, []);

  const handleRegisterShop = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication required");

      // 1. Create the Shop Entry
      const { error: shopError } = await supabase
        .from('shops')
        .insert([{
          owner_id: user.id,
          name: shopName,
          business_phone: businessPhone || profile?.phone_number,
          description: description,
        }]);

      if (shopError) throw shopError;

      // 2. Update Profile Role
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: 'shop_owner' })
        .eq('id', user.id);

      if (profileError) throw profileError;

      navigate('/profile', { 
        state: { 
            confetti: true, 
            message: "Congratulations! Your shop is now live." 
        } 
      });
    } catch (err: any) {
      setError(err.message || "Failed to register shop");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center p-4" style={{ backgroundImage: `url(${bg})` }}>
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="bg-white w-full max-w-2xl rounded-[20px] shadow-2xl p-10 relative overflow-hidden"
        >
          {/* Back Button */}
          <button 
            onClick={() => navigate('/profile')}
            className="absolute top-6 left-6 text-gray-400 hover:text-pink-600 transition-colors flex items-center gap-1 text-sm font-medium cursor-pointer"
          >
            <ArrowLeft size={16} /> Back
          </button>

          <div className="flex flex-col items-center mt-4">
            <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mb-6 text-pink-600">
              <Store size={32} />
            </div>

            <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
              Setup Your Shop
            </h1>
            
            <p className="text-gray-500 text-center text-sm mb-8 px-4">
              Enter your business details below to start selling on Edelweiss.
            </p>

            {error && (
              <div className="w-full bg-red-50 text-red-600 p-3 rounded-lg text-xs mb-6 border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleRegisterShop} className="w-full space-y-4">
              {/* Shop Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 ml-1">Shop Name</label>
                <input 
                  type="text" required placeholder="e.g., Edelweiss Flowers"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                  value={shopName} onChange={(e) => setShopName(e.target.value)}
                />
              </div>

              {/* Business Phone - Updated to match PersonalInfoTab */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 ml-1">Business Phone</label>
                <PhoneInput
                  international
                  defaultCountry="PH"
                  value={businessPhone}
                  onChange={setBusinessPhone}
                  className="flex w-full border border-gray-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-pink-500 outline-none transition-shadow"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 ml-1">Description</label>
                <textarea 
                  rows={3} placeholder="Tell us about your shop..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none transition-all resize-none"
                  value={description} onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <button 
                disabled={loading} 
                className="w-full bg-pink-600 text-white py-3 mt-4 rounded-xl font-bold hover:bg-pink-700 transition-all shadow-lg shadow-pink-200 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={18} /> Launching...
                  </div>
                ) : "Launch Shop"}
              </button>
            </form>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default SellerRegistration;