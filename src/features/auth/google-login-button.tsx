import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../shared/components/toast';
import { getApiErrorMessage } from '../../shared/api/client';
import { useTheme } from '../../shared/theme/theme-context';
import { useAuth } from './auth-context';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

export const GoogleLoginButton: React.FC = () => {
  const { loginWithGoogle } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!googleClientId) return null;

  const handleCredential = async (credential?: string) => {
    if (!credential || isSubmitting) {
      if (!credential) toast('Google did not return a valid credential.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await loginWithGoogle(credential);
      toast('Signed in with Google.', 'success');
      navigate(response.user.systemRole === 'SYSTEM_ADMIN' ? '/admin' : '/workspaces');
    } catch (error: unknown) {
      toast(getApiErrorMessage(error, 'Unable to sign in with Google'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-wider text-slate-400">
        <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
        or continue with
        <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
      </div>
      <div className={`flex min-h-10 w-full justify-center overflow-hidden ${isSubmitting ? 'pointer-events-none opacity-60' : ''}`}>
        <GoogleLogin
          onSuccess={(response) => void handleCredential(response.credential)}
          onError={() => toast('Google sign-in was cancelled or failed.', 'error')}
          shape="pill"
          size="large"
          text="continue_with"
          width="336"
          theme={resolvedTheme === 'dark' ? 'filled_black' : 'outline'}
        />
      </div>
    </div>
  );
};

export default GoogleLoginButton;
