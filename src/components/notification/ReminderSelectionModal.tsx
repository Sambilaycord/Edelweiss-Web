import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Calendar, ChevronRight, Loader2, Gift, Bell } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface ReminderSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCreateNew: () => void;
  onSuccess: (message: string) => void;
  productId: string;
}

interface Reminder {
  id: string;
  name: string;
  reminder_date: string;
  icon_name: string;
  product_id?: string | null;
}

const ReminderSelectionModal: React.FC<ReminderSelectionModalProps> = ({
  isOpen, onClose, onSelectCreateNew, onSuccess, productId
}) => {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [confirmReplace, setConfirmReplace] = useState<{ id: string, name: string } | null>(null);

  const itemsPerPage = 3;
  const totalPages = Math.ceil(reminders.length / itemsPerPage);
  const paginatedReminders = reminders.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

  useEffect(() => {
    if (isOpen) {
      setCurrentPage(0);
      setConfirmReplace(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const fetchReminders = async () => {
      if (!isOpen) return;
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('reminders')
          .select('id, name, reminder_date, icon_name, product_id')
          .eq('customer_id', user.id)
          .order('reminder_date', { ascending: true });

        if (!error) setReminders(data || []);
      } catch (err) {
        console.error('Error fetching reminders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReminders();
  }, [isOpen]);

  const performUpdate = async (reminderId: string, reminderName: string) => {
    setUpdating(reminderId);
    try {
      const { error } = await supabase
        .from('reminders')
        .update({ product_id: productId })
        .eq('id', reminderId);

      if (error) throw error;
      onSuccess(`Gift successfully added to ${reminderName}!`);
      onClose();
    } catch (err) {
      console.error('Error updating reminder:', err);
    } finally {
      setUpdating(null);
    }
  };

  const handleSelectExisting = (reminder: Reminder) => {
    if (reminder.product_id && reminder.product_id !== productId) {
      setConfirmReplace({ id: reminder.id, name: reminder.name });
      return;
    }
    performUpdate(reminder.id, reminder.name);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
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
            className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]"
          >
            {/* Header */}
            <div className="px-8 pt-8 pb-6 border-b border-gray-50 flex items-center justify-between shrink-0">
              <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
                Plan a Gift
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer text-gray-400">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
              {confirmReplace ? (
                <div className="py-4 space-y-6">
                  <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto">
                    <Gift className="text-amber-500" size={32} />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-bold text-gray-800">Change Gift Idea?</h3>
                    <p className="text-gray-500 text-sm font-medium leading-relaxed">
                      "<span className="text-gray-900 font-medium">{confirmReplace.name}</span>" already has a gift attached. Are you sure you want to replace it with this one?
                    </p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => performUpdate(confirmReplace.id, confirmReplace.name)}
                      disabled={!!updating}
                      className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-pink-100 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {updating ? <Loader2 className="animate-spin" size={20} /> : "Yes, Replace It"}
                    </button>
                    <button
                      onClick={() => setConfirmReplace(null)}
                      className="w-full bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold py-4 rounded-2xl transition-all cursor-pointer"
                    >
                      No, Keep Original
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Option 1: Create New */}
                  <button
                    onClick={onSelectCreateNew}
                    className="w-full group bg-pink-600 hover:bg-pink-700 p-6 rounded-[24px] flex items-center gap-5 transition-all shadow-lg shadow-pink-100 hover:-translate-y-1 cursor-pointer"
                  >
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                      <Plus className="text-white" size={24} />
                    </div>
                    <div className="text-left">
                      <h3 className="text-white font-bold text-lg">Create New Occasion</h3>
                      <p className="text-pink-100 text-xs">Set up a brand new reminder for this gift</p>
                    </div>
                    <ChevronRight className="text-white/40 ml-auto group-hover:translate-x-1 transition-transform" size={20} />
                  </button>

                  {/* Option 2: Existing List */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 px-2">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Or add to existing</h4>
                      <div className="h-[1px] bg-gray-100 flex-1"></div>
                    </div>

                    {loading ? (
                      <div className="flex justify-center py-10"><Loader2 className="animate-spin text-pink-600" /></div>
                    ) : reminders.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                        <p className="text-gray-400 text-sm font-medium">No existing reminders found.</p>
                      </div>
                    ) : (
                      <div className="space-y-4 pb-2">
                        <div className="space-y-3">
                          {paginatedReminders.map((reminder) => (
                            <button
                              key={reminder.id}
                              disabled={!!updating}
                              onClick={() => handleSelectExisting(reminder)}
                              className="w-full group bg-white border border-gray-100 p-4 rounded-2xl flex items-center gap-4 hover:border-pink-200 hover:bg-pink-50/30 transition-all cursor-pointer text-left disabled:opacity-50"
                            >
                              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-white transition-colors shrink-0">
                                <Bell size={20} className="text-pink-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-gray-800 text-sm truncate">{reminder.name}</h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <p className="text-[10px] font-medium text-gray-400 flex items-center gap-1">
                                    <Calendar size={10} />
                                    {new Date(reminder.reminder_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </p>
                                  {reminder.product_id && (
                                    <span className="text-[8px] font-black bg-pink-100 text-pink-600 px-1.5 py-0.5 rounded-md uppercase tracking-wider">Gift Attached</span>
                                  )}
                                </div>
                              </div>
                              {updating === reminder.id ? (
                                <Loader2 className="animate-spin text-pink-600" size={18} />
                              ) : (
                                <Plus className="text-gray-300 group-hover:text-pink-600 transition-colors" size={18} />
                              )}
                            </button>
                          ))}
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                          <div className="flex items-center justify-between px-2 pt-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                              Page {currentPage + 1} of {totalPages}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                                disabled={currentPage === 0}
                                className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                              >
                                <ChevronRight size={18} className="rotate-180" />
                              </button>
                              <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                                disabled={currentPage === totalPages - 1}
                                className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                              >
                                <ChevronRight size={18} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Footer Note */}
            <div className="p-6 bg-gray-50/50 border-t border-gray-50 text-center shrink-0">
              <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
                We'll notify you in advance so you have plenty of time <br /> to choose the perfect gift!
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ReminderSelectionModal;
