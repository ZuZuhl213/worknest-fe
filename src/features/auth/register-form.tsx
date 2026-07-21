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
    <div className="w-full max-w-md bg-white border border-zinc-200 shadow-xs rounded-lg p-8 flex flex-col gap-6">
      <div className="flex flex-col gap-1.5 text-center">
        <h1 className="text-lg font-medium text-zinc-900">Create your account</h1>
        <p className="text-xs text-zinc-500">Get started with WorkNest task management system.</p>
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
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
            {errors.root.server.message}
          </p>
        )}

        
        <Button type="submit" className="w-full mt-2 cursor-pointer" isLoading={isSubmitting}>
          Register Account
        </Button>
      </form>

      <div className="text-center text-xs text-zinc-500">
        Already have an account?{' '}
        <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
          Sign in
        </Link>
      </div>
    </div>
  );
};
export default RegisterForm;
