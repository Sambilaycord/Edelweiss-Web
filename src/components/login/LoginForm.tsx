// src/components/auth/LoginForm.tsx
import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface LoginFormProps {
  onSubmit: (formData: any) => void;
  onSwitchToSignup: () => void;
  error?: string;
  loading?: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSubmit, onSwitchToSignup, error, loading }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ email, password });
  };

  return (
    <div className="w-full flex flex-col justify-center p-12 h-full">
      <h1 className="text-4xl font-bold text-pink-600">Welcome Back!</h1>
      <p className="mt-4 text-gray-600">Log in to your Edelweiss account</p>

      <form className="mt-8 w-full" onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 p-2 text-sm text-red-600 bg-red-100 rounded border border-red-200">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="login-email">Email</label>
          <input
            type="email"
            id="login-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            placeholder="Enter your email"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="login-password">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="login-password"
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
          disabled={loading}
          className="mt-4 w-full bg-pink-600 text-white py-2 rounded-lg hover:bg-pink-700 cursor-pointer transition duration-300 disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Log In'}
        </button>
      </form>

      <p className="mt-4 text-gray-600">
        Don't have an account?{' '}
        <button type="button" onClick={onSwitchToSignup} className="text-pink-600 underline cursor-pointer">
          Sign up
        </button>
      </p>
    </div>
  );
};

export default LoginForm;