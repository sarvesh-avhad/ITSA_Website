import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { registerSchema, type RegisterRequest } from '@itsa/shared';
import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';
import { Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterRequest>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterRequest) => {
    try {
      setIsLoading(true);
      const res = await apiClient.post('/auth/register', data);
      const { user, tokens } = res.data.data;
      login(user, tokens.accessToken);
      toast.success('Registration successful! Welcome to ITSA.');
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-xl font-bold text-white">Create an account</h2>
        <p className="text-sm text-muted-foreground mt-1">Join the ITSA platform</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">First Name</label>
            <input
              {...register('firstName')}
              type="text"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-border text-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 outline-none text-sm"
            />
            {errors.firstName && <p className="text-xs text-red-400 mt-1.5">{errors.firstName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Last Name</label>
            <input
              {...register('lastName')}
              type="text"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-border text-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 outline-none text-sm"
            />
            {errors.lastName && <p className="text-xs text-red-400 mt-1.5">{errors.lastName.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-1.5">Email</label>
          <input
            {...register('email')}
            type="email"
            placeholder="you@college.edu"
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-border text-white placeholder:text-muted-foreground focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 outline-none text-sm"
          />
          {errors.email && <p className="text-xs text-red-400 mt-1.5">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-1.5">Password</label>
          <input
            {...register('password')}
            type="password"
            placeholder="Min. 8 characters"
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-border text-white placeholder:text-muted-foreground focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 outline-none text-sm"
          />
          {errors.password && <p className="text-xs text-red-400 mt-1.5">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white font-semibold text-sm shadow-lg shadow-violet-600/20 hover:shadow-violet-500/30 transition-all disabled:opacity-70 mt-6 btn-glow"
        >
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Register'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/auth/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
          Sign In
        </Link>
      </div>
    </div>
  );
}
