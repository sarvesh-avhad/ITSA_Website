import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Search, Loader2, ShieldAlert, X, AlertTriangle, UserCog } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const fetchUsers = async (page: number, search: string) => {
  const { data } = await apiClient.get(`/admin/users?page=${page}&limit=10&search=${search}`);
  return data.data;
};

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalState, setModalState] = useState<{ type: 'ROLE' | 'SUSPEND' | null, user: any | null }>({ type: null, user: null });
  const [selectedRole, setSelectedRole] = useState<string>('USER');
  
  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search],
    queryFn: () => fetchUsers(page, search),
  });

  const closeModal = () => setModalState({ type: null, user: null });

  const roleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string, role: string }) => {
      const res = await apiClient.patch(`/admin/users/${id}/role`, { role });
      return res.data;
    },
    onSuccess: () => {
      toast.success('User role updated');
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Failed to update role');
    }
  });

  const suspendMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.post(`/admin/users/${id}/suspend`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('User suspended successfully');
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Failed to suspend user');
    }
  });

  const openRoleModal = (user: any) => {
    setSelectedRole(user.role);
    setModalState({ type: 'ROLE', user });
  };

  const roleColors: Record<string, string> = {
    USER: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30',
    MEMBER: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    COORDINATOR: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    ADMIN: 'bg-red-500/20 text-red-300 border-red-500/30',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Users Management</h1>
          <p className="text-muted-foreground">Manage user accounts and roles.</p>
        </div>
      </div>

      <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between gap-4 bg-white/[0.02]">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search users by name or email..."
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
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Joined</th>
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
                    No users found matching your criteria.
                  </td>
                </tr>
              ) : (
                data?.data?.map((user: any) => (
                  <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-violet-600/20 text-violet-400 flex items-center justify-center font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="font-medium text-white">{user.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border", roleColors[user.role] || roleColors.USER)}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {format(new Date(user.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openRoleModal(user)} className="p-2 text-muted-foreground hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Manage Role">
                          <UserCog size={16} />
                        </button>
                        <button onClick={() => setModalState({ type: 'SUSPEND', user })} className="p-2 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Suspend User">
                          <ShieldAlert size={16} />
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
              Showing {((data.meta.page - 1) * data.meta.limit) + 1} to {Math.min(data.meta.page * data.meta.limit, data.meta.total)} of {data.meta.total} users
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

      {/* Role Management Modal */}
      <AnimatePresence>
        {modalState.type === 'ROLE' && modalState.user && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-md rounded-2xl border border-white/10 shadow-2xl relative z-10"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Manage User Role</h2>
                <button onClick={closeModal} className="text-muted-foreground hover:text-white p-2">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6">
                <p className="text-muted-foreground mb-4">
                  Update role for <span className="text-white font-medium">{modalState.user.name}</span> ({modalState.user.email}).
                </p>
                <div className="space-y-4">
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-white focus:border-violet-500 outline-none"
                  >
                    <option value="USER">User (Standard)</option>
                    <option value="MEMBER">ITSA Member</option>
                    <option value="COORDINATOR">Event Coordinator</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>
              </div>
              <div className="p-6 border-t border-white/10 flex justify-end gap-3">
                <button onClick={closeModal} className="px-4 py-2 rounded-xl border border-white/10 text-white hover:bg-white/5 font-medium transition-colors">
                  Cancel
                </button>
                <button 
                  onClick={() => roleMutation.mutate({ id: modalState.user.id, role: selectedRole })}
                  disabled={roleMutation.isPending || selectedRole === modalState.user.role}
                  className="flex items-center gap-2 px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-violet-600/20 disabled:opacity-70 btn-glow"
                >
                  {roleMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Suspend Confirmation Modal */}
      <AnimatePresence>
        {modalState.type === 'SUSPEND' && modalState.user && (
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
              <h2 className="text-xl font-bold text-white mb-2">Suspend User</h2>
              <p className="text-muted-foreground mb-6">
                Are you sure you want to suspend <span className="font-semibold text-white">{modalState.user.name}</span>? They will lose access to their account immediately.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={closeModal}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => suspendMutation.mutate(modalState.user.id)}
                  disabled={suspendMutation.isPending}
                  className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-red-600/20 disabled:opacity-70 btn-glow"
                >
                  {suspendMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : 'Yes, Suspend User'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
