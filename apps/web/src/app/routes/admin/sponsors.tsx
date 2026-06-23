import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Edit, Save, X, Loader2, Image as ImageIcon, Link as LinkIcon, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// Quick schema
const sponsorSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  slug: z.string().min(2, 'Slug is required'),
  description: z.string().optional(),
  logoUrl: z.string().url('Invalid URL'),
  websiteUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  tier: z.enum(['GOLD', 'SILVER', 'BRONZE']),
  isActive: z.boolean(),
  sortOrder: z.coerce.number().int().default(0),
});

type SponsorForm = z.infer<typeof sponsorSchema>;

export default function AdminSponsorsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-sponsors'],
    queryFn: async () => {
      const res = await apiClient.get('/sponsors');
      return res.data.data;
    },
  });

  const form = useForm<SponsorForm>({
    resolver: zodResolver(sponsorSchema),
    defaultValues: {
      name: '', slug: '', description: '', logoUrl: '', websiteUrl: '', tier: 'SILVER', isActive: true, sortOrder: 0
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: SponsorForm) => {
      const res = await apiClient.post('/sponsors', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sponsors'] });
      toast.success('Sponsor added');
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Failed to add sponsor');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SponsorForm> }) => {
      const res = await apiClient.patch(`/sponsors/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sponsors'] });
      toast.success('Sponsor updated');
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Failed to update');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/sponsors/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sponsors'] });
      toast.success('Sponsor deleted');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Failed to delete');
    },
  });

  const openEditModal = (item: any) => {
    form.reset({
      name: item.name,
      slug: item.slug,
      description: item.description || '',
      logoUrl: item.logoUrl,
      websiteUrl: item.websiteUrl || '',
      tier: item.tier,
      isActive: item.isActive,
      sortOrder: item.sortOrder,
    });
    setEditingId(item.id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    form.reset({ name: '', slug: '', description: '', logoUrl: '', websiteUrl: '', tier: 'SILVER', isActive: true, sortOrder: 0 });
  };

  const onSubmit = (values: SponsorForm) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    form.setValue('name', name);
    if (!editingId && !form.formState.dirtyFields.slug) {
      form.setValue('slug', name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Sponsors</h1>
          <p className="text-muted-foreground">Manage partners and sponsors displayed on the website.</p>
        </div>
        
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-glow flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold transition-colors"
        >
          <Plus size={20} />
          Add Sponsor
        </button>
      </div>

      {isLoading ? (
        <div className="glass-card rounded-2xl p-8 flex justify-center text-muted-foreground">
          <Loader2 className="animate-spin w-8 h-8" />
        </div>
      ) : !data || data.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 flex flex-col items-center justify-center text-center">
          <h3 className="text-xl font-bold text-white mb-2">No sponsors found</h3>
          <p className="text-muted-foreground">Add your first sponsor to display them on the partners page.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map((sponsor: any) => (
            <div key={sponsor.id} className="glass-card rounded-2xl overflow-hidden flex flex-col group">
              <div className="h-40 bg-white/5 flex items-center justify-center p-6 relative">
                <img src={sponsor.logoUrl} alt={sponsor.name} className="max-w-full max-h-full object-contain" />
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEditModal(sponsor)} className="p-1.5 bg-black/50 hover:bg-black text-white rounded-md backdrop-blur-sm transition-colors">
                    <Edit size={14} />
                  </button>
                  <button onClick={() => { if (confirm('Delete sponsor?')) deleteMutation.mutate(sponsor.id); }} className="p-1.5 bg-red-500/50 hover:bg-red-500 text-white rounded-md backdrop-blur-sm transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-white text-lg truncate">{sponsor.name}</h3>
                  <span className={cn(
                    "px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded border",
                    sponsor.tier === 'GOLD' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                    sponsor.tier === 'SILVER' ? "bg-gray-400/10 text-gray-400 border-gray-400/20" :
                    "bg-orange-600/10 text-orange-500 border-orange-600/20"
                  )}>
                    {sponsor.tier}
                  </span>
                </div>
                {sponsor.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">{sponsor.description}</p>}
                
                <div className="flex items-center gap-4 mt-auto pt-4 border-t border-border">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <div className={cn("w-2 h-2 rounded-full", sponsor.isActive ? "bg-emerald-500" : "bg-red-500")} />
                    {sponsor.isActive ? 'Active' : 'Hidden'}
                  </div>
                  {sponsor.websiteUrl && (
                    <a href={sponsor.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 text-violet-400 hover:text-violet-300 ml-auto">
                      <LinkIcon size={12} /> Visit Site
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={closeModal} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-2xl bg-[#0a0a0a] border border-border rounded-3xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-border bg-[#0a0a0a]">
                <h2 className="text-xl font-bold text-white">{editingId ? 'Edit Sponsor' : 'Add Sponsor'}</h2>
                <button onClick={closeModal} className="p-2 text-muted-foreground hover:text-white rounded-full hover:bg-white/10 transition-colors"><X size={20} /></button>
              </div>

              <div className="p-6 max-h-[70vh] overflow-y-auto">
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white">Name</label>
                      <input {...form.register('name')} onChange={handleNameChange} className="w-full px-4 py-2.5 bg-white/5 border border-border rounded-xl text-white focus:border-violet-500 outline-none" />
                      {form.formState.errors.name && <p className="text-xs text-red-400">{form.formState.errors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white">Slug</label>
                      <input {...form.register('slug')} className="w-full px-4 py-2.5 bg-white/5 border border-border rounded-xl text-muted-foreground focus:border-violet-500 outline-none" />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white">Tier</label>
                      <select {...form.register('tier')} className="w-full px-4 py-2.5 bg-[#121212] border border-border rounded-xl text-white focus:border-violet-500 outline-none">
                        <option value="GOLD">Gold</option>
                        <option value="SILVER">Silver</option>
                        <option value="BRONZE">Bronze</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-6 pt-8">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox" {...form.register('isActive')} className="hidden" />
                        <div className={cn("w-5 h-5 rounded border flex items-center justify-center transition-colors", form.watch('isActive') ? "bg-violet-600 border-violet-600" : "border-muted-foreground group-hover:border-white")}>
                          {form.watch('isActive') && <CheckCircle2 size={14} className="text-white" />}
                        </div>
                        <span className="text-sm font-medium text-white">Active</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Logo URL</label>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><ImageIcon size={16} /></div>
                        <input {...form.register('logoUrl')} className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-border rounded-xl text-white focus:border-violet-500 outline-none" placeholder="https://..." />
                      </div>
                    </div>
                    {form.formState.errors.logoUrl && <p className="text-xs text-red-400">{form.formState.errors.logoUrl.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Website URL</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><LinkIcon size={16} /></div>
                      <input {...form.register('websiteUrl')} className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-border rounded-xl text-white focus:border-violet-500 outline-none" placeholder="https://..." />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Description</label>
                    <textarea {...form.register('description')} rows={3} className="w-full px-4 py-2.5 bg-white/5 border border-border rounded-xl text-white focus:border-violet-500 outline-none resize-none" />
                  </div>

                  <div className="pt-4 flex justify-end gap-3 border-t border-border mt-6">
                    <button type="button" onClick={closeModal} className="px-6 py-2.5 rounded-xl font-bold text-white hover:bg-white/10 transition-colors">Cancel</button>
                    <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="btn-glow flex items-center gap-2 px-8 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold transition-colors disabled:opacity-50">
                      {(createMutation.isPending || updateMutation.isPending) ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                      {editingId ? 'Save Changes' : 'Add Sponsor'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
