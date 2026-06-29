import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Loader2, Pencil, Trash2, X, Upload, Menu, ChevronDown, ChevronUp } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { Navigate } from 'react-router-dom';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const schema = z.object({
  position: z.string().min(1, 'Position is required'),
  description: z.string().optional(),
  committeeImage: z.string().optional(),
  linkedinUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  githubUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  committee: z.enum(['FACULTY', 'BE', 'TE', 'SE']),
  displayOrder: z.number().int().min(0).default(0),
});

type FormData = z.infer<typeof schema>;

function SortableRow({ userObj, openEditModal, setDeleteModalOpen, disabled }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: userObj.id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 'auto',
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={cn(
        "transition-colors",
        isDragging ? "opacity-75 bg-white/10 shadow-xl scale-[1.01]" : "hover:bg-white/5",
        "relative"
      )}
    >
      <td className="p-4 w-12 cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
        <Menu className="w-5 h-5 text-muted-foreground hover:text-white transition-colors" />
      </td>
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/10 overflow-hidden">
            <img
              src={userObj.committeeAssignment.committeeImage || userObj.avatarUrl || `https://ui-avatars.com/api/?name=${userObj.firstName}+${userObj.lastName}&background=random`}
              alt={userObj.firstName}
              className="w-full h-full object-cover"
            />
          </div>
          <span className="font-medium text-white">{userObj.firstName} {userObj.lastName}</span>
        </div>
      </td>
      <td className="p-4 text-violet-400 text-sm">{userObj.committeeAssignment.position}</td>
      <td className="p-4 text-right">
        <div className="flex justify-end gap-2">
          <button
            onClick={() => openEditModal(userObj)}
            className="p-2 text-muted-foreground hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <Pencil size={18} />
          </button>
          <button
            onClick={() => setDeleteModalOpen({ open: true, id: userObj.id, name: `${userObj.firstName} ${userObj.lastName}` })}
            className="p-2 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </td>
    </tr>
  );
}

function CommitteeSection({ title, users, openEditModal, setDeleteModalOpen, isReordering }: any) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="mb-8">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-2xl font-semibold text-white mb-4 hover:text-violet-400 transition-colors"
      >
        {isOpen ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
        {title} ({users.length})
      </button>
      
      {isOpen && (
        <div className="glass rounded-xl overflow-hidden border border-white/5">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="p-4 w-12">Drag</th>
                  <th className="p-4">Member</th>
                  <th className="p-4">Position</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-muted-foreground">
                      No members assigned to this committee yet.
                    </td>
                  </tr>
                ) : (
                  <SortableContext items={users.map((u: any) => u.id)} strategy={verticalListSortingStrategy}>
                    {users.map((u: any) => (
                      <SortableRow 
                        key={u.id} 
                        userObj={u} 
                        openEditModal={openEditModal} 
                        setDeleteModalOpen={setDeleteModalOpen} 
                        disabled={isReordering}
                      />
                    ))}
                  </SortableContext>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminCommitteePage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [activeUser, setActiveUser] = useState<any>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState<{ open: boolean; id: string | null; name: string }>({ open: false, id: null, name: '' });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isReordering, setIsReordering] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const reorderMutation = useMutation({
    mutationFn: async (payload: { userId: string; displayOrder: number }[]) => apiClient.patch(`/committee/reorder`, payload),
    onMutate: () => setIsReordering(true),
    onSuccess: () => {
      toast.success('Committee order updated successfully');
      setIsReordering(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Failed to update order. Restoring previous state.');
      queryClient.invalidateQueries({ queryKey: ['admin-committee-view'] });
      setIsReordering(false);
    }
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const { assigned = [] } = data || {};
    
    // Find the item being dragged to figure out its committee
    const activeItem = assigned.find((u: any) => u.id === active.id);
    if (!activeItem) return;

    const committeeGroup = activeItem.committeeAssignment.committee;
    
    // Get all items in this committee, sorted by current display order
    let groupItems = assigned
      .filter((u: any) => u.committeeAssignment.committee === committeeGroup)
      .sort((a: any, b: any) => a.committeeAssignment.displayOrder - b.committeeAssignment.displayOrder);

    const oldIndex = groupItems.findIndex((u: any) => u.id === active.id);
    const newIndex = groupItems.findIndex((u: any) => u.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      // Reorder the array
      groupItems = arrayMove(groupItems, oldIndex, newIndex);
      
      // Update display orders sequentially
      const updatedGroupItems = groupItems.map((item: any, index: number) => ({
        ...item,
        committeeAssignment: {
          ...item.committeeAssignment,
          displayOrder: index
        }
      }));

      // Optimistically update the cache
      queryClient.setQueryData(['admin-committee-view'], (oldData: any) => {
        if (!oldData) return oldData;
        const newAssigned = oldData.assigned.map((u: any) => {
          const updated = updatedGroupItems.find((ui: any) => ui.id === u.id);
          return updated || u;
        });
        return { ...oldData, assigned: newAssigned };
      });

      // Prepare payload for backend
      const payload = updatedGroupItems.map((u: any) => ({
        userId: u.id,
        displayOrder: u.committeeAssignment.displayOrder
      }));

      reorderMutation.mutate(payload);
    }
  };

  if (user?.role !== 'SUPER_ADMIN') {
    return <Navigate to="/admin" replace />;
  }

  const { assigned = [], unassigned = [] } = data || {};

  const faculty = assigned.filter((u: any) => u.committeeAssignment.committee === 'FACULTY').sort((a: any, b: any) => a.committeeAssignment.displayOrder - b.committeeAssignment.displayOrder);
  const beCommittee = assigned.filter((u: any) => u.committeeAssignment.committee === 'BE').sort((a: any, b: any) => a.committeeAssignment.displayOrder - b.committeeAssignment.displayOrder);
  const teCommittee = assigned.filter((u: any) => u.committeeAssignment.committee === 'TE').sort((a: any, b: any) => a.committeeAssignment.displayOrder - b.committeeAssignment.displayOrder);
  const seCommittee = assigned.filter((u: any) => u.committeeAssignment.committee === 'SE').sort((a: any, b: any) => a.committeeAssignment.displayOrder - b.committeeAssignment.displayOrder);

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Committee Management</h1>
          <p className="text-muted-foreground">Assign roles to existing members to display them on the About page.</p>
        </div>
        {isReordering && (
          <div className="flex items-center gap-2 text-violet-400 bg-violet-400/10 px-4 py-2 rounded-lg text-sm font-medium">
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving Order...
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        </div>
      ) : (
        <div className="space-y-12">
          {/* Unassigned Users Table */}
          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">Unassigned Members ({unassigned.length})</h2>
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

          {/* Assigned Users Tables (Sortable) */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <CommitteeSection 
              title="Faculty Committee" 
              users={faculty} 
              openEditModal={openEditModal} 
              setDeleteModalOpen={setDeleteModalOpen} 
              isReordering={isReordering}
            />
            <CommitteeSection 
              title="BE Committee" 
              users={beCommittee} 
              openEditModal={openEditModal} 
              setDeleteModalOpen={setDeleteModalOpen}
              isReordering={isReordering} 
            />
            <CommitteeSection 
              title="TE Committee" 
              users={teCommittee} 
              openEditModal={openEditModal} 
              setDeleteModalOpen={setDeleteModalOpen} 
              isReordering={isReordering}
            />
            <CommitteeSection 
              title="SE Committee" 
              users={seCommittee} 
              openEditModal={openEditModal} 
              setDeleteModalOpen={setDeleteModalOpen} 
              isReordering={isReordering}
            />
          </DndContext>
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

                  <div className="space-y-2 opacity-50">
                    <label className="text-sm font-medium text-white">Display Order</label>
                    <input
                      type="number"
                      disabled
                      {...register('displayOrder', { valueAsNumber: true })}
                      className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-violet-500 cursor-not-allowed"
                      title="Use drag-and-drop on the table to reorder members"
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
