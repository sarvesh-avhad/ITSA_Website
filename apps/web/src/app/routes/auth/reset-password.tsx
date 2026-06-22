import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { resetPasswordSchema } from '@itsa/shared';
import { z } from 'zod';
import apiClient from '@/lib/api-client';
import { Loader2, ArrowLeft } from 'lucide-react';

const localSchema = resetPasswordSchema.extend({
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
});

type FormData = z.infer<typeof localSchema>;

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(localSchema),
    defaultValues: { token: token || '' },
  });

  const onSubmit = async (data: FormData) => {
    if (!token) {
      toast.error('Invalid or missing reset token');
      return;
    }

    try {
      setIsLoading(true);
      await apiClient.post('/auth/reset-password', data);
      toast.success('Password reset successfully');
      navigate('/auth/login');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center">
        <h2 className="text-xl font-bold text-white mb-2">Invalid Link</h2>
        <p className="text-sm text-muted-foreground mb-8">
          This password reset link is invalid or has expired.
        </p>
        <Link
          to="/auth/forgot-password"
          className="inline-flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 font-medium transition-colors"
        >
          Request new link
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-xl font-bold text-white">Set New Password</h2>
        <p className="text-sm text-muted-foreground mt-1">Please enter your new password below.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input type="hidden" {...register('token')} />

        <div>
          <label className="block text-sm font-medium text-white mb-1.5">New Password</label>
          <input
            {...register('password')}
            type="password"
            placeholder="Min. 8 characters"
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-border text-white placeholder:text-muted-foreground focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all outline-none text-sm"
          />
          {errors.password && <p className="text-xs text-red-400 mt-1.5">{errors.password.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-1.5">Confirm Password</label>
          <input
            {...register('confirmPassword')}
            type="password"
            placeholder="Min. 8 characters"
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-border text-white placeholder:text-muted-foreground focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all outline-none text-sm"
          />
          {errors.confirmPassword && <p className="text-xs text-red-400 mt-1.5">{errors.confirmPassword.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white font-semibold text-sm shadow-lg shadow-violet-600/20 hover:shadow-violet-500/30 transition-all disabled:opacity-70 mt-6 btn-glow"
        >
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Reset Password'}
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
