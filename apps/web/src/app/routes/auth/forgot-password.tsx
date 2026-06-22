import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { forgotPasswordSchema, type ForgotPasswordRequest } from '@itsa/shared';
import apiClient from '@/lib/api-client';
import { Loader2, ArrowLeft, MailCheck } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordRequest>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordRequest) => {
    try {
      setIsLoading(true);
      await apiClient.post('/auth/forgot-password', data);
      setIsSent(true);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-violet-600/10 flex items-center justify-center mx-auto mb-6">
          <MailCheck size={32} className="text-violet-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Check your email</h2>
        <p className="text-sm text-muted-foreground mb-8">
          We've sent password reset instructions to your email address.
        </p>
        <Link
          to="/auth/login"
          className="inline-flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 font-medium transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Login
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-xl font-bold text-white">Reset Password</h2>
        <p className="text-sm text-muted-foreground mt-1">Enter your email to receive a reset link</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white mb-1.5">Email</label>
          <input
            {...register('email')}
            type="email"
            placeholder="you@college.edu"
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-border text-white placeholder:text-muted-foreground focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all outline-none text-sm"
          />
          {errors.email && <p className="text-xs text-red-400 mt-1.5">{errors.email.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white font-semibold text-sm shadow-lg shadow-violet-600/20 hover:shadow-violet-500/30 transition-all disabled:opacity-70 mt-6 btn-glow"
        >
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Send Reset Link'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link
          to="/auth/login"
          className="inline-flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 font-medium transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Login
        </Link>
      </div>
    </div>
  );
}
