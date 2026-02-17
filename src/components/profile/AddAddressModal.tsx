import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { X, Loader2 } from 'lucide-react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

interface AddAddressModalProps {
  profile: any;
  onClose: () => void;
  onSuccess: () => void;
}

const AddAddressModal: React.FC<AddAddressModalProps> = ({ profile, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    receiver_name: profile?.first_name || profile?.last_name 
        ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() 
        : '',
    phone_number: profile?.phone_number || '',
    region: '',
    province: '',
    city: '',
    barangay: '',
    postal_code: '',
    detailed_address: '',
    label: 'Home',
    is_default: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      if (formData.is_default) {
        await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id);
      }

      const { error } = await supabase.from('addresses').insert([{
        user_id: user.id,
        receiver_name: formData.receiver_name,
        phone_number: formData.phone_number,
        region: formData.region,
        province: formData.province,
        city_municipality: formData.city,
        barangay: formData.barangay,
        postal_code: formData.postal_code,
        detailed_address: formData.detailed_address,
        is_default: formData.is_default,
        label: formData.label
      }]);

      if (error) throw error;
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 text-left">
      <div className="bg-white w-full max-w-2xl rounded-[24px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">New Address</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-5 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Contact Row */}
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-widest">Full Name</label>
              <input 
                type="text" required value={formData.receiver_name}
                onChange={(e) => setFormData({...formData, receiver_name: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-pink-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-widest">Phone Number</label>
              <PhoneInput
                international defaultCountry="PH"
                value={formData.phone_number}
                onChange={(val) => setFormData({...formData, phone_number: val || ''})}
                className="flex w-full border border-gray-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-pink-500 outline-none"
              />
            </div>

            {/* Region & Province Row */}
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-widest">Region</label>
              <input 
                type="text" required value={formData.region}
                placeholder="e.g. Mindanao"
                onChange={(e) => setFormData({...formData, region: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-pink-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-widest">Province</label>
              <input 
                type="text" required value={formData.province}
                placeholder="e.g. Misamis Oriental"
                onChange={(e) => setFormData({...formData, province: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-pink-500 outline-none"
              />
            </div>

            {/* City - Full Row */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-widest">City / Municipality</label>
              <input 
                type="text" required value={formData.city}
                placeholder="e.g. Cagayan De Oro City"
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-pink-500 outline-none"
              />
            </div>

            {/* Barangay & Postal Row */}
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-widest">Barangay</label>
              <input 
                type="text" required value={formData.barangay}
                placeholder="e.g. Macasandig"
                onChange={(e) => setFormData({...formData, barangay: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-pink-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-widest">Postal Code</label>
              <input 
                type="text" required value={formData.postal_code}
                placeholder="e.g. 9000"
                onChange={(e) => setFormData({...formData, postal_code: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-pink-500 outline-none"
              />
            </div>

            {/* Detailed Address - Full Row */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-widest">Street Name, Building, House No.</label>
              <textarea 
                required placeholder="e.g. Blk 22 Lot 6, Woodland Heights"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-pink-500 outline-none resize-none"
                rows={2} value={formData.detailed_address}
                onChange={(e) => setFormData({...formData, detailed_address: e.target.value})}
              />
            </div>

            {/* Default Setting */}
            <div className="md:col-span-2 flex items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <input 
                type="checkbox" id="default"
                checked={formData.is_default}
                onChange={(e) => setFormData({...formData, is_default: e.target.checked})}
                className="w-5 h-5 accent-pink-600 rounded cursor-pointer"
              />
              <label htmlFor="default" className="text-sm font-semibold text-gray-700 cursor-pointer">Set as default delivery address</label>
            </div>
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full bg-pink-600 text-white py-4 rounded-2xl font-bold hover:bg-pink-700 transition-all shadow-xl shadow-pink-100 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : "Save Address"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddAddressModal;