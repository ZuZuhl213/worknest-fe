import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, MailCheck } from 'lucide-react';
import apiClient, { fetchCsrfToken, getApiErrorMessage } from '../../shared/api/client';
import Button from '../../shared/components/button';
import { useToast } from '../../shared/components/toast';

type CheckEmailLocationState = {
  email?: string;
};

export const CheckEmailPage: React.FC = () => {
  const location = useLocation();
  const { toast } = useToast();
  const email = (location.state as CheckEmailLocationState | null)?.email?.trim() ?? '';
  const [isSending, setIsSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown === 0) return;
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const resendVerification = async () => {
    if (!email || cooldown > 0) return;
    setIsSending(true);
    try {
      await fetchCsrfToken();
      await apiClient.post('/api/auth/resend-verification', { email });
      setCooldown(60);
      toast('If the account is awaiting verification, a new email has been sent.', 'success');
    } catch (error: unknown) {
      toast(getApiErrorMessage(error, 'Unable to resend the verification email'), 'error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-2xl shadow-slate-300/40 dark:shadow-black/60 rounded-3xl p-8 flex flex-col gap-6 text-center transition-colors">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-600 shadow-sm dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400">
        <MailCheck className="h-7 w-7" aria-hidden="true" />
      </div>

      <div className="space-y-2">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Check your inbox</h1>
        <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
          We sent an email verification link{email ? <> to <strong className="text-slate-700 dark:text-slate-200">{email}</strong></> : ''}.
          Open it and confirm your email before signing in.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-xs leading-5 text-slate-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-400">
        The link expires after 24 hours. Check your spam folder if it does not arrive within a few minutes.
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={!email || cooldown > 0}
        isLoading={isSending}
        onClick={resendVerification}
      >
        {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend verification email'}
      </Button>

      {!email && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Return to sign in and enter your email to request another verification link.
        </p>
      )}

      <Link to="/login" className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back to sign in
      </Link>
    </div>
  );
};

export default CheckEmailPage;
