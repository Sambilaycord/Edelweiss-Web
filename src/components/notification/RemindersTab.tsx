import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Gift, Clock, Cake, Heart, Sparkles, ChevronRight, PartyPopper, Loader2, Flower, GraduationCap, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

interface ReminderItem {
  id: string;
  name: string;
  reminder_date: string;
  daysRemaining: number;
  message: string;
  icon_name?: string;
  product_id?: string;
  products?: {
    id: string;
    name: string;
    image_urls: string[];
    price: number;
  };
}

const RemindersTab: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);

  const calculateDaysRemaining = (targetDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = new Date(targetDate);
    eventDate.setHours(0, 0, 0, 0);

    // Handle anniversary/birthday recurrence by setting year to current or next
    const currentYear = today.getFullYear();
    eventDate.setFullYear(currentYear);

    if (eventDate < today) {
      eventDate.setFullYear(currentYear + 1);
    }

    const diffTime = eventDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getCustomMessage = (days: number, name: string) => {
    if (days === 0) return `It's ${name} today! Time to celebrate! 🎉`;
    if (days === 1) return `${name} is tomorrow! Are you ready? ✨`;
    if (days <= 7) return `${name} is just ${days} days away! Time to find the perfect gift. ❤️`;
    return `${name} is coming up in ${days} days. Don't forget to send some love! 🎁`;
  };

  useEffect(() => {
    const fetchReminders = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('reminders')
          .select('*, products(id, name, image_urls, price)')
          .eq('customer_id', user.id);

        if (error) throw error;

        if (data) {
          const processed = data.map((r: any) => {
            const days = calculateDaysRemaining(r.reminder_date);
            return {
              ...r,
              daysRemaining: days,
              message: getCustomMessage(days, r.name)
            };
          }).sort((a, b) => a.daysRemaining - b.daysRemaining);

          setReminders(processed);
        }
      } catch (err) {
        console.error('Error fetching feed reminders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReminders();
  }, []);

  const renderIcon = (name: string | undefined, isToday: boolean) => {
    const size = 32;
    const className = isToday ? "text-white" : "text-pink-500";

    switch (name) {
      case 'flower': return <Flower size={size} className={className} />;
      case 'heart': return <Heart size={size} className={className} />;
      case 'cake': return <Cake size={size} className={className} />;
      case 'party-popper': return <PartyPopper size={size} className={className} />;
      case 'gift': return <Gift size={size} className={className} />;
      case 'sparkle': return <Sparkles size={size} className={className} />;
      case 'graduation-cap': return <GraduationCap size={size} className={className} />;
      case 'truck': return <Truck size={size} className={className} />;
      default: return <Flower size={size} className={className} />;
    }
  };

  const getStatusColor = (days: number) => {
    if (days === 0) return 'bg-gradient-to-br from-pink-500 to-rose-600 shadow-pink-200';
    if (days <= 7) return 'bg-amber-50 shadow-amber-100';
    return 'bg-blue-50 shadow-blue-100';
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-end -mt-2">
        <button
          onClick={() => navigate('/profile', { state: { activeTab: 'reminders' } })}
          className="text-base font-medium text-gray-400 hover:text-pink-600 flex items-center gap-1 transition-all cursor-pointer group leading-none"
        >
          Manage Occasions
          <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform mt-[5px]" />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-pink-600" /></div>
      ) : reminders.length === 0 ? (
        <div className="bg-white rounded-[40px] p-24 text-center border border-gray-100 shadow-sm">
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8">
            <Gift size={48} className="text-gray-200" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Your calendar is quiet</h3>
          <p className="text-gray-400 max-w-xs mx-auto font-medium leading-relaxed">
            Add reminders in your profile for birthdays and anniversaries to see them here!
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {['Today', 'Coming Up', 'Later', 'Next Year'].map((section) => {
            const filtered = reminders.filter(r => {
              const today = new Date();
              const eventDate = new Date(r.reminder_date);
              
              let targetYear = today.getFullYear();
              const eventThisYear = new Date(eventDate);
              eventThisYear.setFullYear(targetYear);
              
              if (eventThisYear < today && today.toDateString() !== eventThisYear.toDateString()) {
                targetYear++;
              }
              
              const isNextYear = targetYear > today.getFullYear();

              if (section === 'Today') return r.daysRemaining === 0;
              if (section === 'Coming Up') return r.daysRemaining > 0 && r.daysRemaining <= 7;
              if (section === 'Later') return r.daysRemaining > 7 && !isNextYear;
              if (section === 'Next Year') return isNextYear;
              return false;
            });

            if (filtered.length === 0) return null;

            return (
              <div key={section} className="space-y-4">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] px-4 flex items-center gap-3">
                  {section}
                  <div className="h-[1px] bg-gray-100 flex-1"></div>
                </h4>
                <div className="space-y-3">
                  {filtered.map((reminder) => (
                    <motion.div
                      key={reminder.id}
                      whileHover={{ x: 5, scale: 1.01 }}
                      className={`bg-white rounded-[28px] p-6 border border-gray-100 shadow-sm flex items-center gap-6 group cursor-pointer transition-all ${reminder.daysRemaining === 0 ? 'border-pink-200 ring-4 ring-pink-50' : ''
                        }`}
                    >
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${getStatusColor(reminder.daysRemaining)}`}>
                        {renderIcon(reminder.icon_name, reminder.daysRemaining === 0)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className={`text-lg font-bold tracking-tight truncate ${reminder.daysRemaining === 0 ? 'text-pink-600' : 'text-gray-800'
                            }`}>
                            {reminder.name}
                          </h4>
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider shrink-0 ${reminder.daysRemaining === 0 ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-400'
                            }`}>
                            {new Date(reminder.reminder_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-gray-500 text-sm leading-relaxed pr-10 line-clamp-2 font-medium">
                          {reminder.message}
                        </p>
                        {reminder.products && (
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/product/${reminder.products?.id}`);
                            }}
                            className="mt-3 bg-pink-50 rounded-xl p-2 border border-pink-100 flex items-center gap-3 cursor-pointer hover:bg-white transition-colors group/gift max-w-sm"
                          >
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-white shrink-0 shadow-sm border border-pink-50">
                              <img 
                                src={reminder.products.image_urls?.[0]} 
                                alt={reminder.products.name} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[9px] font-black text-pink-600 uppercase tracking-widest leading-none mb-1">Planned Gift</p>
                              <h5 className="text-gray-900 font-bold truncate text-[12px]">{reminder.products.name}</h5>
                            </div>
                          </div>
                        )}
                      </div>

                      <button 
                        onClick={() => navigate('/')}
                        className="bg-pink-600 text-white px-5 py-3 rounded-xl text-xs font-black hover:bg-pink-700 transition-all shadow-lg shadow-pink-100 opacity-0 group-hover:opacity-100 cursor-pointer hidden sm:block"
                      >
                        Shop Gifts
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RemindersTab;
