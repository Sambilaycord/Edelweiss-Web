import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { MapPin, Plus, Trash2, Edit2, Loader2 } from 'lucide-react';
import AddAddressModal from './AddAddressModal';
import type { AddressProfile, SavedAddress } from './AddAddressModal';

interface AddressTabProps {
  profile: AddressProfile;
}

const AddressTab: React.FC<AddressTabProps> = ({ profile }) => {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchAddresses = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('addresses')
          .select('*')
          .eq('user_id', user.id)
          .order('is_default', { ascending: false });
        if (error) throw error;
        setAddresses((data as SavedAddress[] | null) || []);
      }
    } catch (err) {
      console.error('Error fetching addresses:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const deleteAddress = async (id: string) => {
    if (busyId) return;
    setBusyId(id);
    try {
      const deleted = addresses.find(a => a.id === id);
      const { error } = await supabase.from('addresses').delete().eq('id', id);
      if (error) throw error;

      // If the default address was deleted, promote another one so the user still has a default
      const remaining = addresses.filter(a => a.id !== id);
      if (deleted?.is_default && remaining.length > 0) {
        const { error: defaultError } = await supabase
          .from('addresses')
          .update({ is_default: true })
          .eq('id', remaining[0].id);
        if (defaultError) throw defaultError;
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete address');
    } finally {
      setBusyId(null);
      fetchAddresses();
    }
  };

  const setDefault = async (id: string) => {
    if (busyId) return;
    setBusyId(id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Authentication required');

      // Set the new default first so a failure never leaves the user without one
      const { error: setError } = await supabase.from('addresses').update({ is_default: true }).eq('id', id);
      if (setError) throw setError;

      const { error: clearError } = await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .neq('id', id);
      if (clearError) throw clearError;
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to set default address');
    } finally {
      setBusyId(null);
      fetchAddresses();
    }
  };

  const handleEdit = (addr: SavedAddress) => {
    setEditingAddress(addr);
    setShowModal(true);
  };

  const handleAddNew = () => {
    if (addresses.length >= 5) {
      alert("Maximum of 5 addresses reached. Please delete an existing address to add a new one.");
      return;
    }
    setEditingAddress(null);
    setShowModal(true);
  };

  return (
    <div className="space-y-6 flex-1 flex flex-col">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">My Addresses</h2>
        <button
          onClick={handleAddNew}
          disabled={addresses.length >= 5}
          className={`bg-pink-600 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-pink-100 flex items-center gap-2 ${addresses.length >= 5 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-pink-700 cursor-pointer'
            }`}
          title={addresses.length >= 5 ? "Maximum address limit reached" : "Add New Address"}
        >
          <Plus size={18} /> Add New Address
        </button>
      </div>

      {addresses.length >= 5 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
          <MapPin size={16} />
          You have reached the maximum limit of 5 addresses.
        </div>
      )}

      {loading && addresses.length === 0 ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-pink-600" /></div>
      ) : addresses.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-2xl">
          <MapPin size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-400">No addresses saved yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`p-5 border-2 rounded-2xl transition-all ${addr.is_default ? 'border-pink-500 bg-pink-50/30' : 'border-gray-100 hover:border-pink-200'
                }`}
            >
              <div className="flex justify-between items-start">
                {/* Information Layout */}
                <div className="space-y-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 text-lg">{addr.receiver_name}</span>
                    <span className="text-gray-400">| {addr.phone_number}</span>
                    {addr.is_default && (
                      <span className="bg-pink-100 text-pink-600 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">Default</span>
                    )}
                  </div>
                  <p className="text-gray-500 text-sm">{addr.detailed_address}</p>
                  <p className="text-gray-500 text-sm">
                    {addr.barangay}, {addr.city_municipality}, {addr.province}, {addr.region}, {addr.postal_code}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col items-end gap-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(addr)}
                      className="text-gray-400 hover:text-pink-600 transition-colors cursor-pointer p-1"
                      title="Edit Address"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => deleteAddress(addr.id)}
                      disabled={busyId !== null}
                      className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer p-1"
                      title="Delete Address"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  {!addr.is_default && (
                    <button
                      onClick={() => setDefault(addr.id)}
                      disabled={busyId !== null}
                      className="text-xs text-pink-600 font-bold hover:text-pink-700 cursor-pointer bg-pink-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Set Default
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <AddAddressModal
          key={editingAddress?.id ?? 'new'}
          profile={profile}
          addressToEdit={editingAddress}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            fetchAddresses();
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
};

export default AddressTab;