import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { ArrowLeft, KeyRound, Mail, ShieldCheck } from 'lucide-react';
import bg from '../../assets/pink_bg.jpg';

const PasswordReset: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'code' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 1. Send Recovery Code
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      setStep('code');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Verify OTP
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'recovery',
      });
      if (error) throw error;
      setStep('reset');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Update Password
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      navigate('/login', { state: { message: 'Password reset successful! Please log in.' } });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center p-4" style={{ backgroundImage: `url(${bg})` }}>
      <div className="bg-white w-full max-w-md rounded-[20px] shadow-2xl p-10 relative overflow-hidden">
        
        {/* Back Button */}
        <button 
          onClick={() => step === 'email' ? navigate('/login') : setStep('email')}
          className="absolute top-6 left-6 text-gray-400 hover:text-pink-600 transition-colors flex items-center gap-1 text-sm font-medium cursor-pointer"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div className="flex flex-col items-center mt-4">
          <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mb-6 text-pink-600">
            {step === 'email' && <Mail size={32} />}
            {step === 'code' && <ShieldCheck size={32} />}
            {step === 'reset' && <KeyRound size={32} />}
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
            {step === 'email' && "Forgot Password"}
            {step === 'code' && "Verify Identity"}
            {step === 'reset' && "New Password"}
          </h1>
          
          <p className="text-gray-500 text-center text-sm mb-8 px-4">
            {step === 'email' && "Enter your email to receive an 8-digit recovery code."}
            {step === 'code' && `Enter the code we sent to ${email}`}
            {step === 'reset' && "Almost there! Create a secure new password for your account."}
          </p>

          {error && (
            <div className="w-full bg-red-50 text-red-600 p-3 rounded-lg text-xs mb-6 border border-red-100 animate-shake">
              {error}
            </div>
          )}

          {/* STEP 1: EMAIL */}
          {step === 'email' && (
            <form onSubmit={handleSendCode} className="w-full space-y-4">
              <input 
                type="email" required placeholder="your@email.com"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                value={email} onChange={(e) => setEmail(e.target.value)}
              />
              <button disabled={loading} className="w-full bg-pink-600 text-white py-3 rounded-xl font-bold hover:bg-pink-700 transition-all shadow-lg shadow-pink-200 cursor-pointer">
                {loading ? "Sending..." : "Send Code"}
              </button>
            </form>
          )}

          {/* STEP 2: OTP CODE (Larger Vertical Slots) */}
          {step === 'code' && (
            <form onSubmit={handleVerifyCode} className="w-full flex flex-col items-center">
              <div className="relative w-full mb-8">
                <input 
                  type="text" maxLength={8} autoFocus
                  className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-text"
                  value={code} onChange={(e) => setCode(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                />
                <div className="flex items-center justify-between gap-1">
                  {[...Array(8)].map((_, i) => (
                    <React.Fragment key={i}>
                      <div className={`relative w-10 h-16 border-b-4 flex items-center justify-center text-3xl font-bold transition-all
                        ${code.length === i ? 'border-pink-500 text-pink-600' : 'border-gray-200 text-gray-800'}
                        ${code.length > i ? 'border-pink-600' : ''}`}>
                        {code[i] || <span className="text-gray-200">_</span>}
                        {code.length === i && <div className="absolute w-0.5 h-8 bg-pink-500 animate-pulse" />}
                      </div>
                      {i === 3 && <span className="text-gray-300 font-bold text-2xl">-</span>}
                    </React.Fragment>
                  ))}
                </div>
              </div>
              <button disabled={loading} className="w-full bg-pink-600 text-white py-3 rounded-xl font-bold hover:bg-pink-700 transition-all cursor-pointer">
                {loading ? "Verifying..." : "Verify Code"}
              </button>
            </form>
          )}

          {/* STEP 3: RESET PASSWORD */}
          {step === 'reset' && (
            <form onSubmit={handleUpdatePassword} className="w-full space-y-4">
              <input 
                type="password" required placeholder="Enter new password"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none"
                value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              />
              <button disabled={loading} className="w-full bg-pink-600 text-white py-3 rounded-xl font-bold hover:bg-pink-700 transition-all cursor-pointer">
                {loading ? "Updating..." : "Update Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PasswordReset;