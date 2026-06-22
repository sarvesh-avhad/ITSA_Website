import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createAlbumSchema } from '@itsa/shared';
import apiClient from '@/lib/api-client';
import { Search, Loader2, Image as ImageIcon, UploadCloud, X, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const fetchAlbums = async (page: number, search: string) => {
  const { data } = await apiClient.get(`/gallery?page=${page}&limit=10&search=${search}`);
  return data.data;
};

export default function AdminGalleryPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-albums', page, search],
    queryFn: () => fetchAlbums(page, search),
  });

  const createAlbumMutation = useMutation({
    mutationFn: async (albumData: any) => {
      const { data } = await apiClient.post('/gallery', albumData);
      return data;
    },
    onSuccess: () => {
      toast.success('Album created successfully');
      setIsCreateModalOpen(false);
      reset();
      queryClient.invalidateQueries({ queryKey: ['admin-albums'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Failed to create album');
    }
  });

  const uploadPhotosMutation = useMutation({
    mutationFn: async ({ albumId, files }: { albumId: string, files: FileList }) => {
      // 1. Upload to Cloudinary via our backend batch route
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append('files', file));
      
      const uploadRes = await apiClient.post('/upload/batch', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const uploadedPhotos = uploadRes.data.data; // Array of { url, publicId }

      // 2. Attach these photos to the Album
      const attachPromises = uploadedPhotos.map((photo: any) => 
        apiClient.post(`/gallery/${albumId}/photos`, {
          url: photo.url,
          publicId: photo.publicId,
          caption: photo.originalName,
        })
      );
      await Promise.all(attachPromises);

      return uploadedPhotos;
    },
    onSuccess: () => {
      toast.success('Photos uploaded successfully!');
      setSelectedAlbum(null);
      queryClient.invalidateQueries({ queryKey: ['admin-albums'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Failed to upload photos');
    }
  });

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(createAlbumSchema),
    defaultValues: {
      title: '',
      description: '',
      year: new Date().getFullYear(),
      isPublished: true,
    }
  });

  const onSubmit = (formData: any) => {
    createAlbumMutation.mutate({
      ...formData,
      year: Number(formData.year)
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !selectedAlbum) return;
    toast.info(`Uploading ${e.target.files.length} photos... Please wait.`);
    uploadPhotosMutation.mutate({ albumId: selectedAlbum.id, files: e.target.files });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Gallery Management</h1>
          <p className="text-muted-foreground">Manage event photo albums and upload pictures.</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-violet-600/20 btn-glow"
        >
          <Plus size={18} />
          Create Album
        </button>
      </div>

      <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between gap-4 bg-white/[0.02]">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search albums..."
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
                <th className="px-6 py-4 font-medium">Album Title</th>
                <th className="px-6 py-4 font-medium">Year</th>
                <th className="px-6 py-4 font-medium">Photos Count</th>
                <th className="px-6 py-4 font-medium">Status</th>
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
                    No albums found.
                  </td>
                </tr>
              ) : (
                data?.data?.map((album: any) => (
                  <tr key={album.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {album.coverUrl ? (
                          <img src={album.coverUrl} alt={album.title} className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                            <ImageIcon size={16} className="text-muted-foreground" />
                          </div>
                        )}
                        <div className="font-medium text-white">{album.title}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {album.year}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {album._count?.photos || 0} photos
                    </td>
                    <td className="px-6 py-4">
                      {album.isPublished ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border bg-emerald-500/20 text-emerald-300 border-emerald-500/30">PUBLISHED</span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border bg-zinc-500/20 text-zinc-300 border-zinc-500/30">DRAFT</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => { setSelectedAlbum(album); fileInputRef.current?.click(); }}
                          disabled={uploadPhotosMutation.isPending && selectedAlbum?.id === album.id}
                          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-violet-300 bg-violet-500/10 hover:bg-violet-500/20 rounded-lg transition-colors" 
                          title="Upload Photos"
                        >
                          {(uploadPhotosMutation.isPending && selectedAlbum?.id === album.id) ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <UploadCloud size={14} />
                          )}
                          Upload
                        </button>
                        <button className="p-2 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
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
      </div>

      {/* Hidden File Input for uploading */}
      <input 
        type="file" 
        multiple 
        accept="image/jpeg,image/png,image/webp" 
        ref={fileInputRef} 
        onChange={handleFileUpload}
        className="hidden" 
      />

      {/* Create Album Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl relative z-10"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Create New Album</h2>
                <button onClick={() => setIsCreateModalOpen(false)} className="text-muted-foreground hover:text-white p-2">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-1.5">Album Title</label>
                  <input
                    {...register('title')}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-border text-white focus:border-violet-500 outline-none"
                    placeholder="e.g. Code-O-Fiesta 2026 Memories"
                  />
                  {errors.title && <p className="text-xs text-red-400 mt-1">{errors.title.message as string}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-1.5">Year</label>
                  <input
                    type="number"
                    {...register('year')}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-border text-white focus:border-violet-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-1.5">Description (Optional)</label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-border text-white focus:border-violet-500 outline-none resize-none"
                    placeholder="Describe the album..."
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createAlbumMutation.isPending}
                    className="flex items-center gap-2 px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-violet-600/20 disabled:opacity-70 btn-glow"
                  >
                    {createAlbumMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : 'Create Album'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
