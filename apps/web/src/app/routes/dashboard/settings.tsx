import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';
import { Loader2, User as UserIcon, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { SEO } from '@/components/seo';

// We reuse the updateProfileSchema structure but make it flexible for the frontend
const settingsSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phone: z.string().optional().nullable(),
  prn: z.string().optional().nullable(),
  branch: z.string().optional().nullable(),
  year: z.coerce.number().min(1).max(4).optional().nullable(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function StudentSettingsPage() {
  const { user, setUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
      prn: user?.prn || '',
      branch: user?.branch || '',
      year: user?.year || null,
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: SettingsFormValues) => {
      const res = await apiClient.patch('/auth/me', data);
      return res.data.data;
    },
    onSuccess: (data) => {
      setUser(data);
      queryClient.invalidateQueries({ queryKey: ['my-registrations'] });
      toast.success('Profile updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to update profile');
    },
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiClient.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.data.url;
    },
    onSuccess: async (url) => {
      await updateMutation.mutateAsync({ ...user, avatarUrl: url } as any);
      setIsUploading(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to upload image');
      setIsUploading(false);
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    uploadAvatarMutation.mutate(file);
  };

  const onSubmit = (data: SettingsFormValues) => {
    updateMutation.mutate(data);
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl animate-fade-rise">
      <SEO title="Settings | Student Hub" />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Account Settings</h1>
        <p className="text-muted-foreground">Manage your personal information and preferences.</p>
      </div>

      <div className="glass-card rounded-3xl p-6 md:p-8 space-y-10">
        
        {/* Profile Picture Section */}
        <section className="flex flex-col sm:flex-row items-center sm:items-start gap-8 border-b border-border pb-10">
          <div className="relative group shrink-0">
            <div className="w-32 h-32 rounded-full bg-violet-600/20 border-2 border-violet-500/20 overflow-hidden flex items-center justify-center">
              {isUploading ? (
                <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
              ) : user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.firstName} className="w-full h-full object-cover" />
              ) : (
                <UserIcon size={48} className="text-violet-400" />
              )}
            </div>
            
            <label className="absolute bottom-0 right-0 w-10 h-10 bg-violet-600 hover:bg-violet-500 text-white rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-colors">
              <Camera size={18} />
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageChange}
                disabled={isUploading}
              />
            </label>
          </div>
          
          <div className="text-center sm:text-left flex-1 mt-2">
            <h3 className="text-lg font-bold text-white">Profile Picture</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Upload a professional photo to help coordinators and team members recognize you. Recommended size: 400x400px.
            </p>
            <div className="text-xs font-semibold text-amber-500 bg-amber-500/10 inline-flex items-center px-3 py-1.5 rounded-md border border-amber-500/20">
              Supported formats: JPG, PNG, WEBP. Max size 5MB.
            </div>
          </div>
        </section>

        {/* Personal Details Form */}
        <section>
          <h3 className="text-lg font-bold text-white mb-6">Personal Information</h3>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">First Name <span className="text-red-500">*</span></label>
                <input
                  {...register('firstName')}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                />
                {errors.firstName && <p className="text-red-400 text-sm mt-1">{errors.firstName.message}</p>}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Last Name <span className="text-red-500">*</span></label>
                <input
                  {...register('lastName')}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                />
                {errors.lastName && <p className="text-red-400 text-sm mt-1">{errors.lastName.message}</p>}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Email Address</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-4 py-3 bg-white/5 border border-transparent rounded-xl text-muted-foreground cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground mt-1">Email cannot be changed.</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Phone Number</label>
                <input
                  {...register('phone')}
                  placeholder="+91 9876543210"
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                />
              </div>
            </div>

            <div className="w-full h-px bg-border my-8" />

            <h3 className="text-lg font-bold text-white mb-6">Academic Details</h3>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">PRN Number</label>
                <input
                  {...register('prn')}
                  placeholder="e.g. 2021BTEIT00000"
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 uppercase"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Year of Study</label>
                <select
                  {...register('year', { valueAsNumber: true })}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 appearance-none"
                >
                  <option value="">Select Year</option>
                  <option value="1">First Year</option>
                  <option value="2">Second Year</option>
                  <option value="3">Third Year</option>
                  <option value="4">Final Year</option>
                </select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium text-white">Branch / Department</label>
                <input
                  {...register('branch')}
                  placeholder="e.g. Information Technology"
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                />
              </div>
            </div>

            <div className="pt-6 flex justify-end gap-4">
              <button
                type="submit"
                disabled={isSubmitting || updateMutation.isPending}
                className="btn-glow px-8 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {(isSubmitting || updateMutation.isPending) && <Loader2 size={18} className="animate-spin" />}
                Save Changes
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
