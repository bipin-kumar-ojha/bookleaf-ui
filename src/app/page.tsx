
'use client';

import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import apiClient from '@/services/apiClient';
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import axios from 'axios';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthResponse {
  token: string;
  user: AuthUser;
}

interface ApiErrorResponse {
  error?: string;
  message?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';

      const payload = isLogin
        ? {
            email: formData.email.trim(),
            password: formData.password,
          }
        : {
            name: formData.name.trim(),
            email: formData.email.trim(),
            password: formData.password,
          };

      const response = await apiClient.post<AuthResponse>(
        endpoint,
        payload
      );

      const { token, user } = response.data;
      

      if (!token || !user) {
        setError('The server returned an invalid authentication response.');
        return;
      }

      const userData = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      };

      login(userData, token);
      console.log('Login response user:', response.data.user);
    } catch (err: unknown) {
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        setError(
          err.response?.data?.error ||
            err.response?.data?.message ||
            'Authentication failed. Please check your details and try again.'
        );
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const toggleAuthMode = () => {
    setIsLogin((previous) => !previous);
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-96 bg-slate-900 rounded-b-[100px] shadow-2xl transform -translate-y-20 opacity-5" />

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-8 sm:p-10 relative z-10">
        <div className="text-center mb-10">
          <img
            src="https://static.wixstatic.com/media/6d2cdc_fbad8eb25d304d57be46e9c494a1a355~mv2.jpg/v1/fill/w_360,h_162,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/book%20background%20white.jpg"
            alt="BookLeaf Publishing"
            className="h-16 mx-auto object-contain mb-6"
          />

          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {isLogin ? 'Welcome Back' : 'Create an Account'}
          </h1>

          <p className="text-sm text-slate-500 mt-2 font-medium">
            {isLogin
              ? 'Sign in to access your author portal'
              : 'Join BookLeaf to publish your journey'}
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-700 text-sm font-medium"
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div>
              <label
                htmlFor="name"
                className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide"
              >
                Full Name
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>

                <input
                  id="name"
                  type="text"
                  name="name"
                  autoComplete="name"
                  required={!isLogin}
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-300 bg-[#f8f9fa] focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all text-sm font-medium text-slate-900"
                />
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide"
            >
              Email Address
            </label>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-400" />
              </div>

              <input
                id="email"
                type="email"
                name="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="author@bookleaf.com"
                className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-300 bg-[#f8f9fa] focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all text-sm font-medium text-slate-900"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide"
            >
              Password
            </label>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>

              <input
                id="password"
                type="password"
                name="password"
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-300 bg-[#f8f9fa] focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all text-sm font-medium text-slate-900"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Please wait...
              </>
            ) : (
              <>
                {isLogin ? 'Sign In' : 'Create Account'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500 font-medium">
            {isLogin
              ? "Don't have an author account?"
              : 'Already have an account?'}{' '}

            <button
              type="button"
              onClick={toggleAuthMode}
              disabled={isLoading}
              className="text-slate-900 font-bold hover:underline transition-all disabled:opacity-50"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>

      <div className="mt-8 text-center z-10 text-slate-400 text-xs font-medium tracking-wider">
        © 2026 BOOKLEAF PUBLISHING. ALL RIGHTS RESERVED.
      </div>
    </div>
  );
}
