import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import logo from '../../assets/logo.png';
import text_logo from '../../assets/edelweiss.png';
import { Eye, EyeOff } from 'lucide-react';
import bg from '../../assets/pink_bg.jpg';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

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

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 font-sans bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${bg})` }}
    >
        <div className="relative w-full bg-white max-w-4xl rounded-[20px] shadow-md overflow-hidden min-h-[550px] flex items-center justify-end">
          
          <div className="w-1/2 flex flex-col items-center justify-center p-12">
            <img src={logo} alt="Edelweiss Logo" className="mb-4 w-32 h-32 object-contain" />
            <img src={text_logo} alt="Edelweiss Text Logo" className="mb-8 w-48 h-auto object-contain" />
          </div>

          <div className="absolute left-0 top-0 bottom-0 w-1/2 items-center bg-white shadow-xl flex flex-col justify-center p-12 rounded-r-[20px]">
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
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="mt-4 w-full bg-pink-600 text-white py-2 rounded-lg hover:bg-pink-700 transition duration-300"
                >
                  Log In
                </button>
             </form>

             <p className="mt-4 text-gray-600">Don't have an account? <a href="#" className="text-pink-600 underline">Sign up</a></p>
          </div>
        </div>
    </div>
  );
};

export default LoginPage;