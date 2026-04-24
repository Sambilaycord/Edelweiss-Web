import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, ShoppingBag, Heart, Info, Clock, CheckCircle2, ChevronRight } from 'lucide-react';

interface Notification {
  id: string;
  type: 'order' | 'social' | 'system' | 'promo';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
}

const NotificationsTab: React.FC = () => {
  // Demo data - in a real app, this would come from Supabase
  const [notifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'order',
      title: 'Order Delivered!',
      message: 'Your order #ORD-2024-001 has been delivered to your primary address.',
      time: '2 hours ago',
      isRead: false
    },
    {
      id: '2',
      type: 'promo',
      title: 'Exclusive Voucher Just For You',
      message: 'Use code PINKLOVE to get 20% off on your next purchase!',
      time: '5 hours ago',
      isRead: false
    },
    {
      id: '3',
      type: 'social',
      title: 'New Product in Wishlist',
      message: 'A product you love is now back in stock. Grab it before it\'s gone!',
      time: 'Yesterday',
      isRead: true
    }
  ]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'order': return <ShoppingBag className="text-blue-500" />;
      case 'social': return <Heart className="text-pink-500" />;
      case 'promo': return <CheckCircle2 className="text-green-500" />;
      default: return <Info className="text-gray-500" />;
    }
  };

  const getBg = (type: string) => {
    switch (type) {
      case 'order': return 'bg-blue-50';
      case 'social': return 'bg-pink-50';
      case 'promo': return 'bg-green-50';
      default: return 'bg-gray-50';
    }
  };

  if (notifications.length === 0) {
    return (
      <div className="bg-white rounded-[32px] p-20 text-center border border-gray-100 shadow-sm">
        <div className="w-24 h-24 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Bell size={40} className="text-pink-300" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">All caught up!</h3>
        <p className="text-gray-400 max-w-xs mx-auto">
          No new notifications for now. We'll alert you when something important happens.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notifications.map((notif) => (
        <motion.div 
          key={notif.id}
          whileHover={{ x: 5 }}
          className={`bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-start gap-6 relative group cursor-pointer transition-all ${!notif.isRead ? 'ring-2 ring-pink-100 border-pink-100' : ''}`}
        >
          {!notif.isRead && (
            <div className="absolute top-6 right-6 w-2.5 h-2.5 bg-pink-600 rounded-full" />
          )}
          
          <div className={`w-14 h-14 ${getBg(notif.type)} rounded-2xl flex items-center justify-center shrink-0`}>
            {getIcon(notif.type)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-lg font-bold text-gray-800 tracking-tight">{notif.title}</h4>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed mb-3 pr-8">{notif.message}</p>
            <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              <Clock size={12} />
              {notif.time}
            </div>
          </div>

          <div className="flex items-center justify-center self-center opacity-0 group-hover:opacity-100 transition-opacity pr-2">
            <ChevronRight className="text-pink-600" size={20} />
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default NotificationsTab;
