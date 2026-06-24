import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { baseRegisterSchema } from '@itsa/shared';
import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';
import { Loader2, Eye, EyeOff, Check, X } from 'lucide-react';

const registerFormSchema = baseRegisterSchema.extend({
  confirmPassword: z.string()
}).superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Passwords don't match",
      path: ["confirmPassword"],
    });
  }
  if (data.college === 'Other' && (!data.customCollege || data.customCollege.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Custom college name is required when Other is selected',
      path: ['customCollege'],
    });
  }
  if (data.branch === 'Other' && (!data.customBranch || data.customBranch.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Custom branch name is required when Other is selected',
      path: ['customBranch'],
    });
  }
});

type RegisterFormRequest = z.infer<typeof registerFormSchema>;

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormRequest>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      year: '',
      college: '',
      branch: '',
    }
  });

  const watchCollege = watch('college');
  const watchBranch = watch('branch');
  const watchPassword = watch('password');

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, text: '', color: 'bg-white/10' };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[a-z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 2) return { score, text: 'Weak', color: 'bg-red-500' };
    if (score <= 4) return { score, text: 'Good', color: 'bg-yellow-500' };
    return { score, text: 'Strong', color: 'bg-green-500' };
  };

  const strength = getPasswordStrength(watchPassword);

  const onSubmit = async (data: RegisterFormRequest) => {
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
        {/* Personal Information */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">First Name <span className="text-red-400">*</span></label>
            <input
              {...register('firstName')}
              type="text"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-border text-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 outline-none text-sm"
            />
            {errors.firstName && <p className="text-xs text-red-400 mt-1.5">{errors.firstName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Last Name <span className="text-muted-foreground text-xs font-normal ml-1">(Optional)</span></label>
            <input
              {...register('lastName')}
              type="text"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-border text-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 outline-none text-sm"
            />
            {errors.lastName && <p className="text-xs text-red-400 mt-1.5">{errors.lastName.message}</p>}
          </div>
        </div>

        {/* Academic Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Year <span className="text-red-400">*</span></label>
            <select
              {...register('year')}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-border text-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 outline-none text-sm [&>option]:bg-[#0f0a1c]"
            >
              <option value="" disabled>Select Year</option>
              <option value="FE">First Year (FE)</option>
              <option value="SE">Second Year (SE)</option>
              <option value="TE">Third Year (TE)</option>
              <option value="BE">Fourth Year (BE)</option>
              <option value="Other">Other</option>
            </select>
            {errors.year && <p className="text-xs text-red-400 mt-1.5">{errors.year.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">PRN (Optional)</label>
            <input
              {...register('prn')}
              type="text"
              placeholder="e.g. 202100123"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-border text-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 outline-none text-sm placeholder:text-muted-foreground"
            />
            {errors.prn && <p className="text-xs text-red-400 mt-1.5">{errors.prn.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-1.5">College <span className="text-red-400">*</span></label>
          <select
            {...register('college')}
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-border text-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 outline-none text-sm [&>option]:bg-[#0f0a1c]"
          >
            <option value="" disabled>Select College</option>
            <option value="Dr. D. Y. Patil Institute of Technology, Pimpri">Dr. D. Y. Patil Institute of Technology, Pimpri</option>
            <option value="Other">Other</option>
          </select>
          {errors.college && <p className="text-xs text-red-400 mt-1.5">{errors.college.message}</p>}
        </div>

        {watchCollege === 'Other' && (
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Custom College Name <span className="text-red-400">*</span></label>
            <input
              {...register('customCollege')}
              type="text"
              placeholder="Enter your college name"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-border text-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 outline-none text-sm"
            />
            {errors.customCollege && <p className="text-xs text-red-400 mt-1.5">{errors.customCollege.message}</p>}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-white mb-1.5">Branch <span className="text-red-400">*</span></label>
          <select
            {...register('branch')}
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-border text-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 outline-none text-sm [&>option]:bg-[#0f0a1c]"
          >
            <option value="" disabled>Select Branch</option>
            <option value="Information Technology (IT)">Information Technology (IT)</option>
            <option value="Computer Engineering (COMP)">Computer Engineering (COMP)</option>
            <option value="Artificial Intelligence & Data Science (AI&DS)">Artificial Intelligence & Data Science (AI&DS)</option>
            <option value="Electronics & Telecommunication (ENTC)">Electronics & Telecommunication (ENTC)</option>
            <option value="Mechanical Engineering">Mechanical Engineering</option>
            <option value="Civil Engineering">Civil Engineering</option>
            <option value="Instrumentation Engineering">Instrumentation Engineering</option>
            <option value="Other">Other</option>
          </select>
          {errors.branch && <p className="text-xs text-red-400 mt-1.5">{errors.branch.message}</p>}
        </div>

        {watchBranch === 'Other' && (
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Custom Branch Name <span className="text-red-400">*</span></label>
            <input
              {...register('customBranch')}
              type="text"
              placeholder="Enter your branch name"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-border text-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 outline-none text-sm"
            />
            {errors.customBranch && <p className="text-xs text-red-400 mt-1.5">{errors.customBranch.message}</p>}
          </div>
        )}

        {/* Account Information */}
        <div>
          <label className="block text-sm font-medium text-white mb-1.5">Email Address <span className="text-red-400">*</span></label>
          <input
            {...register('email')}
            type="email"
            placeholder="you@example.com"
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-border text-white placeholder:text-muted-foreground focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 outline-none text-sm"
          />
          {errors.email && <p className="text-xs text-red-400 mt-1.5">{errors.email.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Password <span className="text-red-400">*</span></label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-border text-white placeholder:text-muted-foreground focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 outline-none text-sm pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {watchPassword && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden flex gap-1">
                  <div className={`h-full flex-1 ${strength.score >= 1 ? strength.color : 'bg-transparent'}`} />
                  <div className={`h-full flex-1 ${strength.score >= 3 ? strength.color : 'bg-transparent'}`} />
                  <div className={`h-full flex-1 ${strength.score >= 5 ? strength.color : 'bg-transparent'}`} />
                </div>
                <span className={`text-[10px] font-medium ${strength.color.replace('bg-', 'text-')}`}>
                  {strength.text}
                </span>
              </div>
            )}
            {errors.password && <p className="text-xs text-red-400 mt-1.5">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Confirm Password <span className="text-red-400">*</span></label>
            <div className="relative">
              <input
                {...register('confirmPassword')}
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Repeat password"
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-border text-white placeholder:text-muted-foreground focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 outline-none text-sm pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-xs text-red-400 mt-1.5">{errors.confirmPassword.message}</p>}
          </div>
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
