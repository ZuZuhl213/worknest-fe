import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './auth-context';
import { useToast } from '../../shared/components/toast';
import Button from '../../shared/components/button';
import Input from '../../shared/components/input';
import Modal from '../../shared/components/modal';
import apiClient, { getApiErrorCode, getApiErrorMessage, getApiFieldErrors } from '../../shared/api/client';
import { Layers, Sparkles, Lock, Mail } from 'lucide-react';
import GoogleLoginButton from './google-login-button';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginSchema = z.infer<typeof loginSchema>;

export const LoginForm: React.FC = () => {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginSchema) => {
    clearErrors('root.server');
    try {
      await login(data.email, data.password);
      toast('Welcome back to WorkNest!', 'success');
      navigate('/workspaces');
    } catch (error: unknown) {
      if (getApiErrorCode(error) === 'EMAIL_NOT_VERIFIED') {
        toast('Verify your email before signing in.', 'error');
        navigate('/check-email', { state: { email: data.email } });
        return;
      }
      const message = getApiErrorMessage(error, 'Invalid email or password');
      const fieldErrors = getApiFieldErrors(error);
      Object.entries(fieldErrors).forEach(([field, fieldMessage]) => {
        if (field === 'email' || field === 'password') {
          setError(field, { type: 'server', message: fieldMessage });
        }
      });
      setError('root.server', { type: 'server', message });
      toast(message, 'error');
    }
  };

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;

    setIsSendingReset(true);
    try {
      await apiClient.post('/api/auth/forgot-password', { email: resetEmail });
      toast(`Verification & reset link dispatched to ${resetEmail}`, 'success');
      setResetModalOpen(false);
      setResetEmail('');
    } catch (error: unknown) {
      toast(getApiErrorMessage(error, 'Failed to send verification email'), 'error');
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-2xl shadow-slate-300/40 dark:shadow-black/60 rounded-3xl p-8 flex flex-col gap-6 text-left transition-colors">
      {/* Brand & Form Header */}
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 border border-indigo-400/30 mb-1">
          <Layers className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="flex items-center gap-1.5">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Sign in to WorkNest</h1>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">Welcome back. Enter your credentials to manage your tasks.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Email Address"
          type="email"
          placeholder="name@company.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <div className="flex flex-col gap-1">
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
          />
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => setResetModalOpen(true)}
              className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors cursor-pointer"
            >
              Sign in via email link / Forgot password?
            </button>
          </div>
        </div>

        {errors.root?.server?.message && (
          <p className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 px-3 py-2 text-xs font-medium text-rose-700 dark:text-rose-400">
            {errors.root.server.message}
          </p>
        )}

        <Button
          type="submit"
          className="w-full mt-2 cursor-pointer bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold text-sm shadow-md shadow-indigo-500/25 rounded-xl py-2.5 border-0"
          isLoading={isSubmitting}
        >
          Sign In
        </Button>
      </form>

      <GoogleLoginButton />

      <div className="text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-4">
        Don't have an account?{' '}
        <Link to="/register" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold">
          Create one now
        </Link>
      </div>

      {/* Forgot Password / Magic Link Modal */}
      <Modal isOpen={resetModalOpen} onClose={() => setResetModalOpen(false)} title="Reset Password / Email Link">
        <form onSubmit={handleSendResetEmail} className="flex flex-col gap-4 text-left">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Enter your email address and we will dispatch a verification link to reset your password or sign in.
          </p>
          <Input
            label="Email Address"
            type="email"
            placeholder="colleague@company.com"
            required
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer rounded-xl"
              onClick={() => setResetModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="cursor-pointer rounded-xl" isLoading={isSendingReset}>
              Send Link
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LoginForm;
