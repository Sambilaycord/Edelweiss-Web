import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { X, Loader2, ChevronDown } from 'lucide-react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

interface AddAddressModalProps {
  profile: any;
  addressToEdit?: any; // Added this prop to support editing
  onClose: () => void;
  onSuccess: () => void;
}

const AddAddressModal: React.FC<AddAddressModalProps> = ({ profile, addressToEdit, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  
  // 1. Initialize state: prioritize addressToEdit, then profile defaults
  const [formData, setFormData] = useState({
    receiver_name: addressToEdit?.receiver_name || 
      (profile?.first_name || profile?.last_name 
        ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() 
        : ''),
    phone_number: addressToEdit?.phone_number || profile?.phone_number || '',
    region: addressToEdit?.region || '',
    province: addressToEdit?.province || '',
    city: addressToEdit?.city_municipality || '', // Match DB column name
    barangay: addressToEdit?.barangay || '',
    postal_code: addressToEdit?.postal_code || '',
    detailed_address: addressToEdit?.detailed_address || '',
    label: addressToEdit?.label || 'Home',
    is_default: addressToEdit?.is_default || false
  });

  // 2. Sync state if addressToEdit changes while modal is open
  useEffect(() => {
    if (addressToEdit) {
      setFormData({
        receiver_name: addressToEdit.receiver_name,
        phone_number: addressToEdit.phone_number,
        region: addressToEdit.region,
        province: addressToEdit.province,
        city: addressToEdit.city_municipality,
        barangay: addressToEdit.barangay,
        postal_code: addressToEdit.postal_code,
        detailed_address: addressToEdit.detailed_address,
        label: addressToEdit.label,
        is_default: addressToEdit.is_default
      });
    }
  }, [addressToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.postal_code) {
      alert("Postal Code is required.");
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      if (formData.is_default) {
        await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id);
      }

      // 3. Prepare payload for UPSERT
      const payload = {
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
        label: formData.label,
        ...(addressToEdit?.id && { id: addressToEdit.id })
      };

      const { error } = await supabase
        .from('addresses')
        .upsert(payload); 

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
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800 tracking-widest">New Address</h2>
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
                placeholder="e.g. Juan Dela Cruz"
                onChange={(e) => setFormData({...formData, receiver_name: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-pink-500 outline-none transition-shadow"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-widest">Phone Number</label>
              <PhoneInput
                international defaultCountry="PH"
                value={formData.phone_number}
                onChange={(val) => setFormData({...formData, phone_number: val || ''})}
                className="flex w-full border border-gray-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-pink-500 outline-none transition-shadow"
              />
            </div>

            {/* Region & Province Row */}
            <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-widest">Region</label>
                <div className="relative">
                    <select 
                    required
                    value={formData.region}
                    onChange={(e) => setFormData({...formData, region: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-pink-500 outline-none bg-white cursor-pointer transition-all appearance-none pr-12"
                    >
                    <option value="" disabled>Select Region</option>
                    <option value="Metro Manila">Metro Manila</option>
                    <option value="Mindanao">Mindanao</option>
                    <option value="North Luzon">North Luzon</option>
                    <option value="South Luzon">South Luzon</option>
                    <option value="Visayas">Visayas</option>
                    </select>
                    
                    {/* This icon replaces the browser default and is positioned 16px (right-4) from the edge */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <ChevronDown size={18} />
                    </div>
                </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-widest">Province</label>
              <input 
                type="text" required value={formData.province}
                placeholder="e.g. Benguet"
                onChange={(e) => setFormData({...formData, province: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-pink-500 outline-none transition-shadow"
              />
            </div>

            {/* City - Full Row */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-widest">City / Municipality</label>
              <input 
                type="text" required value={formData.city}
                placeholder="e.g. Quezon City"
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-pink-500 outline-none transition-shadow"
              />
            </div>

            {/* Barangay & Postal Row */}
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-widest">Barangay</label>
              <input 
                type="text" required value={formData.barangay}
                placeholder="e.g. San Lorenzo"
                onChange={(e) => setFormData({...formData, barangay: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-pink-500 outline-none transition-shadow"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-widest">Postal Code</label>
              <input 
                type="text" required value={formData.postal_code}
                placeholder="e.g. 1100"
                onChange={(e) => setFormData({...formData, postal_code: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-pink-500 outline-none transition-shadow"
              />
            </div>

            {/* Detailed Address - Full Row */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-widest">Street Name, Building, House No.</label>
              <textarea 
                required placeholder="e.g. 123 Orchid St, Greenview Subdivision"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-pink-500 outline-none resize-none transition-shadow"
                rows={2} value={formData.detailed_address}
                onChange={(e) => setFormData({...formData, detailed_address: e.target.value})}
              />
            </div>

            {/* Default Setting */}
            <div className="md:col-span-2 flex items-center gap-3 bg-pink-50/30 p-4 rounded-xl border border-pink-100">
              <input 
                type="checkbox" id="default"
                checked={formData.is_default}
                onChange={(e) => setFormData({...formData, is_default: e.target.checked})}
                className="w-5 h-5 accent-pink-600 rounded cursor-pointer"
              />
              <label htmlFor="default" className="text-sm font-semibold text-pink-700 cursor-pointer">Set as default delivery address</label>
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