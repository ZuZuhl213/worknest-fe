import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, CircleAlert, MailCheck } from 'lucide-react';
import apiClient, { fetchCsrfToken, getApiErrorMessage } from '../../shared/api/client';
import Button from '../../shared/components/button';

type VerificationStatus = 'ready' | 'submitting' | 'success' | 'error';

export const VerifyEmailPage: React.FC = () => {
  const [token] = useState(() => new URLSearchParams(window.location.search).get('token') ?? '');
  const [status, setStatus] = useState<VerificationStatus>(token ? 'ready' : 'error');
  const [message, setMessage] = useState(token ? '' : 'This verification link is incomplete.');

  useEffect(() => {
    window.history.replaceState(window.history.state, '', window.location.pathname);
  }, []);

  const verifyEmail = async () => {
    if (!token) return;
    setStatus('submitting');
    setMessage('');
    try {
      await fetchCsrfToken();
      await apiClient.post('/api/auth/verify-email', { token });
      setStatus('success');
    } catch (error: unknown) {
      setStatus('error');
      setMessage(getApiErrorMessage(error, 'The verification link is invalid or has expired.'));
    }
  };

  return (
    <div className="w-full max-w-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-2xl shadow-slate-300/40 dark:shadow-black/60 rounded-3xl p-8 flex flex-col gap-6 text-center transition-colors">
      <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border ${status === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400' : status === 'error' ? 'border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-400' : 'border-indigo-200 bg-indigo-50 text-indigo-600 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-400'}`}>
        {status === 'success' ? <BadgeCheck className="h-7 w-7" aria-hidden="true" /> : status === 'error' ? <CircleAlert className="h-7 w-7" aria-hidden="true" /> : <MailCheck className="h-7 w-7" aria-hidden="true" />}
      </div>

      <div className="space-y-2">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          {status === 'success' ? 'Email verified' : status === 'error' ? 'Unable to verify email' : 'Confirm your email'}
        </h1>
        <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
          {status === 'success'
            ? 'Your account is ready. You can now sign in to WorkNest.'
            : status === 'error'
              ? message
              : 'Confirm that you want to verify the email address associated with this WorkNest account.'}
        </p>
      </div>

      {(status === 'ready' || status === 'submitting') && (
        <Button type="button" className="w-full" isLoading={status === 'submitting'} onClick={verifyEmail}>
          Verify email
        </Button>
      )}

      {status === 'success' && (
        <Link to="/login" className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700">
          Continue to sign in
        </Link>
      )}

      {status === 'error' && (
        <Link to="/login" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
          Return to sign in
        </Link>
      )}
    </div>
  );
};

export default VerifyEmailPage;
