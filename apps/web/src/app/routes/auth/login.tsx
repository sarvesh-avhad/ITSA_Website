import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { loginSchema, type LoginRequest } from '@itsa/shared';
import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginRequest) => {
    try {
      setIsLoading(true);
      const res = await apiClient.post('/auth/login', data);
      const { user, tokens } = res.data.data;
      login(user, tokens.accessToken);
      toast.success('Logged in successfully');
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-xl font-bold text-white">Welcome back</h2>
        <p className="text-sm text-muted-foreground mt-1">Enter your credentials to continue</p>
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

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-white">Password</label>
            <Link to="/auth/forgot-password" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
              Forgot password?
            </Link>
          </div>
          <input
            {...register('password')}
            type="password"
            placeholder="••••••••"
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-border text-white placeholder:text-muted-foreground focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all outline-none text-sm"
          />
          {errors.password && <p className="text-xs text-red-400 mt-1.5">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white font-semibold text-sm shadow-lg shadow-violet-600/20 hover:shadow-violet-500/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-6 btn-glow"
        >
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Sign In'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        Don't have an account?{' '}
        <Link to="/auth/register" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
          Register here
        </Link>
      </div>
    </div>
  );
}
