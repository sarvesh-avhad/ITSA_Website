import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Record<string, any>>({});

  const { data: configs, isLoading } = useQuery({
    queryKey: ['admin-cms-config'],
    queryFn: async () => {
      const res = await apiClient.get('/cms');
      return res.data.data;
    },
  });

  useEffect(() => {
    if (configs) {
      const initialData: Record<string, any> = {};
      configs.forEach((c: any) => {
        initialData[c.key] = c.value;
      });
      setFormData(initialData);
    }
  }, [configs]);

  const updateMutation = useMutation({
    mutationFn: async (updates: any[]) => {
      const res = await apiClient.patch('/cms', updates);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Settings updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-cms-config'] });
      // Invalidate public cms cache
      queryClient.invalidateQueries({ queryKey: ['public-cms'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Failed to update settings');
    }
  });

  const handleChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const sectionKeys: Record<string, string[]> = {
    homepage: ['hero_title', 'hero_subtitle', 'hero_video_url', 'about_snippet', 'stats_members', 'stats_events', 'stats_years', 'stats_alumni'],
    about: ['vision', 'mission', 'objectives'],
    contact: ['contact_email', 'contact_phone', 'contact_location', 'social_instagram', 'social_linkedin', 'social_facebook', 'social_whatsapp']
  };

  const handleSave = (section: string) => {
    const keys = sectionKeys[section] || [];
    const updates = keys.map(key => ({
      key,
      value: formData[key] !== undefined ? formData[key] : '',
      section
    }));
    updateMutation.mutate(updates);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Site Settings</h1>
        <p className="text-muted-foreground">Manage the content displayed on the public website.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Homepage Section */}
        <div className="glass-card rounded-2xl border border-white/5 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h2 className="text-xl font-bold text-white">Homepage content</h2>
            <button
              onClick={() => handleSave('homepage')}
              disabled={updateMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition-colors font-medium text-sm disabled:opacity-50"
            >
              <Save size={16} />
              Save Changes
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1.5">Hero Title</label>
              <input
                type="text"
                value={formData['hero_title'] || ''}
                onChange={(e) => handleChange('hero_title', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-violet-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1.5">Hero Subtitle</label>
              <input
                type="text"
                value={formData['hero_subtitle'] || ''}
                onChange={(e) => handleChange('hero_subtitle', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-violet-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1.5">Hero Video URL (Optional)</label>
              <input
                type="text"
                value={formData['hero_video_url'] || ''}
                onChange={(e) => handleChange('hero_video_url', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-violet-500 outline-none placeholder:text-muted-foreground/50"
                placeholder="https://example.com/video.mp4"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1.5">About Snippet (Homepage)</label>
              <textarea
                value={formData['about_snippet'] || ''}
                onChange={(e) => handleChange('about_snippet', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-violet-500 outline-none min-h-[100px]"
              />
            </div>

            <h3 className="text-sm font-semibold text-white pt-4 border-t border-white/10">Statistics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Members</label>
                <input
                  type="number"
                  value={formData['stats_members'] || 0}
                  onChange={(e) => handleChange('stats_members', parseInt(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Events Organized</label>
                <input
                  type="number"
                  value={formData['stats_events'] || 0}
                  onChange={(e) => handleChange('stats_events', parseInt(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Years of Excellence</label>
                <input
                  type="number"
                  value={formData['stats_years'] || 0}
                  onChange={(e) => handleChange('stats_years', parseInt(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Alumni Network</label>
                <input
                  type="number"
                  value={formData['stats_alumni'] || 0}
                  onChange={(e) => handleChange('stats_alumni', parseInt(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* About Page Section */}
        <div className="glass-card rounded-2xl border border-white/5 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h2 className="text-xl font-bold text-white">About Page Content</h2>
            <button
              onClick={() => handleSave('about')}
              disabled={updateMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition-colors font-medium text-sm disabled:opacity-50"
            >
              <Save size={16} />
              Save Changes
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1.5">Vision Statement</label>
              <textarea
                value={formData['vision'] || ''}
                onChange={(e) => handleChange('vision', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-violet-500 outline-none min-h-[100px]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1.5">Mission Statement</label>
              <textarea
                value={formData['mission'] || ''}
                onChange={(e) => handleChange('mission', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-violet-500 outline-none min-h-[100px]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1.5">Objectives</label>
              <textarea
                value={formData['objectives'] || ''}
                onChange={(e) => handleChange('objectives', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-violet-500 outline-none min-h-[100px]"
              />
            </div>
          </div>
        </div>

        {/* Contact Information Section */}
        <div className="glass-card rounded-2xl border border-white/5 p-6 space-y-6 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h2 className="text-xl font-bold text-white">Contact Information</h2>
            <button
              onClick={() => handleSave('contact')}
              disabled={updateMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition-colors font-medium text-sm disabled:opacity-50"
            >
              <Save size={16} />
              Save Changes
            </button>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-white mb-1.5">Contact Email</label>
              <input
                type="email"
                value={formData['contact_email'] || ''}
                onChange={(e) => handleChange('contact_email', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-violet-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1.5">Contact Phone</label>
              <input
                type="text"
                value={formData['contact_phone'] || ''}
                onChange={(e) => handleChange('contact_phone', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-violet-500 outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-white mb-1.5">Location Address (use &lt;br /&gt; for new lines)</label>
              <textarea
                value={formData['contact_location'] || ''}
                onChange={(e) => handleChange('contact_location', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-violet-500 outline-none min-h-[80px]"
              />
            </div>
            
            {/* Social Media */}
            <div className="md:col-span-2 pt-4 border-t border-white/10">
              <h3 className="text-sm font-semibold text-muted-foreground mb-4">Social Media Links</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-white mb-1.5">Instagram URL</label>
                  <input
                    type="url"
                    value={formData['social_instagram'] || ''}
                    onChange={(e) => handleChange('social_instagram', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-violet-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white mb-1.5">LinkedIn URL</label>
                  <input
                    type="url"
                    value={formData['social_linkedin'] || ''}
                    onChange={(e) => handleChange('social_linkedin', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-violet-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white mb-1.5">Facebook URL</label>
                  <input
                    type="url"
                    value={formData['social_facebook'] || ''}
                    onChange={(e) => handleChange('social_facebook', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-violet-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white mb-1.5">WhatsApp Channel URL</label>
                  <input
                    type="url"
                    value={formData['social_whatsapp'] || ''}
                    onChange={(e) => handleChange('social_whatsapp', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-violet-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
