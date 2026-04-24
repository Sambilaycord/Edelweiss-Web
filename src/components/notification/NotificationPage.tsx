import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../common/Navbar';
import { Bell, Calendar } from 'lucide-react';
import NotificationsTab from './NotificationsTab';
import RemindersTab from './RemindersTab';

const NotificationPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'all' | 'reminders'>('all');

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-4xl mx-auto py-12 px-4">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <h1 className="text-4xl font-bold text-gray-900">Notifications</h1>
                        <p className="text-gray-500 mt-2 font-medium">Manage your alerts and special occasion reminders.</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex bg-white p-1.5 rounded-[20px] shadow-sm border border-gray-100 w-fit"
                    >
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-[14px] text-sm font-bold transition-all cursor-pointer ${activeTab === 'all' ? 'bg-pink-600 text-white shadow-lg shadow-pink-100' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <Bell size={18} /> All Alerts
                        </button>
                        <button
                            onClick={() => setActiveTab('reminders')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-[14px] text-sm font-bold transition-all cursor-pointer ${activeTab === 'reminders' ? 'bg-pink-600 text-white shadow-lg shadow-pink-100' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <Calendar size={18} /> Reminders
                        </button>
                    </motion.div>
                </div>

                {/* Tab Content */}
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {activeTab === 'all' ? <NotificationsTab /> : <RemindersTab />}
                </motion.div>
            </div>
        </div>
    );
};

export default NotificationPage;
