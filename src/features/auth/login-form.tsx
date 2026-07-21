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

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginSchema = z.infer<typeof loginSchema>;

export const LoginForm: React.FC = () => {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
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

  return (
    <div className="w-full max-w-md bg-white border border-zinc-200 shadow-xs rounded-lg p-8 flex flex-col gap-6">
      <div className="flex flex-col gap-1.5 text-center">
        <h1 className="text-lg font-medium text-zinc-900">Sign in to WorkNest</h1>
        <p className="text-xs text-zinc-500">Welcome back. Enter your credentials to manage your tasks.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />
        {errors.root?.server?.message && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
            {errors.root.server.message}
          </p>
        )}
        
        <Button type="submit" className="w-full mt-2 cursor-pointer" isLoading={isSubmitting}>
          Sign In
        </Button>
      </form>

      <div className="text-center text-xs text-zinc-500">
        Don't have an account?{' '}
        <Link to="/register" className="text-indigo-600 hover:text-indigo-700 font-medium">
          Create one now
        </Link>
      </div>
    </div>
  );
};
export default LoginForm;
