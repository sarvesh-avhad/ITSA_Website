import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Loader2, LayoutTemplate, Play, AlertCircle, Eye, Download, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  eventId: string;
}

export function EventCertificatesManager({ eventId }: Props) {
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [eligibility, setEligibility] = useState<'ALL' | 'ATTENDEES'>('ATTENDEES');
  const [duplicateAction, setDuplicateAction] = useState<'SKIP' | 'OVERWRITE' | 'REGENERATE'>('SKIP');
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  const { data: templates = [], isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['certificateTemplates'],
    queryFn: async () => {
      const { data } = await apiClient.get('/certificates/templates');
      return data.data;
    }
  });

  const { data: eligibleUsers = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['eligibleUsers', eventId, eligibility],
    queryFn: async () => {
      const { data } = await apiClient.get(`/registrations?eventId=${eventId}&limit=5000`);
      const list = data.data || [];
      if (eligibility === 'ATTENDEES') {
        return list.filter((r: any) => r.attendanceMarked).map((r: any) => r.user.id);
      }
      return list.map((r: any) => r.user.id);
    }
  });

  const { data: jobProgress } = useQuery({
    queryKey: ['jobProgress', activeJobId],
    queryFn: async () => {
      if (!activeJobId) return null;
      const { data } = await apiClient.get(`/certificates/generate/progress/${activeJobId}`);
      return data.data;
    },
    enabled: !!activeJobId,
    refetchInterval: (query) => (query.state.data?.status === 'PROCESSING' ? 2000 : false),
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post('/certificates/generate', {
        eventId,
        templateId: selectedTemplate,
        userIds: eligibleUsers,
        duplicateAction
      });
      return data;
    },
    onSuccess: (data) => {
      toast.success('Generation job started!');
      setActiveJobId(data.data.jobId);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Failed to start generation');
    }
  });

  useEffect(() => {
    if (jobProgress?.status === 'COMPLETED') {
      toast.success('Certificate generation completed!');
      setActiveJobId(null);
      queryClient.invalidateQueries({ queryKey: ['admin-registrations'] });
    } else if (jobProgress?.status === 'FAILED') {
      toast.error('Certificate generation failed. Please check the server logs.');
      setActiveJobId(null);
    }
  }, [jobProgress?.status, queryClient]);

  if (isLoadingTemplates || isLoadingUsers) {
    return <div className="p-8 flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 p-4">
      
      {activeJobId && jobProgress ? (
        <div className="bg-card border rounded-xl p-8 text-center max-w-xl mx-auto mt-8 shadow-sm">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Generating Certificates</h3>
          <p className="text-muted-foreground mb-6">Please do not close this window.</p>
          
          <div className="w-full bg-secondary rounded-full h-3 mb-2 overflow-hidden">
            <div 
              className="bg-primary h-3 rounded-full transition-all duration-500 ease-in-out" 
              style={{ width: `${Math.max(5, (jobProgress.current / jobProgress.total) * 100)}%` }}
            ></div>
          </div>
          <p className="font-mono text-sm">
            {jobProgress.current} / {jobProgress.total} completed
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="space-y-6">
            <div className="bg-card border rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <LayoutTemplate className="w-5 h-5 text-primary" />
                1. Select Template
              </h3>
              
              {templates.length === 0 ? (
                <div className="text-sm text-amber-500 bg-amber-500/10 p-4 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p>You haven't uploaded any certificate templates yet. Go to Global Settings &gt; Certificates to upload a PPTX template first.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {templates.map((tpl: any) => (
                    <label key={tpl.id} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${selectedTemplate === tpl.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted/50'}`}>
                      <input 
                        type="radio" 
                        name="template" 
                        value={tpl.id} 
                        checked={selectedTemplate === tpl.id}
                        onChange={() => setSelectedTemplate(tpl.id)}
                        className="w-4 h-4 text-primary"
                      />
                      <div>
                        <div className="font-medium text-sm">{tpl.name}</div>
                        <div className="text-xs text-muted-foreground">{tpl.type} • v{tpl.version}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-card border rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">2. Eligibility</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={eligibility === 'ATTENDEES'} onChange={() => setEligibility('ATTENDEES')} />
                  <span className="text-sm">Only Attendees (Scanned/Marked Present)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={eligibility === 'ALL'} onChange={() => setEligibility('ALL')} />
                  <span className="text-sm">All Registered Participants</span>
                </label>
              </div>
              <p className="mt-4 text-sm font-medium text-primary bg-primary/10 px-3 py-2 rounded-lg">
                Selected {eligibleUsers.length} students to receive certificates.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-card border rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">3. Duplicate Handling</h3>
              <p className="text-sm text-muted-foreground mb-4">What should happen if a student already has a certificate for this event using this template?</p>
              
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-muted/50">
                  <input type="radio" checked={duplicateAction === 'SKIP'} onChange={() => setDuplicateAction('SKIP')} />
                  <div>
                    <div className="text-sm font-medium">Skip</div>
                    <div className="text-xs text-muted-foreground">Keep the old certificate, do nothing. (Recommended)</div>
                  </div>
                </label>
                <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-muted/50">
                  <input type="radio" checked={duplicateAction === 'REGENERATE'} onChange={() => setDuplicateAction('REGENERATE')} />
                  <div>
                    <div className="text-sm font-medium">Regenerate & Revoke</div>
                    <div className="text-xs text-muted-foreground">Issue a brand new certificate number and REVOKE the old one.</div>
                  </div>
                </label>
                <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-muted/50">
                  <input type="radio" checked={duplicateAction === 'OVERWRITE'} onChange={() => setDuplicateAction('OVERWRITE')} />
                  <div>
                    <div className="text-sm font-medium">Overwrite PDF</div>
                    <div className="text-xs text-muted-foreground">Update the PDF file quietly without changing the certificate number.</div>
                  </div>
                </label>
              </div>
            </div>

            <div className="bg-card border rounded-xl p-6 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
               <h3 className="text-lg font-semibold w-full text-left">4. Preview & Generate</h3>
               <p className="text-sm text-muted-foreground">Ensure everything is correct before generating {eligibleUsers.length} certificates.</p>
               
               <button 
                  disabled={!selectedTemplate || eligibleUsers.length === 0 || generateMutation.isPending}
                  onClick={() => generateMutation.mutate()}
                  className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 <Play className="w-5 h-5 fill-current" />
                 Generate {eligibleUsers.length} Certificates
               </button>
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
}
