// src/components/auth/SignupForm.tsx
import React, { useState } from 'react';

interface SignupFormProps {
  onSubmit: (formData: any) => void;
  onSwitchToLogin: () => void;
  error?: string;
  loading?: boolean;
}

const SignupForm: React.FC<SignupFormProps> = ({ onSubmit, onSwitchToLogin, error, loading }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ email, password, username });
  };

  return (
    <div className="w-full flex flex-col justify-center p-12 h-full">
      <h1 className="text-4xl font-bold text-pink-600 text-center">Create an account</h1>
      <p className="mt-2 text-gray-600 text-center">Sign up to start using Edelweiss</p>

      <form className="mt-6 w-full" onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 p-2 text-sm text-red-600 bg-red-100 rounded border border-red-200">
            {error}
          </div>
        )}

        <div className="mb-3">
          <label className="block text-gray-700 mb-1">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            placeholder="Your name"
          />
        </div>

        <div className="mb-3">
          <label className="block text-gray-700 mb-1">Email</label>
          <input
            type="email"
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
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            placeholder="Password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-3 w-full bg-pink-600 text-white py-2 rounded-lg hover:bg-pink-700 cursor-pointer transition disabled:opacity-50"
        >
          {loading ? 'Signing Up...' : 'Sign Up'}
        </button>

        <div className="mt-3 text-sm text-gray-600 text-center">
          Already have an account?{' '}
          <button type="button" onClick={onSwitchToLogin} className="text-pink-600 underline cursor-pointer">
            Log in
          </button>
        </div>
      </form>
    </div>
  );
};

export default SignupForm;