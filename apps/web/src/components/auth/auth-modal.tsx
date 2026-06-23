import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { loginSchema, type LoginRequest } from '@itsa/shared';
import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';
import { Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

// Quick register schema for the modal
const registerSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type RegisterRequest = z.infer<typeof registerSchema>;

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultMode?: 'login' | 'register';
}

export function AuthModal({ isOpen, onClose, onSuccess, defaultMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
  const [isLoading, setIsLoading] = useState(false);
  const loginFn = useAuthStore((state) => state.login);

  const loginForm = useForm<LoginRequest>({ resolver: zodResolver(loginSchema) });
  const registerForm = useForm<RegisterRequest>({ resolver: zodResolver(registerSchema) });

  const onLoginSubmit = async (data: LoginRequest) => {
    try {
      setIsLoading(true);
      const res = await apiClient.post('/auth/login', data);
      const { user, tokens } = res.data.data;
      loginFn(user, tokens.accessToken);
      toast.success('Logged in successfully');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  const onRegisterSubmit = async (data: RegisterRequest) => {
    try {
      setIsLoading(true);
      await apiClient.post('/auth/register', data);
      
      // Auto-login after register
      const loginRes = await apiClient.post('/auth/login', { email: data.email, password: data.password });
      const { user, tokens } = loginRes.data.data;
      loginFn(user, tokens.accessToken);
      
      toast.success('Account created successfully');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to register');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={onClose} 
          />
          
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            exit={{ scale: 0.95, opacity: 0, y: 20 }} 
            className="relative w-full max-w-md bg-background/80 backdrop-blur-2xl border border-border rounded-3xl overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors z-10"
            >
              <X size={20} />
            </button>

            <div className="p-8">
              <div className="text-center mb-8">
                <div className="w-12 h-12 bg-violet-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-violet-500/20">
                  <img src="/ITSA_logo.png" alt="Logo" className="w-6 h-6 object-contain" />
                </div>
                <h2 className="text-2xl font-bold text-white">
                  {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className="text-sm text-muted-foreground mt-2">
                  {mode === 'login' 
                    ? 'Sign in to register for events and manage your profile.' 
                    : 'Join ITSA to participate in exclusive events.'}
                </p>
              </div>

              {mode === 'login' ? (
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-1.5">Email</label>
                    <input
                      {...loginForm.register('email')}
                      type="email"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-border text-white placeholder:text-muted-foreground focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 outline-none text-sm transition-all"
                    />
                    {loginForm.formState.errors.email && <p className="text-xs text-red-400 mt-1">{loginForm.formState.errors.email.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-1.5">Password</label>
                    <input
                      {...loginForm.register('password')}
                      type="password"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-border text-white placeholder:text-muted-foreground focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 outline-none text-sm transition-all"
                    />
                    {loginForm.formState.errors.password && <p className="text-xs text-red-400 mt-1">{loginForm.formState.errors.password.message}</p>}
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 text-white font-bold hover:bg-violet-500 disabled:opacity-50 transition-colors btn-glow"
                  >
                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Sign In'}
                  </button>
                  <p className="text-center text-sm text-muted-foreground mt-4">
                    Don't have an account?{' '}
                    <button type="button" onClick={() => setMode('register')} className="text-violet-400 hover:text-white font-medium">Register</button>
                  </p>
                </form>
              ) : (
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-1.5">First Name</label>
                      <input
                        {...registerForm.register('firstName')}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-border text-white outline-none text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50"
                      />
                      {registerForm.formState.errors.firstName && <p className="text-xs text-red-400 mt-1">{registerForm.formState.errors.firstName.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-1.5">Last Name</label>
                      <input
                        {...registerForm.register('lastName')}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-border text-white outline-none text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50"
                      />
                      {registerForm.formState.errors.lastName && <p className="text-xs text-red-400 mt-1">{registerForm.formState.errors.lastName.message}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-1.5">Email</label>
                    <input
                      {...registerForm.register('email')}
                      type="email"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-border text-white outline-none text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50"
                    />
                    {registerForm.formState.errors.email && <p className="text-xs text-red-400 mt-1">{registerForm.formState.errors.email.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-1.5">Password</label>
                    <input
                      {...registerForm.register('password')}
                      type="password"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-border text-white outline-none text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50"
                    />
                    {registerForm.formState.errors.password && <p className="text-xs text-red-400 mt-1">{registerForm.formState.errors.password.message}</p>}
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 text-white font-bold hover:bg-violet-500 disabled:opacity-50 transition-colors btn-glow"
                  >
                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Create Account'}
                  </button>
                  <p className="text-center text-sm text-muted-foreground mt-4">
                    Already have an account?{' '}
                    <button type="button" onClick={() => setMode('login')} className="text-violet-400 hover:text-white font-medium">Sign In</button>
                  </p>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
