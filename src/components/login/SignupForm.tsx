import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface SignupFormProps {
  onSubmit: (formData: any) => void;
  onSwitchToLogin: () => void;
  error?: string;
  loading?: boolean;
}

const SignupForm: React.FC<SignupFormProps> = ({ onSubmit, onSwitchToLogin, error, loading }) => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (password !== confirmPassword) {
      setLocalError("Passwords do not match.");
      return;
    }

    onSubmit({ email, password, username });
  };

  return (
    <div className="w-full flex flex-col justify-center p-12 h-full">
      <h1 className="text-4xl font-bold text-pink-600 text-center">Create an account</h1>
      <p className="mt-2 text-gray-600 text-center">Sign up to start using Edelweiss</p>

      <form className="mt-6 w-full" onSubmit={handleSubmit}>
        {(error || localError) && (
          <div className="mb-4 p-2 text-sm text-red-600 bg-red-100 rounded border border-red-200 animate-shake">
            {localError || error}
          </div>
        )}

        <div className="mb-3">
          <label className="block text-gray-700 mb-1 text-sm font-medium">Username</label>
          <input
            type="text"
            value={username}
            maxLength={20}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
            placeholder="Username"
            required
          />
        </div>

        <div className="mb-3">
          <label className="block text-gray-700 mb-1 text-sm font-medium">Email</label>
          <input
            type="email"
            value={email}
            maxLength={254}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
            placeholder="Email"
            required
          />
        </div>

        {/* Password Field */}
        <div className="mb-3">
          <label className="block text-gray-700 mb-1 text-sm font-medium">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              maxLength={64}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none pr-10"
              placeholder="Password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Confirm Password Field */}
        <div className="mb-3">
          <label className="block text-gray-700 mb-1 text-sm font-medium">Confirm Password</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              maxLength={64}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none pr-10"
              placeholder="Re-enter password"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full bg-pink-600 text-white py-2 rounded-lg hover:bg-pink-700 cursor-pointer transition shadow-lg shadow-pink-100 disabled:opacity-50"
        >
          {loading ? 'Signing Up...' : 'Sign Up'}
        </button>

        <div className="mt-4 text-sm text-gray-600 text-center">
          Already have an account?{' '}
          <button type="button" onClick={onSwitchToLogin} className="text-pink-600 underline font-medium cursor-pointer">
            Log in
          </button>
        </div>
      </form>
    </div>
  );
};

export default SignupForm;