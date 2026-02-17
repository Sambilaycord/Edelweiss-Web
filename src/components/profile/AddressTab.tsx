import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { MapPin, Plus, Trash2, Loader2 } from 'lucide-react';

import AddAddressModal from './AddAddressModal';

// Define the props interface to accept the profile from the parent
interface AddressTabProps {
  profile: any;
}

const AddressTab: React.FC<AddressTabProps> = ({ profile }) => {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    setLoading(true); // Show loader while refreshing
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });
      setAddresses(data || []);
    }
    setLoading(false);
  };

  const deleteAddress = async (id: string) => {
    const { error } = await supabase.from('addresses').delete().eq('id', id);
    if (!error) fetchAddresses();
  };

  const setDefault = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    // Reset all to false first
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', user?.id);
    // Set this one to true
    await supabase.from('addresses').update({ is_default: true }).eq('id', id);
    fetchAddresses();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">My Addresses</h2>
        <button 
            onClick={() => setShowModal(true)}
            className="bg-pink-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-pink-700 transition-all shadow-lg shadow-pink-100 flex items-center gap-2 cursor-pointer"
        >
            <Plus size={18} /> Add New Address
        </button>
      </div>

      {loading && addresses.length === 0 ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-pink-600" /></div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-2xl">
          <MapPin size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-400">No addresses saved yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {addresses.map((addr) => (
            <div key={addr.id} className={`p-5 border rounded-2xl transition-all ${addr.is_default ? 'border-pink-500 bg-pink-50/30' : 'border-gray-100 hover:border-gray-300'}`}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-800">{addr.receiver_name}</span>
                  <span className="text-gray-400 text-sm">| {addr.phone_number}</span>
                  {addr.is_default && (
                    <span className="bg-pink-100 text-pink-600 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Default</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {!addr.is_default && (
                    <button onClick={() => setDefault(addr.id)} className="text-xs text-pink-600 font-bold hover:text-pink-700 cursor-pointer">Set Default</button>
                  )}
                  <button onClick={() => deleteAddress(addr.id)} className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer p-1">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                {addr.detailed_address}, {addr.barangay}, {addr.city_municipality}, {addr.province}, {addr.region}, {addr.postal_code}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Modal - Pass the profile and the fetch function */}
      {showModal && (
          <AddAddressModal 
            profile={profile} 
            onClose={() => setShowModal(false)} 
            onSuccess={() => {
                fetchAddresses(); // Refresh the list
                setShowModal(false); // Close the modal
            }}
          />
      )}
    </div>
  );
};

export default AddressTab;