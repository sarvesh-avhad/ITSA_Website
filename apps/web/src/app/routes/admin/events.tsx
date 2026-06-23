import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createEventSchema, PERMISSIONS } from '@itsa/shared';
import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';
import { Search, Loader2, Edit, Trash2, Plus, X, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const fetchAdminEvents = async (page: number, search: string) => {
  const { data } = await apiClient.get(`/events/admin?page=${page}&limit=10&search=${search}`);
  return data;
};

export default function AdminEventsPage() {
  const queryClient = useQueryClient();
  const hasPermission = useAuthStore(state => state.hasPermission);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalState, setModalState] = useState<{ type: 'CREATE' | 'EDIT' | 'DELETE' | null, event: any | null }>({ type: null, event: null });
  
  const { data, isLoading } = useQuery({
    queryKey: ['admin-events', page, search],
    queryFn: () => fetchAdminEvents(page, search),
  });

  const closeModal = () => {
    setModalState({ type: null, event: null });
    reset({
      title: '', description: '', shortDescription: '', venue: '', eventType: 'INDIVIDUAL',
      startDate: new Date().toISOString().slice(0, 16), endDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
      maxParticipants: 100,
    });
  };

  const createMutation = useMutation({
    mutationFn: async (eventData: any) => {
      const { data } = await apiClient.post('/events', eventData);
      return data;
    },
    onSuccess: () => {
      toast.success('Event created successfully');
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Failed to create event');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      const res = await apiClient.patch(`/events/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Event updated successfully');
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Failed to update event');
    }
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, isPublished }: { id: string, isPublished: boolean }) => {
      const res = await apiClient.patch(`/events/${id}`, { isPublished });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Event visibility updated');
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Failed to update visibility');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/events/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Event deleted successfully');
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Failed to delete event');
    }
  });

  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      title: '', description: '', shortDescription: '', venue: '', eventType: 'INDIVIDUAL',
      startDate: new Date().toISOString().slice(0, 16), 
      endDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16), 
      registrationDeadline: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
      maxParticipants: 100,
      minTeamSize: 2, maxTeamSize: 4, isPublished: true, status: 'DRAFT'
    }
  });

  const eventType = watch('eventType');
  const isPublished = watch('isPublished');

  const openEditModal = (event: any) => {
    reset({
      title: event.title,
      description: event.description,
      shortDescription: event.shortDescription || '',
      venue: event.venue || '',
      eventType: event.eventType,
      startDate: new Date(event.startDate).toISOString().slice(0, 16),
      endDate: new Date(event.endDate).toISOString().slice(0, 16),
      registrationDeadline: event.registrationDeadline ? new Date(event.registrationDeadline).toISOString().slice(0, 16) : new Date(event.endDate).toISOString().slice(0, 16),
      maxParticipants: event.maxParticipants || 100,
      minTeamSize: event.minTeamSize || 2,
      maxTeamSize: event.maxTeamSize || 4,
      isPublished: event.isPublished ?? true,
      status: event.status || 'DRAFT',
    });
    setModalState({ type: 'EDIT', event });
  };

  const onSubmit = (formData: any) => {
    const payload = {
      ...formData,
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString(),
      registrationDeadline: formData.registrationDeadline ? new Date(formData.registrationDeadline).toISOString() : undefined,
      maxParticipants: Number(formData.maxParticipants),
      minTeamSize: formData.eventType !== 'INDIVIDUAL' ? Number(formData.minTeamSize) : undefined,
      maxTeamSize: formData.eventType !== 'INDIVIDUAL' ? Number(formData.maxTeamSize) : undefined,
    };
    if (modalState.type === 'EDIT' && modalState.event) {
      updateMutation.mutate({ id: modalState.event.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const statusColors: Record<string, string> = {
    UPCOMING: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    ONGOING: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    COMPLETED: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30',
    DRAFT: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30',
    CANCELLED: 'bg-red-500/20 text-red-300 border-red-500/30',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Events Management</h1>
          <p className="text-muted-foreground">Create, edit, and manage platform events.</p>
        </div>
        {hasPermission(PERMISSIONS.EVENTS_CREATE) && (
          <button 
            onClick={() => {
              reset({
                title: '', description: '', shortDescription: '', venue: '', eventType: 'INDIVIDUAL',
                startDate: new Date().toISOString().slice(0, 16), endDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
                maxParticipants: 100, minTeamSize: 2, maxTeamSize: 4
              });
              setModalState({ type: 'CREATE', event: null });
            }}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-violet-600/20 btn-glow"
          >
            <Plus size={18} />
            Create Event
          </button>
        )}
      </div>

      <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between gap-4 bg-white/[0.02]">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search events by title..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-muted-foreground focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-white/[0.02] border-b border-white/10">
              <tr>
                <th className="px-6 py-4 font-medium">Event Title</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Registrations</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-violet-500 mx-auto" />
                  </td>
                </tr>
              ) : data?.data?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No events found matching your criteria.
                  </td>
                </tr>
              ) : (
                data?.data?.map((event: any) => (
                  <tr key={event.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white line-clamp-1">{event.title}</div>
                      <div className="text-xs text-muted-foreground">{event.category?.name || 'General'} • {event.eventType}</div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                      {format(new Date(event.startDate), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border mr-2", statusColors[event.status] || statusColors.DRAFT)}>
                        {event.status}
                      </span>
                      {event.isPublished ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border bg-emerald-500/20 text-emerald-300 border-emerald-500/30">PUBLIC</span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border bg-zinc-500/20 text-zinc-300 border-zinc-500/30">HIDDEN</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-full max-w-[100px] h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-violet-500 rounded-full" 
                            style={{ width: `${Math.min(((event.currentCount || 0) / (event.maxParticipants || 1)) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{event.currentCount || 0}/{event.maxParticipants || '∞'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => togglePublishMutation.mutate({ id: event.id, isPublished: !event.isPublished })}
                          disabled={togglePublishMutation.isPending}
                          title={event.isPublished ? "Unpublish event" : "Publish event"}
                          className={cn(
                            "p-2 rounded-lg transition-colors disabled:opacity-50",
                            event.isPublished 
                              ? "text-emerald-400 hover:bg-emerald-400/10" 
                              : "text-zinc-400 hover:text-white hover:bg-white/10"
                          )}
                        >
                          {event.isPublished ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>
                        <button onClick={() => openEditModal(event)} className="p-2 text-muted-foreground hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Edit event">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => setModalState({ type: 'DELETE', event })} className="p-2 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Delete event">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {!isLoading && data?.meta && (
          <div className="p-4 border-t border-white/10 flex items-center justify-between text-sm text-muted-foreground bg-white/[0.02]">
            <div>
              Showing {((data.meta.page - 1) * data.meta.limit) + 1} to {Math.min(data.meta.page * data.meta.limit, data.meta.total)} of {data.meta.total} events
            </div>
            <div className="flex gap-2">
              <button 
                disabled={data.meta.page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 rounded border border-white/10 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button 
                disabled={data.meta.page === data.meta.totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 rounded border border-white/10 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Event Modal */}
      <AnimatePresence>
        {(modalState.type === 'CREATE' || modalState.type === 'EDIT') && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 shadow-2xl relative z-10"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-20">
                <h2 className="text-xl font-bold text-white">{modalState.type === 'EDIT' ? 'Edit Event' : 'Create New Event'}</h2>
                <button onClick={closeModal} className="text-muted-foreground hover:text-white p-2">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/10">
                    <div>
                      <h4 className="text-sm font-medium text-white mb-1">Publish Immediately</h4>
                      <p className="text-xs text-muted-foreground">If enabled, the event will instantly appear on the public website.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" {...register('isPublished')} />
                      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-1.5">Event Title</label>
                    <input
                      {...register('title')}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-border text-white focus:border-violet-500 outline-none"
                      placeholder="e.g. Code-O-Fiesta 2026"
                    />
                    {errors.title && <p className="text-xs text-red-400 mt-1">{errors.title.message as string}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-1.5">Event Type</label>
                      <select
                        {...register('eventType')}
                        className="w-full px-4 py-2.5 rounded-xl bg-[#121212] border border-white/10 text-white focus:border-violet-500 outline-none"
                      >
                        <option value="INDIVIDUAL">Individual</option>
                        <option value="TEAM">Team</option>
                        <option value="BOTH">Both</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-1.5">Status</label>
                      <select
                        {...register('status')}
                        className="w-full px-4 py-2.5 rounded-xl bg-[#121212] border border-white/10 text-white focus:border-violet-500 outline-none"
                      >
                        <option value="DRAFT">Draft</option>
                        <option value="UPCOMING">Upcoming</option>
                        <option value="ONGOING">Ongoing</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-1.5">Total Max Capacity</label>
                      <input
                        type="number"
                        {...register('maxParticipants', { valueAsNumber: true })}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:border-violet-500 outline-none"
                      />
                    </div>
                  </div>

                  {(eventType === 'TEAM' || eventType === 'BOTH') && (
                    <div className="grid grid-cols-2 gap-4 bg-violet-500/10 p-4 rounded-xl border border-violet-500/20">
                      <div>
                        <label className="block text-sm font-medium text-violet-200 mb-1.5">Min Team Size</label>
                        <input
                          type="number"
                          {...register('minTeamSize', { valueAsNumber: true })}
                          className="w-full px-4 py-2.5 rounded-xl bg-[#121212]/50 border border-violet-500/30 text-white focus:border-violet-500 outline-none"
                        />
                        {errors.minTeamSize && <p className="text-xs text-red-400 mt-1">{errors.minTeamSize.message as string}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-violet-200 mb-1.5">Max Team Size</label>
                        <input
                          type="number"
                          {...register('maxTeamSize', { valueAsNumber: true })}
                          className="w-full px-4 py-2.5 rounded-xl bg-[#121212]/50 border border-violet-500/30 text-white focus:border-violet-500 outline-none"
                        />
                        {errors.maxTeamSize && <p className="text-xs text-red-400 mt-1">{errors.maxTeamSize.message as string}</p>}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-1.5">Start Time</label>
                      <input
                        type="datetime-local"
                        {...register('startDate')}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:border-violet-500 outline-none"
                      />
                      {errors.startDate && <p className="text-xs text-red-400 mt-1">{errors.startDate.message as string}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-1.5">End Time</label>
                      <input
                        type="datetime-local"
                        {...register('endDate')}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:border-violet-500 outline-none"
                      />
                      {errors.endDate && <p className="text-xs text-red-400 mt-1">{errors.endDate.message as string}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-violet-200 mb-1.5">Reg. Deadline</label>
                      <input
                        type="datetime-local"
                        {...register('registrationDeadline')}
                        className="w-full px-4 py-2.5 rounded-xl bg-[#121212]/50 border border-violet-500/30 text-white focus:border-violet-500 outline-none"
                      />
                      {errors.registrationDeadline && <p className="text-xs text-red-400 mt-1">{errors.registrationDeadline.message as string}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-1.5">Venue</label>
                    <input
                      {...register('venue')}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-border text-white focus:border-violet-500 outline-none"
                      placeholder="e.g. IT Department Auditorium"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-1.5">Short Description</label>
                    <textarea
                      {...register('shortDescription')}
                      rows={2}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-border text-white focus:border-violet-500 outline-none resize-none"
                      placeholder="Brief summary for cards..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-1.5">Full Description</label>
                    <textarea
                      {...register('description')}
                      rows={5}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-border text-white focus:border-violet-500 outline-none resize-none"
                      placeholder="Detailed event description..."
                    />
                    {errors.description && <p className="text-xs text-red-400 mt-1">{errors.description.message as string}</p>}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10 sticky bottom-0 bg-background/80 backdrop-blur-md pb-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex items-center gap-2 px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-violet-600/20 disabled:opacity-70 btn-glow"
                  >
                    {(createMutation.isPending || updateMutation.isPending) ? <Loader2 size={18} className="animate-spin" /> : 'Save Event'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {modalState.type === 'DELETE' && modalState.event && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-md rounded-2xl border border-white/10 shadow-2xl relative z-10 p-6 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} className="text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Delete Event</h2>
              <p className="text-muted-foreground mb-6">
                Are you sure you want to delete <span className="font-semibold text-white">{modalState.event.title}</span>? This action cannot be undone.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={closeModal}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteMutation.mutate(modalState.event.id)}
                  disabled={deleteMutation.isPending}
                  className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-red-600/20 disabled:opacity-70 btn-glow"
                >
                  {deleteMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : 'Yes, Delete Event'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
