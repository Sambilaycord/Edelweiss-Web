import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Pencil, Loader2, User } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { validateField, sanitizeInput } from '../../utils/characterValidation';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: {
    id: string;
    username: string | null;
    avatar_url: string | null;
  };
  onSuccess: (newProfile: { username: string; avatar_url: string | null }) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, profile, onSuccess }) => {
  const [username, setUsername] = useState(profile.username || '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || null);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(profile.avatar_url || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Image size must be less than 2MB');
        return;
      }
      setNewFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    const cleanUsername = sanitizeInput(username);
    const userError = validateField('username', cleanUsername);
    if (userError) {
      setError(userError);
      setLoading(false);
      return;
    }

    try {
      let finalAvatarUrl = avatarUrl;

      if (newFile) {
        const fileExt = newFile.name.split('.').pop();
        const fileName = `profiles/${profile.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('public-media')
          .upload(fileName, newFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('public-media')
          .getPublicUrl(fileName);

        finalAvatarUrl = urlData.publicUrl;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          username: cleanUsername,
          avatar_url: finalAvatarUrl,
        })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      onSuccess({ username: cleanUsername, avatar_url: finalAvatarUrl });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden"
        >
          {/* Header */}
          <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Edit Profile</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>

          <div className="p-8">
            {/* Avatar Section */}
            <div className="flex flex-col items-center mb-10">
              <div className="relative group">
                <div className="w-32 h-32 bg-pink-50 rounded-full flex items-center justify-center text-pink-600 overflow-hidden border-4 border-white shadow-xl">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User size={64} />
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 bg-pink-600 p-3 rounded-full text-white border-4 border-white cursor-pointer hover:bg-pink-700 transition-all shadow-lg hover:scale-110 active:scale-95"
                >
                  <Camera size={20} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
              <p className="text-[11px] font-bold text-gray-400 mt-4 uppercase tracking-widest">Recommended: 512x512px (Square), max 2MB</p>
            </div>

            {/* Form */}
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">Username</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <Pencil size={18} />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    className="w-full pl-12 pr-4 py-4 border border-gray-100 bg-gray-50/50 rounded-2xl focus:ring-2 focus:ring-pink-500 focus:bg-white focus:border-transparent outline-none transition-all text-gray-800 font-medium"
                  />
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-500 bg-red-50 p-4 rounded-xl border border-red-100 flex items-center gap-3"
                >
                  <X size={18} className="shrink-0" />
                  <span className="font-medium">{error}</span>
                </motion.div>
              )}

              <button
                onClick={handleSave}
                disabled={loading}
                className="w-full bg-pink-600 text-white py-4.5 rounded-2xl font-bold hover:bg-pink-700 transition-all shadow-xl shadow-pink-100 flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer text-lg mt-2"
              >
                {loading ? <Loader2 className="animate-spin" size={22} /> : 'Save Changes'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EditProfileModal;
