import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import logo from '../../assets/logo.png';
import text_logo from '../../assets/edelweiss.png';
import mail_receive from '../../assets/mail_receive.png';
import { Eye, EyeOff } from 'lucide-react';
import bg from '../../assets/pink_bg.jpg';

const LoginPage: React.FC = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setloading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [signupSuccess, setSuccess] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (authError) throw authError;

      console.log('Login successful:', data);
      // Redirect here (e.g., navigate('/dashboard'))

    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setloading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: { 
            username: username,
          }
        }
      });

      if (signUpError) throw signUpError;
      setSuccess('Check your email for a confirmation link.');
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setloading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendMessage('');
    setResendLoading(true);
    try {
      const anyAuth = (supabase.auth as any);
      if (anyAuth && typeof anyAuth.resend === 'function') {
        await anyAuth.resend({ email, type: 'signup' });
      } else {
        // fallback: send a magic link/otp which will reach the user's email
        const { error } = await supabase.auth.signInWithOtp({ email });
        if (error) throw error;
      }
      setResendMessage('Verification email resent. Check your inbox.');
    } catch (err: any) {
      setResendMessage(err.message || 'Failed to resend verification email');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 font-sans bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${bg})` }}
    >
      {signupSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-40" />
          <div className="relative bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4 h-[50vh] overflow-auto flex flex-col">
            <button
              aria-label="Close"
              className="absolute top-2 right-3 text-pink-600 hover:text-pink-700 text-5xl leading-none cursor-pointer"
              onClick={() => {
                setSuccess('');
                setIsSignup(false);
                setResendMessage('');
              }}
            >
              ×
            </button>
            <img
              src={mail_receive}
              alt="Mail Receive"
              className={`w-120 h-50 my-4 object-contain mx-auto`}
            />
            <h1 className="text-4xl text-center font-semibold text-pink-600 mb-4">Success!</h1>
            <p className="text-base text-center text-black ">{signupSuccess}</p>
            {resendMessage && (
              <p className="text-sm text-gray-600 mb-3">{resendMessage}</p>
            )}
            <div className="mt-auto flex justify-center items-center py-4">
              <button
                className="px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700 disabled:opacity-60 cursor-pointer"
                onClick={handleResendVerification}
                disabled={resendLoading}
              >
                {resendLoading ? 'Sending...' : 'Resend Verification Email'}
              </button>
            </div>
          </div>
        </div>
      )}
        <div className="relative w-full bg-white max-w-4xl rounded-[20px] shadow-md overflow-hidden min-h-[550px] flex items-center justify-end">
          <div
            className={`absolute top-0 bottom-0 w-1/2 flex flex-col items-center justify-center p-12 transition-transform duration-700 ease-in-out z-20`}
            style={{ right: 0, transform: isSignup ? 'translateX(-100%)' : 'translateX(0)' }}
          >
            <img
              src={logo}
              alt="Edelweiss Logo"
              className={`mb-4 w-32 h-32 object-contain transition-all duration-700`}
            />
            <img
              src={text_logo}
              alt="Edelweiss Text Logo"
              className={`mb-8 w-48 h-auto object-contain transition-transform duration-700`}
            />
          </div>

          <div
            className={`absolute top-0 bottom-0 w-1/2 rounded-l-[20px] shadow-xl flex flex-col justify-center p-12 transition-opacity duration-700`}
            style={{ right: 0, opacity: isSignup ? 1 : 0, pointerEvents: isSignup ? 'auto' : 'none' }}
          >
            <h1 className="text-4xl font-bold text-pink-600 text-center">Create an account</h1>
            <p className="mt-2 text-gray-600 text-center">Sign up to start using Edelweiss</p>
            <form className="mt-6 w-full" onSubmit={handleSignup}>
              {error && (
                  <div className="mb-4 p-2 text-sm text-red-600 bg-red-100 rounded border border-red-200">
                    {error}
                  </div>
                )}

              <div className="mb-3">
                <label className="block text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  id="username"
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg" 
                  placeholder="Your name"
                />
              </div>
              
              <div className="mb-3">
                <label className="block text-gray-700 mb-1">Email</label>
                <input 
                type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg" 
                  placeholder="Email" 
                  required
                />
              </div>
              
              <div className="mb-3">
                <label className="block text-gray-700 mb-1">Password</label>
                <input
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg" 
                  placeholder="Password" 
                />
              </div>
              
              <button
                type="submit" 
                className="mt-3 w-full bg-pink-600 text-white py-2 rounded-lg hover:bg-pink-700 cursor-pointer transition">
                Sign Up
              </button>
              <div className="mt-3 text-sm text-gray-600 text-center">Already have an account? <button type="button" onClick={() => setIsSignup(false)} className="text-pink-600 underline cursor-pointer">Log in</button></div>
            </form>
          </div>

          <div
            className={`absolute left-0 top-0 bottom-0 w-1/2 items-center bg-white shadow-xl flex flex-col justify-center p-12 rounded-r-[20px] transition-opacity duration-700`}
            style={{ opacity: isSignup ? 0 : 1, pointerEvents: isSignup ? 'none' : 'auto' }}
          >
             <h1 className="text-4xl font-bold text-pink-600">Welcome Back!</h1>
             <p className="mt-4 text-gray-600">Log in to your Edelweiss account</p>
             
             <form className="mt-8 w-full" onSubmit={handleLogin}>
                {error && (
                  <div className="mb-4 p-2 text-sm text-red-600 bg-red-100 rounded border border-red-200">
                    {error}
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-gray-700 mb-2" htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 mb-2" htmlFor="password">Password</label>
                  <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 pr-10" 
                        placeholder="Enter your password"
                        required
                      />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="mt-4 w-full bg-pink-600 text-white py-2 rounded-lg hover:bg-pink-700 cursor-pointer transition duration-300"
                >
                  Log In
                </button>
             </form>

             <p className="mt-4 text-gray-600">Don't have an account? <button type="button" onClick={() => setIsSignup(true)} className="text-pink-600 underline cursor-pointer">Sign up</button></p>
          </div>
        </div>
    </div>
  );
};

export default LoginPage;