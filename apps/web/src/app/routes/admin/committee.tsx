import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Plus, Loader2, Pencil, Trash2, X, Upload } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { Navigate } from 'react-router-dom';

const schema = z.object({
  position: z.string().min(1, 'Position is required'),
  description: z.string().optional(),
  committeeImage: z.string().optional(),
  linkedinUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  githubUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  committee: z.enum(['FACULTY', 'BE', 'TE', 'SE']),
  displayOrder: z.number().int().min(0, 'Must be 0 or greater').default(0),
});

type FormData = z.infer<typeof schema>;

export default function AdminCommitteePage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [activeUser, setActiveUser] = useState<any>(null); // To keep track of user being assigned/edited
  const [deleteModalOpen, setDeleteModalOpen] = useState<{ open: boolean; id: string | null; name: string }>({ open: false, id: null, name: '' });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-committee-view'],
    queryFn: async () => {
      const res = await apiClient.get('/committee/admin-view');
      return res.data?.data || { assigned: [], unassigned: [] };
    }
  });

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { displayOrder: 0, committee: 'BE' }
  });

  const currentCommittee = watch('committee');
  const currentImage = watch('committeeImage');

  const createMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: FormData }) => apiClient.post(`/committee/${userId}`, data),
    onSuccess: () => {
      toast.success('User assigned to committee successfully');
      setModalOpen(false);
      reset();
      setActiveUser(null);
      queryClient.invalidateQueries({ queryKey: ['admin-committee-view'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed to assign user')
  });

  const updateMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: FormData }) => apiClient.patch(`/committee/${userId}`, data),
    onSuccess: () => {
      toast.success('Assignment updated successfully');
      setModalOpen(false);
      reset();
      setActiveUser(null);
      queryClient.invalidateQueries({ queryKey: ['admin-committee-view'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed to update assignment')
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => apiClient.delete(`/committee/${userId}`),
    onSuccess: () => {
      toast.success('Assignment removed successfully');
      setDeleteModalOpen({ open: false, id: null, name: '' });
      queryClient.invalidateQueries({ queryKey: ['admin-committee-view'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed to remove assignment')
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const res = await apiClient.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setValue('committeeImage', res.data.data.url, { shouldValidate: true });
      toast.success('Image uploaded successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onSubmit = (formData: FormData) => {
    if (!activeUser) return;
    
    // Explicitly hide github url if faculty
    if (formData.committee === 'FACULTY') {
      formData.githubUrl = '';
    }

    if (activeUser.committeeAssignment) {
      updateMutation.mutate({ userId: activeUser.id, data: formData });
    } else {
      createMutation.mutate({ userId: activeUser.id, data: formData });
    }
  };

  const openAssignModal = (u: any) => {
    setActiveUser(u);
    reset({
      committee: 'BE',
      position: '',
      description: '',
      committeeImage: '',
      linkedinUrl: '',
      githubUrl: '',
      displayOrder: 0
    });
    setModalOpen(true);
  };

  const openEditModal = (u: any) => {
    setActiveUser(u);
    const assignment = u.committeeAssignment;
    reset({
      committee: assignment.committee,
      position: assignment.position,
      description: assignment.description || '',
      committeeImage: assignment.committeeImage || '',
      linkedinUrl: assignment.linkedinUrl || '',
      githubUrl: assignment.githubUrl || '',
      displayOrder: assignment.displayOrder
    });
    setModalOpen(true);
  };

  if (user?.role !== 'SUPER_ADMIN') {
    return <Navigate to="/admin" replace />;
  }

  const { assigned = [], unassigned = [] } = data || {};

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Committee Management</h1>
        <p className="text-muted-foreground">Assign roles to existing members to display them on the About page.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        </div>
      ) : (
        <div className="space-y-12">
          {/* Unassigned Users Table */}
          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">Unassigned Members</h2>
            <div className="glass rounded-xl overflow-hidden border border-white/5">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <th className="p-4">User</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Current Role</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {unassigned.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-muted-foreground">
                          No unassigned members found.
                        </td>
                      </tr>
                    ) : (
                      unassigned.map((u: any) => (
                        <tr key={u.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-white/10 overflow-hidden">
                                {u.avatarUrl ? (
                                  <img src={u.avatarUrl} alt={u.firstName} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white bg-violet-600/50">
                                    {u.firstName[0]}
                                  </div>
                                )}
                              </div>
                              <span className="font-medium text-white">{u.firstName} {u.lastName}</span>
                            </div>
                          </td>
                          <td className="p-4 text-muted-foreground text-sm">{u.email}</td>
                          <td className="p-4 text-violet-400 text-sm font-medium">{u.role}</td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => openAssignModal(u)}
                              className="px-3 py-1.5 rounded-lg bg-violet-600/20 text-violet-400 hover:bg-violet-600/30 transition-colors text-sm font-medium"
                            >
                              Assign
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Assigned Users Table */}
          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">Assigned Members</h2>
            <div className="glass rounded-xl overflow-hidden border border-white/5">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <th className="p-4">Member</th>
                      <th className="p-4">Committee</th>
                      <th className="p-4">Position</th>
                      <th className="p-4">Order</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {assigned.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                          No members assigned yet.
                        </td>
                      </tr>
                    ) : (
                      assigned.sort((a: any, b: any) => {
                        const comp = a.committeeAssignment.committee.localeCompare(b.committeeAssignment.committee);
                        if (comp !== 0) return comp;
                        return a.committeeAssignment.displayOrder - b.committeeAssignment.displayOrder;
                      }).map((u: any) => (
                        <tr key={u.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-white/10 overflow-hidden">
                                <img 
                                  src={u.committeeAssignment.committeeImage || u.avatarUrl || `https://ui-avatars.com/api/?name=${u.firstName}+${u.lastName}&background=random`} 
                                  alt={u.firstName} 
                                  className="w-full h-full object-cover" 
                                />
                              </div>
                              <span className="font-medium text-white">{u.firstName} {u.lastName}</span>
                            </div>
                          </td>
                          <td className="p-4 text-muted-foreground text-sm">
                            <span className="px-2 py-1 rounded bg-white/5 border border-white/10">
                              {u.committeeAssignment.committee}
                            </span>
                          </td>
                          <td className="p-4 text-violet-400 text-sm">{u.committeeAssignment.position}</td>
                          <td className="p-4 text-muted-foreground text-sm">{u.committeeAssignment.displayOrder}</td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => openEditModal(u)}
                                className="p-2 text-muted-foreground hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                              >
                                <Pencil size={18} />
                              </button>
                              <button
                                onClick={() => setDeleteModalOpen({ open: true, id: u.id, name: `${u.firstName} ${u.lastName}` })}
                                className="p-2 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md rounded-2xl border border-white/10 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h3 className="text-xl font-bold text-white">
                {activeUser?.committeeAssignment ? 'Edit Assignment' : 'Assign to Committee'}
              </h3>
              <button 
                onClick={() => { setModalOpen(false); setActiveUser(null); }}
                className="text-muted-foreground hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="mb-6 flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10">
                  <img src={activeUser?.avatarUrl || `https://ui-avatars.com/api/?name=${activeUser?.firstName}+${activeUser?.lastName}&background=random`} alt={activeUser?.firstName} className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-white font-medium">{activeUser?.firstName} {activeUser?.lastName}</p>
                  <p className="text-muted-foreground text-sm">{activeUser?.email}</p>
                </div>
              </div>

              <form id="assign-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Committee *</label>
                    <select
                      {...register('committee')}
                      className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-violet-500"
                    >
                      <option value="FACULTY">Faculty</option>
                      <option value="BE">BE Committee</option>
                      <option value="TE">TE Committee</option>
                      <option value="SE">SE Committee</option>
                    </select>
                    {errors.committee && <p className="text-red-400 text-xs">{errors.committee.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Display Order</label>
                    <input
                      type="number"
                      {...register('displayOrder', { valueAsNumber: true })}
                      className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Position *</label>
                  <input
                    {...register('position')}
                    placeholder="e.g. Technical Lead"
                    className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-violet-500 placeholder:text-white/20"
                  />
                  {errors.position && <p className="text-red-400 text-xs">{errors.position.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Description</label>
                  <textarea
                    {...register('description')}
                    placeholder="Short bio..."
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-violet-500 placeholder:text-white/20 resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white flex items-center justify-between">
                    <span>Committee Photo</span>
                    <span className="text-xs text-muted-foreground font-normal">Optional fallback available</span>
                  </label>
                  
                  <div className="flex gap-4 items-center">
                    {currentImage && (
                      <img src={currentImage} alt="Preview" className="w-12 h-12 rounded-lg object-cover border border-white/10" />
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors disabled:opacity-50"
                    >
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      {uploading ? 'Uploading...' : currentImage ? 'Change Image' : 'Upload Image'}
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      className="hidden" 
                      accept="image/*" 
                    />
                  </div>
                  {errors.committeeImage && <p className="text-red-400 text-xs">{errors.committeeImage.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">LinkedIn URL</label>
                  <input
                    {...register('linkedinUrl')}
                    placeholder="https://linkedin.com/in/..."
                    className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-violet-500 placeholder:text-white/20"
                  />
                  {errors.linkedinUrl && <p className="text-red-400 text-xs">{errors.linkedinUrl.message}</p>}
                </div>

                {currentCommittee !== 'FACULTY' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">GitHub URL</label>
                    <input
                      {...register('githubUrl')}
                      placeholder="https://github.com/..."
                      className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-violet-500 placeholder:text-white/20"
                    />
                    {errors.githubUrl && <p className="text-red-400 text-xs">{errors.githubUrl.message}</p>}
                  </div>
                )}
              </form>
            </div>
            
            <div className="p-6 border-t border-white/5 bg-black/20 flex gap-4">
              <button
                type="button"
                onClick={() => { setModalOpen(false); setActiveUser(null); }}
                className="flex-1 px-4 py-2.5 rounded-xl text-white hover:bg-white/5 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="assign-form"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex-1 px-4 py-2.5 rounded-xl bg-violet-600 text-white hover:bg-violet-500 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-card w-full max-w-sm rounded-2xl border border-red-500/20 overflow-hidden p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Remove Assignment?</h3>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to remove <span className="text-white font-medium">{deleteModalOpen.name}</span> from the committee? This will not delete their account, but they will be removed from the About page.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteModalOpen({ open: false, id: null, name: '' })}
                className="flex-1 px-4 py-2 rounded-xl text-white hover:bg-white/5 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteModalOpen.id && deleteMutation.mutate(deleteModalOpen.id)}
                disabled={deleteMutation.isPending}
                className="flex-1 px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
