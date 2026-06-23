import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Megaphone, Plus, Trash2, Edit, Save, X, Loader2, Pin, Calendar, CheckCircle2 } from 'lucide-react';
import { createAnnouncementSchema, type CreateAnnouncementRequest } from '@itsa/shared';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminAnnouncementsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-announcements'],
    queryFn: async () => {
      const res = await apiClient.get('/announcements');
      return res.data.data;
    },
  });

  const form = useForm<CreateAnnouncementRequest>({
    resolver: zodResolver(createAnnouncementSchema),
    defaultValues: {
      title: '',
      content: '',
      excerpt: '',
      category: 'CLUB_UPDATE',
      isPinned: false,
      isPublished: false,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateAnnouncementRequest) => {
      const res = await apiClient.post('/announcements', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      toast.success('Announcement created');
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Failed to create');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateAnnouncementRequest> }) => {
      const res = await apiClient.patch(`/announcements/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      toast.success('Announcement updated');
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Failed to update');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/announcements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      toast.success('Announcement deleted');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Failed to delete');
    },
  });

  const togglePinMutation = useMutation({
    mutationFn: async ({ id, isPinned }: { id: string; isPinned: boolean }) => {
      await apiClient.patch(`/announcements/${id}`, { isPinned });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
    },
  });

  const openEditModal = (item: any) => {
    form.reset({
      title: item.title,
      content: item.content,
      excerpt: item.excerpt || '',
      category: item.category,
      isPinned: item.isPinned,
      isPublished: item.isPublished,
    });
    setEditingId(item.id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    form.reset({
      title: '', content: '', excerpt: '', category: 'CLUB_UPDATE', isPinned: false, isPublished: false
    });
  };

  const onSubmit: SubmitHandler<CreateAnnouncementRequest> = (values) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Announcements</h1>
          <p className="text-muted-foreground">Manage club updates, event news, and notices.</p>
        </div>
        
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-glow flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold transition-colors"
        >
          <Plus size={20} />
          New Announcement
        </button>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="glass-card rounded-2xl p-8 flex justify-center text-muted-foreground">
            <Loader2 className="animate-spin w-8 h-8" />
          </div>
        ) : !data || data.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 flex flex-col items-center justify-center text-center">
            <Megaphone size={48} className="text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-white mb-2">No announcements yet</h3>
            <p className="text-muted-foreground mb-6">Create the first announcement to keep members updated.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors"
            >
              <Plus size={18} /> Add Announcement
            </button>
          </div>
        ) : (
          data.map((item: any) => (
            <div key={item.id} className={cn(
              "glass-card rounded-2xl p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center transition-all",
              item.isPinned && "border-violet-500/50 shadow-lg shadow-violet-500/10"
            )}>
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                <Megaphone className={item.isPinned ? "text-violet-400" : "text-muted-foreground"} size={24} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-white truncate">{item.title}</h3>
                  {item.isPinned && <Pin size={14} className="text-violet-400 shrink-0" />}
                  {!item.isPublished && (
                    <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-500 text-[10px] font-bold uppercase rounded-md">Draft</span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="bg-white/5 px-2 py-0.5 rounded text-xs font-semibold">{item.category.replace('_', ' ')}</span>
                  <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                <button 
                  onClick={() => togglePinMutation.mutate({ id: item.id, isPinned: !item.isPinned })}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    item.isPinned ? "bg-violet-500/20 text-violet-400" : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white"
                  )}
                  title={item.isPinned ? "Unpin" : "Pin to top"}
                >
                  <Pin size={18} />
                </button>
                <button 
                  onClick={() => openEditModal(item)}
                  className="p-2 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white rounded-lg transition-colors"
                >
                  <Edit size={18} />
                </button>
                <button 
                  onClick={() => { if (confirm('Delete this announcement?')) deleteMutation.mutate(item.id); }}
                  className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Editor Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={closeModal}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#0a0a0a] border border-border rounded-3xl shadow-2xl"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-border bg-[#0a0a0a]/80 backdrop-blur-xl">
                <h2 className="text-xl font-bold text-white">
                  {editingId ? 'Edit Announcement' : 'Create Announcement'}
                </h2>
                <button onClick={closeModal} className="p-2 text-muted-foreground hover:text-white rounded-full hover:bg-white/10 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6">
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white">Title</label>
                      <input
                        {...form.register('title')}
                        className="w-full px-4 py-2.5 bg-white/5 border border-border rounded-xl text-white focus:border-violet-500 outline-none"
                        placeholder="Welcome to ITSA 2026!"
                      />
                      {form.formState.errors.title && <p className="text-xs text-red-400">{form.formState.errors.title.message}</p>}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white">Category</label>
                      <select
                        {...form.register('category')}
                        className="w-full px-4 py-2.5 bg-[#121212] border border-border rounded-xl text-white focus:border-violet-500 outline-none"
                      >
                        <option value="CLUB_UPDATE">Club Update</option>
                        <option value="NOTICE">Notice</option>
                        <option value="PLACEMENT_DRIVE">Placement Drive</option>
                        <option value="WORKSHOP">Workshop</option>
                        <option value="GENERAL">General</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center gap-6 pt-8">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox" {...form.register('isPublished')} className="hidden" />
                        <div className={cn(
                          "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                          form.watch('isPublished') ? "bg-violet-600 border-violet-600" : "border-muted-foreground group-hover:border-white"
                        )}>
                          {form.watch('isPublished') && <CheckCircle2 size={14} className="text-white" />}
                        </div>
                        <span className="text-sm font-medium text-white group-hover:text-white transition-colors">Publish immediately</span>
                      </label>
                      
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox" {...form.register('isPinned')} className="hidden" />
                        <div className={cn(
                          "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                          form.watch('isPinned') ? "bg-violet-600 border-violet-600" : "border-muted-foreground group-hover:border-white"
                        )}>
                          {form.watch('isPinned') && <CheckCircle2 size={14} className="text-white" />}
                        </div>
                        <span className="text-sm font-medium text-white group-hover:text-white transition-colors">Pin to top</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Excerpt (Short description)</label>
                    <textarea
                      {...form.register('excerpt')}
                      rows={2}
                      className="w-full px-4 py-2.5 bg-white/5 border border-border rounded-xl text-white focus:border-violet-500 outline-none resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Content (HTML Supported)</label>
                    <textarea
                      {...form.register('content')}
                      rows={8}
                      className="w-full px-4 py-3 bg-white/5 border border-border rounded-xl text-white focus:border-violet-500 outline-none font-mono text-sm"
                      placeholder="<p>Write your announcement content here...</p>"
                    />
                    {form.formState.errors.content && <p className="text-xs text-red-400">{form.formState.errors.content.message}</p>}
                  </div>

                  <div className="pt-4 flex justify-end gap-3 border-t border-border mt-6">
                    <button type="button" onClick={closeModal} className="px-6 py-2.5 rounded-xl font-bold text-white hover:bg-white/10 transition-colors">
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                      className="btn-glow flex items-center gap-2 px-8 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
                    >
                      {(createMutation.isPending || updateMutation.isPending) ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                      {editingId ? 'Save Changes' : 'Create'}
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
