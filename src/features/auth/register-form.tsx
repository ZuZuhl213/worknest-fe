import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './auth-context';
import { useToast } from '../../shared/components/toast';
import Button from '../../shared/components/button';
import Input from '../../shared/components/input';
import { getApiErrorMessage, getApiFieldErrors } from '../../shared/api/client';
import { Layers } from 'lucide-react';

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  fullName: z.string().min(1, 'Full name is required').max(120, 'Full name must be under 120 characters'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter')
    .regex(/\d/, 'Password must contain at least one number'),
});

type RegisterSchema = z.infer<typeof registerSchema>;

export const RegisterForm: React.FC = () => {
  const { register: signup } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: RegisterSchema) => {
    clearErrors('root.server');
    try {
      await signup(
        data.email, 
        data.password, 
        data.fullName
      );
      toast('Registration successful!', 'success');
      navigate('/workspaces');
    } catch (error: unknown) {
      const message = getApiErrorMessage(error, 'Failed to register account');
      const fieldErrors = getApiFieldErrors(error);
      Object.entries(fieldErrors).forEach(([field, fieldMessage]) => {
        if (field === 'email' || field === 'password' || field === 'fullName') {
          setError(field, { type: 'server', message: fieldMessage });
        }
      });
      setError('root.server', { type: 'server', message });
      toast(message, 'error');
    }
  };

  return (
    <div className="w-full max-w-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-2xl shadow-slate-300/40 dark:shadow-black/60 rounded-3xl p-8 flex flex-col gap-6 text-left transition-colors">
      {/* Brand & Header */}
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 border border-indigo-400/30 mb-1">
          <Layers className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Create your account</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Get started with WorkNest task management system.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Full Name"
          type="text"
          placeholder="John Doe"
          error={errors.fullName?.message}
          {...register('fullName')}
        />
        <Input
          label="Email Address"
          type="email"
          placeholder="name@company.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Password"
          type="password"
          placeholder="At least 8 characters, letters and numbers"
          error={errors.password?.message}
          {...register('password')}
        />
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
          Register Account
        </Button>
      </form>

      <div className="text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-4">
        Already have an account?{' '}
        <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold">
          Sign in
        </Link>
      </div>
    </div>
  );
};
export default RegisterForm;
