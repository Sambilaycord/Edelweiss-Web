import React from 'react';
import { motion } from 'framer-motion';
import PhoneInput from 'react-phone-number-input'
import { Save, Loader2, Phone } from 'lucide-react';
import 'react-phone-number-input/style.css'
import '../../styles/index.css';

interface ProfileData {
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  email: string | null;
  gender: string | null;
  birthdate: string | null;
}

interface PersonalInfoTabProps {
  profile: ProfileData;
  setProfile: React.Dispatch<React.SetStateAction<any>>;
  onSave: (e: React.FormEvent) => Promise<void>;
  updating: boolean;
  message: { text: string; type: 'success' | 'error' } | null;
}

const PersonalInfoTab: React.FC<PersonalInfoTabProps> = ({ 
  profile, 
  setProfile, 
  onSave, 
  updating, 
  message 
}) => {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="px-10">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Personal Information</h2>
      
      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={onSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Names */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
          <input 
            type="text" 
            value={profile.first_name || ''}
            maxLength={50}
            onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
            placeholder="Enter First Name"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-pink-500 outline-none transition-shadow" 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
          <input 
            type="text" 
            value={profile.last_name || ''}
            maxLength={50}
            onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
            placeholder="Enter Last Name"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-pink-500 outline-none transition-shadow" 
          />
        </div>

        {/* Email - Full Row */}
        <div className="md:col-span-2"> 
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input 
            type="email" 
            disabled 
            maxLength={254}
            value={profile.email || ''} 
            className="w-full border border-gray-300 bg-gray-100 text-gray-500 rounded-lg px-4 py-2 cursor-not-allowed" 
          />
        </div>

        {/* Cell Number - Full Row */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Cell Number</label>
          <PhoneInput
            international
            defaultCountry="PH"
            limitMaxLength={true}
            value={profile.phone_number || ''}
            onChange={(val) => setProfile({ ...profile, phone_number: val })}
            className="flex w-full border border-gray-300 rounded-lg px-4 py-2 focus-within:ring-2 focus-within:ring-pink-500 outline-none transition-shadow"
          />
        </div>

        {/* Gender Selection */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
          <div className="flex items-center gap-6">
            {['male', 'female', 'others'].map((option) => (
              <label key={option} className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input 
                    type="radio" 
                    name="gender"
                    value={option}
                    checked={profile.gender === option}
                    onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                    className="peer appearance-none w-5 h-5 border-2 border-gray-300 rounded-full checked:border-pink-500 transition-all cursor-pointer"
                  />
                  <div className="absolute w-2.5 h-2.5 bg-pink-500 rounded-full opacity-0 peer-checked:opacity-100 transition-opacity" />
                </div>
                <span className="text-gray-700 capitalize group-hover:text-pink-600 transition-colors">
                  {option === 'others' ? 'Other' : option}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Birthday - Full Row */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
          <input 
            type="date" 
            value={profile.birthdate || ''}
            onChange={(e) => setProfile({ ...profile, birthdate: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-pink-500 outline-none" 
          />
        </div>

        {/* Submit */}
        <div className="md:col-span-2 mt-4">
          <button 
            type="submit" 
            disabled={updating} 
            className="flex items-center gap-2 bg-pink-600 text-white px-8 py-2.5 rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-70 cursor-pointer font-medium"
          >
            {updating ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            {updating ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default PersonalInfoTab;