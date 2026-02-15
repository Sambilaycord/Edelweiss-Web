import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import logo from '../../assets/logo.png'; 
import text_logo from '../../assets/edelweiss.png'; 
import mail_receive from '../../assets/mail_receive.png';
import bg from '../../assets/pink_bg.jpg'; 

// Import the new components
import LoginForm from './LoginForm'; 
import SignupForm from './SignupForm';

const LoginPage: React.FC = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Success Modal States
  const [signupSuccess, setSuccess] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  // We need to store email temporarily for the resend function
  const [tempEmail, setTempEmail] = useState(''); 

  const handleLogin = async (formData: any) => {
    setError('');
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });
      if (authError) throw authError;
      console.log('Login successful:', data);
      // Navigate to dashboard here
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  const handleSignup = async (formData: any) => {
    setError('');
    setLoading(true);
    setTempEmail(formData.email); // Store for potential resend
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: { data: { username: formData.username } }
      });
      if (signUpError) throw signUpError;
      setSuccess('Check your email for a confirmation link.');
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendMessage('');
    setResendLoading(true);
    try {
      const { error } = await supabase.auth.resend({ 
        email: tempEmail, 
        type: 'signup' 
      });
      if (error) throw error;
      setResendMessage('Verification email resent. Check your inbox.');
    } catch (err: any) {
      setResendMessage(err.message || 'Failed to resend');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1}}
      className="min-h-screen flex items-center justify-center p-4 font-sans bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${bg})` }}
    >
      
      {/* --- Success Modal (Overlay) --- */}
      {signupSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-40" />
          <div className="relative bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4 h-[50vh] flex flex-col items-center">
            <button
               className="absolute top-2 right-3 text-pink-600 hover:text-pink-700 text-4xl leading-none"
               onClick={() => { setSuccess(''); setIsSignup(false); }}
            >
              ×
            </button>
            <img src={mail_receive} alt="Mail Sent" className="w-40 h-auto my-4 object-contain" />
            <h1 className="text-3xl font-semibold text-pink-600 mb-2">Success!</h1>
            <p className="text-center text-gray-700 mb-4">{signupSuccess}</p>
            {resendMessage && <p className="text-sm text-gray-500 mb-2">{resendMessage}</p>}
            <button
              onClick={handleResendVerification}
              disabled={resendLoading}
              className="mt-auto px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700 disabled:opacity-50"
            >
              {resendLoading ? 'Sending...' : 'Resend Verification Email'}
            </button>
          </div>
        </div>
      )}

      {/* --- Main Sliding Card --- */}
      <motion.div 
        initial={{ y: 50, opacity: 0 }} // Starts 50px down and invisible
        animate={{ y: 0, opacity: 1 }}  // Moves to center and becomes visible
        exit={{ y: 50, opacity: 0 }}    // Slides back down when leaving
        transition={{ 
          type: "spring",               // "spring" gives it a slight bounce effect
          stiffness: 100, 
          damping: 20, 
          delay: 0.2                    // Waits 0.2s so background loads first
        }}
        className="relative w-full bg-white max-w-4xl rounded-[20px] shadow-md overflow-hidden min-h-[550px] flex"
        >
        {/* 1. Sliding Logo Panel */}
        <div
          className="absolute top-0 bottom-0 w-1/2 flex flex-col items-center justify-center p-12 transition-transform duration-700 ease-in-out z-20"
          style={{ right: 0, transform: isSignup ? 'translateX(-100%)' : 'translateX(0)' }}
        >
          <img src={logo} alt="Logo" className="mb-4 w-32 h-32 object-contain" />
          <img src={text_logo} alt="Edelweiss" className="mb-8 w-48 h-auto object-contain" />
        </div>

        {/* 2. Signup Form Container (Left side) */}
        <div
          className="absolute top-0 bottom-0 w-1/2 rounded-l-[20px] shadow-xl transition-opacity duration-700"
          style={{ right: 0, opacity: isSignup ? 1 : 0, pointerEvents: isSignup ? 'auto' : 'none' }}
        >
           <SignupForm 
             onSubmit={handleSignup} 
             onSwitchToLogin={() => setIsSignup(false)} 
             error={isSignup ? error : ''}
             loading={loading}
           />
        </div>

        {/* 3. Login Form Container (Right side) */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1/2 bg-white shadow-xl rounded-r-[20px] transition-opacity duration-700"
          style={{ opacity: isSignup ? 0 : 1, pointerEvents: isSignup ? 'none' : 'auto' }}
        >
           <LoginForm 
             onSubmit={handleLogin} 
             onSwitchToSignup={() => setIsSignup(true)} 
             error={!isSignup ? error : ''}
             loading={loading}
           />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LoginPage;