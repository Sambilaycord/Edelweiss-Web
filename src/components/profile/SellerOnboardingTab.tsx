import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Store, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

interface SellerOnboardingProps {
  role: 'customer' | 'shop_owner' | 'admin';
  profile: any;
  onSuccess: () => void;
}

const SellerOnboardingTab: React.FC<SellerOnboardingProps> = ({ role, profile, onSuccess }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form States
  const [shopName, setShopName] = useState('');
  const [businessPhone, setBusinessPhone] = useState(profile?.phone_number || '');
  const [description, setDescription] = useState('');

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

      onSuccess(); // Trigger parent refresh
    } catch (err: any) {
      setError(err.message || "Failed to register shop");
    } finally {
      setLoading(false);
    }
  };

  // 1. IF ALREADY A SELLER: Show Dashboard Link
  if (role === 'shop_owner') {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-600 mb-4">
          <CheckCircle2 size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">You're a Shop Owner!</h2>
        <p className="text-gray-500 mb-8 text-center max-w-sm">
          Your shop is active. You can now manage your products and view your orders.
        </p>
        <button className="bg-pink-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-pink-700 transition-all cursor-pointer">
          Manage My Products
        </button>
      </div>
    );
  }

  // 2. IF REGISTERING: Show the Form
  if (isRegistering) {
    return (
      <div className="max-w-xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Setup Your Shop</h2>
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 border border-red-100">
            <AlertCircle size={20} />
            <span className="text-sm">{error}</span>
          </div>
        )}
        <form onSubmit={handleRegisterShop} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Shop Name</label>
            <input 
              type="text" required value={shopName} onChange={(e) => setShopName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none transition-all"
              placeholder="e.g., Edelweiss Flowers & Gifts"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Business Phone (Optional)</label>
            <input 
              type="text" value={businessPhone} onChange={(e) => setBusinessPhone(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none transition-all"
              placeholder={profile?.phone_number || "Contact number for customers"}
            />
            <p className="text-xs text-gray-400 mt-1 italic">Defaults to your personal number if empty.</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
            <textarea 
              rows={4} value={description} onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none transition-all resize-none"
              placeholder="Tell customers about your shop..."
            />
          </div>
          <div className="flex gap-4 pt-4">
            <button 
              type="button" onClick={() => setIsRegistering(false)}
              className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" disabled={loading}
              className="flex-1 bg-pink-600 text-white py-3 rounded-xl font-bold hover:bg-pink-700 transition-all shadow-lg shadow-pink-200 disabled:opacity-50"
            >
              {loading ? "Launching..." : "Launch Shop"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // 3. IF CUSTOMER: Show the "Become a Seller" Ad
  return (
    <div className="flex flex-col items-center py-10">
      <div className="w-20 h-20 bg-pink-50 rounded-3xl flex items-center justify-center text-pink-600 mb-6 rotate-3">
        <Store size={40} />
      </div>
      <h2 className="text-3xl font-bold text-gray-800 mb-4">Start Selling on Edelweiss</h2>
      <p className="text-gray-500 text-center max-w-md mb-8 leading-relaxed">
        Join our community of local vendors. Showcase your products to thousands of shoppers and grow your business with our easy-to-use seller tools.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg mb-10">
        <FeatureItem text="Easy inventory management" />
        <FeatureItem text="Direct communication with buyers" />
        <FeatureItem text="Secure payment processing" />
        <FeatureItem text="Customizable shop branding" />
      </div>
      <button 
        onClick={() => setIsRegistering(true)}
        className="group flex items-center gap-2 bg-pink-600 text-white px-10 py-4 rounded-2xl font-bold hover:bg-pink-700 transition-all shadow-xl shadow-pink-100 cursor-pointer"
      >
        Open Your Shop Now <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
};

const FeatureItem = ({ text }: { text: string }) => (
  <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
    <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
    {text}
  </div>
);

export default SellerOnboardingTab;