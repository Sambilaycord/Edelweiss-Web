import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import { supabase } from '../../lib/supabaseClient';

import LoginForm from './LoginForm'; 
import SignupForm from './SignupForm';
import '../../styles/index.css';

import logo from '../../assets/logo.png'; 
import text_logo from '../../assets/edelweiss.png'; 
import mail_receive from '../../assets/mail_receive.png'; 
import bg from '../../assets/pink_bg.jpg'; 

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formKey, setFormKey] = useState(0);
  
  // Success Modal States for Signup
  const [signupSuccess, setSuccess] = useState('');
  const [modalTitle, setModalTitle] = useState('Success!');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [tempEmail, setTempEmail] = useState(''); 

  // Handle standard Login
  const handleLogin = async (formData: any) => {
    setError('');
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });
      if (authError) throw authError;
      navigate('/');
    } catch (err: any) {
      if (err.message.includes('Email not confirmed')) {
        setTempEmail(formData.email);
        setModalTitle('Verification Required'); 
        setSuccess('Verify your email before logging in.');
        return;
      }
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Timer for Signup Resend
  React.useEffect(() => {
    if (timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [timeLeft]);

  // Handle Signup
  const handleSignup = async (formData: any) => {
    setError('');
    setLoading(true);
    setTempEmail(formData.email);
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: { data: { username: formData.username } }
      });
      if (signUpError) throw signUpError;
      setModalTitle('Success!'); 
      setSuccess('Check your email for a confirmation link.');
    } catch (err: any) {
      if (err.message.includes('already registered')) {
         setError('This account is already in use. Please log in instead.');
      } else {
        setError(err.message || 'Signup failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendMessage('');
    if (timeLeft > 0) return;
    setResendLoading(true);
    setTimeLeft(60);
    try {
      const { error } = await supabase.auth.resend({ 
        email: tempEmail, 
        type: 'signup' 
      });
      if (error) throw error;
      setResendMessage('Verification email resent. Check your inbox.');
    } catch (err: any) {
      setResendMessage('Please wait before trying again.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleCloseModal = () => {
    setSuccess('');
    setIsSignup(false);
    setError('');
    setFormKey(prev => prev + 1); // Incrementing the key forces the forms to reset
  };

  const handlePasswordReset = () => {
    navigate('/password-reset');
  };

  const toggleToSignup = () => {
    setError(''); 
    setIsSignup(true);
  };

  const toggleToLogin = () => {
    setError(''); 
    setIsSignup(false);
  };

  

  return (
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5}}
      className="min-h-screen flex items-center justify-center p-4 font-sans bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${bg})` }}
    >
      
      {/* --- Signup Success Modal --- */}
      {signupSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-40" />
          <div className="relative bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4 h-[50vh] flex flex-col items-center">
            <button
               className="absolute top-1 right-3 text-pink-600 hover:text-pink-700 text-5xl leading-none cursor-pointer"
               onClick={handleCloseModal}
            >
              ×
            </button>
            <img src={mail_receive} alt="Mail Sent" className="w-85 h-auto my-6 object-scale-down" />
            <h1 className="text-4xl font-semibold text-pink-600 mb-4">{modalTitle}</h1>
            <p className="text-center text-gray-700 mb-4">{signupSuccess}</p>
            {resendMessage && <p className="text-sm text-gray-500 mb-2">{resendMessage}</p>}
            <button
              onClick={handleResendVerification}
              disabled={resendLoading || timeLeft > 0}
              className={`mt-auto mb-2 px-4 py-2 text-white rounded-lg transition-colors ${
                resendLoading || timeLeft > 0 ? "bg-gray-400" : "bg-pink-600 hover:bg-pink-700 cursor-pointer"
              }`}
            >
              {resendLoading ? "Sending..." : timeLeft > 0 ? `Resend available in ${timeLeft}s` : "Resend Verification Email"}
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

        {/* Signup Form Container */}
        <div
          className="absolute top-0 bottom-0 w-1/2 rounded-l-[20px] shadow-xl transition-opacity duration-700"
          style={{ right: 0, opacity: isSignup ? 1 : 0, pointerEvents: isSignup ? 'auto' : 'none' }}
        >
           <SignupForm 
             key={`signup-${formKey}`}
             onSubmit={handleSignup} 
             onSwitchToLogin={toggleToLogin}
             error={isSignup ? error : ''}
             loading={loading}
           />
        </div>

        {/* Login Form Container */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1/2 bg-white shadow-xl rounded-r-[20px] transition-opacity duration-700"
          style={{ opacity: isSignup ? 0 : 1, pointerEvents: isSignup ? 'none' : 'auto' }}
        >
           <LoginForm 
             key={`login-${formKey}`}
             onSubmit={handleLogin} 
             onSwitchToSignup={toggleToSignup}
             onForgotPassword={handlePasswordReset} 
             error={!isSignup ? error : ''}
             loading={loading}
           />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LoginPage;