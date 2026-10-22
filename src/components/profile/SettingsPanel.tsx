import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { KeyRound, Loader2, LogOut, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { validateField } from '../../utils/characterValidation';

// Supabase errors aren't always Error instances, so read `message` structurally
const getErrorMessage = (err: unknown, fallback: string) =>
  err && typeof err === 'object' && 'message' in err && typeof err.message === 'string' && err.message
    ? err.message
    : fallback;

const SettingsPanel: React.FC = () => {
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingPassword) return;
    setPasswordMessage(null);

    const passwordError = validateField('password', newPassword);
    if (passwordError) {
      setPasswordMessage({ text: passwordError, type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ text: 'Passwords do not match.', type: 'error' });
      return;
    }

    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage({ text: 'Password updated successfully!', type: 'success' });
    } catch (err: unknown) {
      console.error(err);
      setPasswordMessage({ text: getErrorMessage(err, 'Failed to update password.'), type: 'error' });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSignOutEverywhere = async () => {
    if (signingOut) return;
    if (!confirm('Sign out of all devices, including this one?')) return;
    setSigningOut(true);
    setSignOutError(null);
    try {
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) throw error;
      navigate('/login');
    } catch (err: unknown) {
      console.error(err);
      setSignOutError(getErrorMessage(err, 'Failed to sign out of all devices.'));
      setSigningOut(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 flex-1 flex flex-col">
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm -mx-8 px-8 py-4 -mt-8 border-b border-gray-100 flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
      </div>

      {/* Change Password */}
      <section className="border border-gray-100 rounded-2xl p-6">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-1">
          <KeyRound size={18} className="text-pink-500" />
          Change Password
        </h3>
        <p className="text-xs text-gray-400 mb-5">Choose a new password for your account.</p>

        {passwordMessage && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${passwordMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {passwordMessage.text}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              maxLength={72}
              autoComplete="new-password"
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-pink-500 outline-none transition-shadow"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              maxLength={72}
              autoComplete="new-password"
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-pink-500 outline-none transition-shadow"
            />
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingPassword || !newPassword || !confirmPassword}
              className="flex items-center gap-2 bg-pink-600 text-white px-8 py-3 rounded-xl hover:bg-pink-700 transition-all shadow-lg shadow-pink-100 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer font-bold text-sm"
            >
              {savingPassword ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
              {savingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </section>

      {/* Sessions */}
      <section className="border border-red-100 rounded-2xl p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-gray-800">Sign out of all devices</h3>
            <p className="text-xs text-gray-400 mt-0.5">Ends every active session, including this one.</p>
          </div>
          <button
            onClick={handleSignOutEverywhere}
            disabled={signingOut}
            className="flex items-center gap-2 border border-red-200 text-red-500 px-5 py-2.5 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-70 cursor-pointer font-semibold text-sm shrink-0"
          >
            {signingOut ? <Loader2 className="animate-spin" size={16} /> : <LogOut size={16} />}
            {signingOut ? 'Signing out...' : 'Sign Out Everywhere'}
          </button>
        </div>
        {signOutError && (
          <div className="mt-4 p-3 rounded-lg text-sm bg-red-50 text-red-700">{signOutError}</div>
        )}
      </section>
    </motion.div>
  );
};

export default SettingsPanel;
