import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Loader2, Sparkles, Cake, Heart, PartyPopper, Gift, Flower, GraduationCap, Truck } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface ReminderToEdit {
  id: string;
  name: string;
  reminder_date: string;
  description?: string | null;
  icon_name?: string | null;
  product_id?: string | null;
}

interface AttachedProduct {
  id: string;
  name: string;
  image_urls: string[] | null;
  price: number;
}

interface AddReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  reminderToEdit?: ReminderToEdit | null;
  productId?: string;
}

// Supabase errors aren't always Error instances, so read `message` structurally
const getErrorMessage = (err: unknown, fallback: string) =>
  err && typeof err === 'object' && 'message' in err && typeof err.message === 'string' && err.message
    ? err.message
    : fallback;

// Local (not UTC) YYYY-MM-DD, so the date picker bounds match the user's calendar day
const toLocalDateString = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Same month/day in another year, clamped so Feb 29 becomes Feb 28 in non-leap years
const dateInYear = (year: number, month: number, day: number) => {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(day, lastDay));
};

const AddReminderModal: React.FC<AddReminderModalProps> = ({ isOpen, onClose, onSuccess, reminderToEdit, productId }) => {
  const [loading, setLoading] = useState(false);
  const [attachedProduct, setAttachedProduct] = useState<AttachedProduct | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    reminder_date: '',
    icon_name: 'flower',
    product_id: null as string | null
  });

  const availableIcons = [
    { name: 'flower', icon: Flower },
    { name: 'heart', icon: Heart },
    { name: 'cake', icon: Cake },
    { name: 'party_popper', icon: PartyPopper },
    { name: 'gift', icon: Gift },
    { name: 'sparkles', icon: Sparkles },
    { name: 'graduation_cap', icon: GraduationCap },
    { name: 'truck', icon: Truck },
  ];

  // Reset the form and (re)load the attached product every time the modal opens.
  // A single effect avoids the edit/new flows leaving a stale product from a previous open.
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    const attachedId = reminderToEdit ? (reminderToEdit.product_id || null) : (productId || null);

    setFormData({
      name: reminderToEdit?.name || '',
      description: reminderToEdit?.description || '',
      reminder_date: reminderToEdit?.reminder_date ? reminderToEdit.reminder_date.split('T')[0] : '',
      icon_name: reminderToEdit?.icon_name || 'flower',
      product_id: attachedId
    });
    setAttachedProduct(null);

    const fetchProduct = async () => {
      if (!attachedId) return;
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, image_urls, price')
          .eq('id', attachedId)
          .single();
        if (cancelled) return;
        if (error) throw error;
        if (data) setAttachedProduct(data);
      } catch (err) {
        console.error('Error fetching attached product:', err);
      }
    };
    fetchProduct();

    return () => { cancelled = true; };
  }, [reminderToEdit, isOpen, productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const payload = {
        customer_id: user.id,
        name: formData.name,
        description: formData.description,
        reminder_date: formData.reminder_date,
        icon_name: formData.icon_name,
        product_id: formData.product_id
      };

      if (reminderToEdit?.id) {
        const { error } = await supabase
          .from('reminders')
          .update(payload)
          .eq('id', reminderToEdit.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('reminders')
          .insert([payload]);
        if (error) throw error;
      }

      onSuccess();
    } catch (err: unknown) {
      alert(getErrorMessage(err, 'An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const today = new Date();
  const todayStr = toLocalDateString(today);
  const maxDate = toLocalDateString(dateInYear(today.getFullYear() + 2, today.getMonth(), today.getDate()));
  // Reminders recur yearly, so an existing reminder may hold a past date; don't let `min` block saving it.
  const minDate = formData.reminder_date && formData.reminder_date < todayStr ? formData.reminder_date : todayStr;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden"
        >
          {/* Header */}
          <div className="px-8 pt-8 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
              {reminderToEdit ? 'Edit Reminder' : 'Add New Reminder'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer text-gray-400">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            <div className="space-y-5">
              {/* Icon Selection */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Choose an Icon</label>
                <div className="grid grid-cols-8 gap-2">
                  {availableIcons.map((item) => {
                    const Icon = item.icon;
                    const isActive = formData.icon_name === item.name;
                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon_name: item.name })}
                        className={`aspect-square w-full rounded-xl flex items-center justify-center transition-all cursor-pointer border-2 ${isActive
                          ? 'bg-pink-600 border-pink-600 text-white shadow-lg shadow-pink-100 scale-105'
                          : 'bg-gray-50 border-transparent text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                          }`}
                      >
                        <Icon size={18} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4">
                {attachedProduct && (
                  <div className="bg-pink-50/50 rounded-2xl p-4 border border-pink-100 flex items-center gap-4 mb-2">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-white shrink-0 shadow-sm">
                      <img 
                        src={attachedProduct.image_urls?.[0]} 
                        alt={attachedProduct.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-pink-600 uppercase tracking-widest mb-1">Gift Choice</p>
                      <h5 className="text-gray-900 font-bold truncate text-sm">{attachedProduct.name}</h5>
                      <p className="text-pink-600 font-bold text-xs">₱{Number(attachedProduct.price).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        setAttachedProduct(null);
                        setFormData(prev => ({ ...prev, product_id: null }));
                      }}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Occasion Name</label>
                  <input
                    type="text" required value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Sarah's Birthday"
                    className="w-full bg-gray-50 border border-transparent rounded-2xl px-5 py-4 focus:ring-2 focus:ring-pink-500 focus:bg-white transition-all outline-none text-gray-800 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Event Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="date" required value={formData.reminder_date}
                      min={minDate}
                      max={maxDate}
                      onChange={(e) => setFormData({ ...formData, reminder_date: e.target.value })}
                      className="w-full bg-gray-50 border border-transparent rounded-2xl pl-12 pr-5 py-4 focus:ring-2 focus:ring-pink-500 focus:bg-white transition-all outline-none text-gray-800 font-medium appearance-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Gift Ideas / Note</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="e.g. Find something vintage..."
                    rows={3}
                    className="w-full bg-gray-50 border border-transparent rounded-2xl px-5 py-4 focus:ring-2 focus:ring-pink-500 focus:bg-white transition-all outline-none text-gray-800 font-medium resize-none"
                  />
                </div>
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full bg-pink-600 text-white py-4.5 rounded-2xl font-bold hover:bg-pink-700 transition-all shadow-xl shadow-pink-100 flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer text-lg mt-2"
              >
                {loading ? <Loader2 className="animate-spin" size={22} /> : (reminderToEdit ? 'Save Changes' : 'Create Reminder')}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AddReminderModal;
