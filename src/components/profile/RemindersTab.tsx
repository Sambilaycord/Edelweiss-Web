import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Plus, Gift, Trash2, Edit2, Clock, Cake, Heart, Sparkles, Loader2, Info, PartyPopper, Flower, GraduationCap, Truck } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import AddReminderModal from '../notification/AddReminderModal';

interface Reminder {
  id: string;
  name: string;
  reminder_date: string;
  description: string;
  icon_name?: string;
}

const RemindersTab: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('customer_id', user.id)
        .order('reminder_date', { ascending: true });

      if (error) throw error;
      setReminders(data || []);
    } catch (err) {
      console.error('Error fetching reminders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this reminder?')) return;
    try {
      const { error } = await supabase.from('reminders').delete().eq('id', id);
      if (error) throw error;
      fetchReminders();
    } catch (err) {
      console.error('Error deleting reminder:', err);
    }
  };

  const handleEdit = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setShowModal(true);
  };

  const handleAddNew = () => {
    setEditingReminder(null);
    setShowModal(true);
  };

  const renderIcon = (name: string | undefined, size = 24, className = "") => {
    switch (name) {
      case 'flower': return <Flower size={size} className={className} />;
      case 'heart': return <Heart size={size} className={className} />;
      case 'cake': return <Cake size={size} className={className} />;
      case 'party_popper': return <PartyPopper size={size} className={className} />;
      case 'gift': return <Gift size={size} className={className} />;
      case 'sparkles': return <Sparkles size={size} className={className} />;
      case 'graduation_cap': return <GraduationCap size={size} className={className} />;
      case 'truck': return <Truck size={size} className={className} />;
      default: return <Flower size={size} className={className} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <h2 className="text-2xl font-bold text-gray-800">Special Occasions</h2>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className={`p-2 mt-[5px] rounded-lg transition-all cursor-pointer ${showInfo ? 'bg-pink-100 text-pink-600' : 'text-gray-300 hover:text-pink-600'
              }`}
            title="Help & Info"
          >
            <Info size={20} />
          </button>
        </div>
        <button
          onClick={handleAddNew}
          className="bg-pink-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-pink-700 transition-all shadow-lg shadow-pink-100 flex items-center gap-2 cursor-pointer"
        >
          <Plus size={18} /> Add Reminder
        </button>
      </div>

      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ height: 0, opacity: 0, marginBottom: 0 }}
            animate={{ height: 'auto', opacity: 1, marginBottom: 32 }}
            exit={{ height: 0, opacity: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-pink-50 rounded-2xl p-6 border border-pink-100 flex gap-4 items-center">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-pink-600 shadow-sm shrink-0">
                <Gift size={24} />
              </div>
              <p className="text-pink-800 text-sm font-medium">
                Set reminders for your loved ones' special days. We'll notify you in advance so you have plenty of time to choose the perfect gift!
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-pink-600" /></div>
      ) : reminders.length === 0 ? (
        <div className="text-center py-20 bg-gray-50/50 rounded-[32px] border-2 border-dashed border-gray-100">
          <Calendar size={48} className="mx-auto text-gray-200 mb-4" />
          <h3 className="text-lg font-bold text-gray-800">No reminders set</h3>
          <p className="text-sm text-gray-400">Add birthdays, anniversaries and more.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {reminders.map((reminder) => (
            <div key={reminder.id} className="bg-white border-2 border-gray-100 rounded-2xl p-6 hover:border-pink-200 hover:shadow-md transition-all group">
              <div className="flex justify-between items-center">
                {/* Info Section */}
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-pink-50 transition-colors shrink-0">
                    {renderIcon(reminder.icon_name, 32, "text-pink-400 group-hover:text-pink-600 transition-colors")}
                  </div>
                  <div className="space-y-1 text-left">
                    <h4 className="font-medium text-gray-900 text-lg">{reminder.name}</h4>
                    <p className="text-pink-600 text-sm font-medium flex items-center gap-1.5">
                      <Calendar size={14} />
                      {new Date(reminder.reminder_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                    {reminder.description && (
                      <p className="text-gray-500 text-sm italic pr-4">{reminder.description}</p>
                    )}
                  </div>
                </div>

                {/* Actions Section */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(reminder)}
                    className="p-2.5 text-gray-400 hover:text-pink-600 hover:bg-pink-50 rounded-xl transition-all cursor-pointer"
                    title="Edit Reminder"
                  >
                    <Edit2 size={20} />
                  </button>
                  <button
                    onClick={() => handleDelete(reminder.id)}
                    className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                    title="Delete Reminder"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddReminderModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => {
          setShowModal(false);
          fetchReminders();
        }}
        reminderToEdit={editingReminder}
      />
    </div>
  );
};

export default RemindersTab;
