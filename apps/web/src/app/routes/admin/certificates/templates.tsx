import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { 
  FileText, Upload, Plus, Trash2, Eye, LayoutTemplate, 
  Loader2, AlertTriangle, AlertCircle, FileSpreadsheet, Edit,
  MoreVertical, Copy, Power, PowerOff, CheckCircle2, Check
} from 'lucide-react';
import { format } from 'date-fns';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { SEO } from '@/components/seo';

export default function AdminCertificateTemplatesPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState('PARTICIPATION');
  const [orientation, setOrientation] = useState('LANDSCAPE');
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<any | null>(null);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['certificateTemplates'],
    queryFn: async () => {
      const res = await apiClient.get('/certificates/templates');
      return res.data.data;
    }
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'] },
    maxFiles: 1,
    onDrop: (acceptedFiles) => setFile(acceptedFiles[0])
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!isEditing && !file) throw new Error('No file selected');
      const formData = new FormData();
      if (file) formData.append('file', file);
      formData.append('name', name);
      formData.append('type', type);
      formData.append('orientation', orientation);
      
      const res = isEditing 
        ? await apiClient.patch(`/certificates/templates/${isEditing}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
        : await apiClient.post('/certificates/templates', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['certificateTemplates'] });
      setUploadResult(data.data);
      toast.success(isEditing ? 'Template updated successfully' : 'Template uploaded successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to save template');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/certificates/templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificateTemplates'] });
      toast.success('Template deleted successfully');
    },
  });

  const activateMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.patch(`/certificates/templates/${id}/activate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificateTemplates'] });
      toast.success('Template activated successfully');
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.patch(`/certificates/templates/${id}/deactivate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificateTemplates'] });
      toast.success('Template deactivated successfully');
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.post(`/certificates/templates/${id}/duplicate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificateTemplates'] });
      toast.success('Template duplicated successfully');
    },
  });

  const handleEdit = (template: any) => {
    setIsEditing(template.id);
    setName(template.name);
    setType(template.type);
    setOrientation(template.orientation);
    setFile(null);
    setIsUploading(true);
  };

  return (
    <div className="space-y-8 animate-fade-rise">
      <SEO title="Certificate Templates" />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Certificate Templates</h1>
          <p className="text-muted-foreground">Upload and manage .pptx placeholders for dynamic generation</p>
        </div>
        {!isUploading && (
          <button 
            onClick={() => {
              setIsEditing(null);
              setName('');
              setFile(null);
              setIsUploading(true);
            }}
            className="bg-white/10 text-white px-4 py-2 rounded-lg font-medium hover:bg-white/20 transition-colors flex items-center gap-2 border border-white/10"
          >
            <Upload className="h-4 w-4" />
            Upload Template
          </button>
        )}
      </div>

      {isUploading && (
        <div className="glass-card rounded-2xl p-6 border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
          
          {uploadResult ? (
            <div className="relative z-10 text-center py-6">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-emerald-500/30">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Template Saved Successfully</h2>
              <p className="text-muted-foreground mb-8">Ready to use for generating certificates.</p>
              
              <div className="max-w-md mx-auto text-left bg-black/40 rounded-xl p-6 border border-white/5">
                <p className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Detected Placeholders</p>
                <div className="space-y-3">
                  {JSON.parse(uploadResult.detectedFields).length > 0 ? (
                    JSON.parse(uploadResult.detectedFields).map((field: string) => {
                      const isKnown = ['FullName', 'EventName', 'EventDate', 'CertificateNumber', 'QRCode', 'PRN', 'Position'].includes(field);
                      return (
                        <div key={field} className="flex items-start gap-3">
                          {isKnown ? (
                            <Check className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <span className={`font-mono text-sm ${isKnown ? 'text-white' : 'text-amber-400'}`}>
                              &lt;&lt;{field}&gt;&gt;
                            </span>
                            {!isKnown && (
                              <p className="text-xs text-amber-500/80 mt-1">
                                Unknown placeholder. Please verify spelling or rename it in your PPTX.
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-amber-500 flex items-center gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4" /> No placeholders were detected in this PPTX.
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-8">
                <button 
                  onClick={() => {
                    setIsUploading(false);
                    setUploadResult(null);
                  }}
                  className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <div className="relative z-10">
              <h2 className="text-xl font-bold text-white mb-6">
                {isEditing ? 'Edit Template' : 'Upload New PPTX Template'}
              </h2>
              
              <div className="grid md:grid-cols-2 gap-8 relative z-10">
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-white mb-1.5">Template Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Code-O-Fiesta Participation 2026"
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-1.5">Type</label>
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all [&>option]:bg-zinc-900"
                      >
                        <option value="PARTICIPATION">Participation</option>
                        <option value="WINNER">Winner</option>
                        <option value="RUNNER_UP">Runner-up</option>
                        <option value="VOLUNTEER">Volunteer</option>
                        <option value="ORGANIZER">Organizer</option>
                        <option value="SPEAKER">Speaker</option>
                        <option value="JUDGE">Judge</option>
                        <option value="WORKSHOP">Workshop Completion</option>
                        <option value="CUSTOM">Custom</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-1.5">Orientation</label>
                      <select
                        value={orientation}
                        onChange={(e) => setOrientation(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all [&>option]:bg-zinc-900"
                      >
                        <option value="LANDSCAPE">Landscape</option>
                        <option value="PORTRAIT">Portrait</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-1.5">PPTX File {isEditing && "(Optional)"}</label>
                  <div 
                    {...getRootProps()} 
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                      isDragActive ? 'border-primary bg-primary/5' : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <FileSpreadsheet className="h-8 w-8 text-muted-foreground mb-3 mx-auto" />
                    {file ? (
                      <p className="text-sm font-medium text-primary">{file.name}</p>
                    ) : (
                      <div>
                        <p className="text-sm font-medium">Click or drag file to upload</p>
                        <p className="text-xs text-muted-foreground mt-1">Supports .pptx only</p>
                        {isEditing && <p className="text-xs text-amber-500 mt-2">Leave empty to keep existing file</p>}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t mt-6 pt-4">
                <button 
                  onClick={() => setIsUploading(false)}
                  className="px-4 py-2 border rounded-lg font-medium hover:bg-muted/50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => uploadMutation.mutate()}
                  disabled={isEditing ? (!name || uploadMutation.isPending) : (!file || !name || uploadMutation.isPending)}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {uploadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Save Template
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-card border border-dashed rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <LayoutTemplate className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold mb-2">No templates found</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Upload your first PowerPoint (.pptx) template to start generating dynamic certificates. Placeholders like &lt;&lt;FullName&gt;&gt; will be detected automatically.
          </p>
          <button 
            onClick={() => setIsUploading(true)}
            className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Upload Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template: any) => (
            <div key={template.id} className="bg-card border rounded-xl overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
              <div className="h-32 bg-muted/30 border-b flex items-center justify-center relative p-4">
                <FileSpreadsheet className="h-12 w-12 text-primary/40" />
                <div className="absolute top-3 right-3 flex gap-2">
                  {template.isActive ? (
                    <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm border border-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> ACTIVE
                    </span>
                  ) : (
                    <span className="bg-muted text-muted-foreground text-[10px] font-bold px-2 py-1 rounded shadow-sm border flex items-center gap-1">
                      INACTIVE
                    </span>
                  )}
                  <span className="bg-background/90 backdrop-blur-sm text-xs font-medium px-2 py-1 rounded shadow-sm border text-foreground">
                    v{template.version}
                  </span>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg line-clamp-1" title={template.name}>{template.name}</h3>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    template.type === 'WINNER' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                    template.type === 'PARTICIPATION' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                    'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}>
                    {template.type}
                  </span>
                </div>
                
                <div className="text-xs text-muted-foreground mb-4 flex justify-between items-center">
                  <span>Uploaded {format(new Date(template.createdAt), 'MMM d, yyyy')}</span>
                  <span className="font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">{template._count?.certificates || 0} generated</span>
                </div>

                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Detected Fields</p>
                  <div className="flex flex-wrap gap-1.5">
                    {JSON.parse(template.detectedFields).length > 0 ? (
                      JSON.parse(template.detectedFields).map((field: string) => (
                        <span key={field} className="bg-secondary/50 text-secondary-foreground text-xs px-2 py-0.5 rounded border">
                          &lt;&lt;{field}&gt;&gt;
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-amber-600 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> No fields detected
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t flex items-center justify-between relative">
                  <a 
                    href={template.fileUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-sm font-medium text-primary hover:underline flex items-center gap-1.5"
                  >
                    <Eye className="h-4 w-4" />
                    Download PPTX
                  </a>
                  
                  <div className="relative">
                    <button 
                      onClick={() => setOpenDropdownId(openDropdownId === template.id ? null : template.id)}
                      className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-muted"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>
                    
                    {openDropdownId === template.id && (
                      <div className="absolute bottom-full right-0 mb-2 w-48 bg-card border shadow-lg rounded-xl overflow-hidden z-10 py-1">
                        {!template.isActive && (
                          <button 
                            onClick={() => { activateMutation.mutate(template.id); setOpenDropdownId(null); }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center gap-2 text-emerald-500"
                          >
                            <Power className="h-4 w-4" /> Activate
                          </button>
                        )}
                        {template.isActive && (
                          <button 
                            onClick={() => { deactivateMutation.mutate(template.id); setOpenDropdownId(null); }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center gap-2 text-amber-500"
                          >
                            <PowerOff className="h-4 w-4" /> Deactivate
                          </button>
                        )}
                        <button 
                          onClick={() => { duplicateMutation.mutate(template.id); setOpenDropdownId(null); }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center gap-2 text-primary"
                        >
                          <Copy className="h-4 w-4" /> Duplicate
                        </button>
                        <button 
                          onClick={() => { handleEdit(template); setOpenDropdownId(null); }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center gap-2 text-blue-500"
                        >
                          <Edit className="h-4 w-4" /> Edit
                        </button>
                        <button 
                          onClick={() => {
                            if(window.confirm('Are you sure you want to delete this template?')) {
                              deleteMutation.mutate(template.id);
                              setOpenDropdownId(null);
                            }
                          }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center gap-2 text-red-500"
                        >
                          <Trash2 className="h-4 w-4" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
