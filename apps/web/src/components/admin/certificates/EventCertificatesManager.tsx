import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Loader2, LayoutTemplate, Play, AlertCircle, CheckCircle2, ChevronRight, Eye, Check, AlertTriangle, FileText, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface Props {
  eventId: string;
}

export function EventCertificatesManager({ eventId }: Props) {
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [eligibility, setEligibility] = useState<'ALL' | 'ATTENDEES'>('ATTENDEES');
  const [duplicateAction, setDuplicateAction] = useState<'SKIP' | 'OVERWRITE' | 'REGENERATE'>('SKIP');
  
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [isPreviewVerified, setIsPreviewVerified] = useState(false);

  const { data: templates = [], isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['certificateTemplates'],
    queryFn: async () => {
      const { data } = await apiClient.get('/certificates/templates');
      return data.data.filter((t: any) => t.isActive);
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

  const previewMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post('/certificates/preview', {
        eventId,
        templateId: selectedTemplate,
        userIds: eligibleUsers
      });
      return data.data;
    },
    onSuccess: (data) => {
      setPreviewData(data);
      setIsPreviewVerified(false);
      toast.success('Preview generated successfully!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Failed to generate preview');
    }
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
      setActiveJobId(data.data.jobId);
      setCurrentStep(6);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Failed to start generation');
    }
  });

  useEffect(() => {
    if (jobProgress?.status === 'COMPLETED') {
      queryClient.invalidateQueries({ queryKey: ['admin-registrations'] });
    }
  }, [jobProgress?.status, queryClient]);

  if (isLoadingTemplates || isLoadingUsers) {
    return <div className="p-8 flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-muted-foreground" /></div>;
  }

  const steps = [
    { id: 1, name: 'Template' },
    { id: 2, name: 'Eligibility' },
    { id: 3, name: 'Duplicates' },
    { id: 4, name: 'Preview' },
    { id: 5, name: 'Generate' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Wizard Header */}
      {currentStep < 6 && (
        <div className="bg-card border rounded-xl p-4 shadow-sm mb-6 flex justify-between items-center overflow-x-auto">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex items-center min-w-max">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm border-2 transition-colors ${
                currentStep === step.id ? 'border-primary bg-primary/10 text-primary' :
                currentStep > step.id ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-muted text-muted-foreground'
              }`}>
                {currentStep > step.id ? <CheckCircle2 className="w-5 h-5" /> : step.id}
              </div>
              <span className={`ml-2 text-sm font-medium ${currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'}`}>
                {step.name}
              </span>
              {idx < steps.length - 1 && <ChevronRight className="w-4 h-4 mx-4 text-muted-foreground" />}
            </div>
          ))}
        </div>
      )}

      {/* STEP 1: Template */}
      {currentStep === 1 && (
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5 text-primary" /> Select Active Template
          </h3>
          {templates.length === 0 ? (
            <div className="text-sm text-amber-500 bg-amber-500/10 p-4 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>You haven't activated any certificate templates. Go to Global Settings &gt; Certificates to activate one.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map((tpl: any) => (
                <label key={tpl.id} className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${selectedTemplate === tpl.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted/50'}`}>
                  <input type="radio" checked={selectedTemplate === tpl.id} onChange={() => setSelectedTemplate(tpl.id)} className="w-4 h-4 text-primary" />
                  <div>
                    <div className="font-semibold">{tpl.name}</div>
                    <div className="text-sm text-muted-foreground">{tpl.type} • v{tpl.version}</div>
                  </div>
                </label>
              ))}
            </div>
          )}
          <div className="mt-6 flex justify-end">
            <button disabled={!selectedTemplate} onClick={() => setCurrentStep(2)} className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50">Next Step</button>
          </div>
        </div>
      )}

      {/* STEP 2: Eligibility */}
      {currentStep === 2 && (
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Generate Certificates For</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg hover:bg-muted/50">
              <input type="radio" checked={eligibility === 'ATTENDEES'} onChange={() => setEligibility('ATTENDEES')} />
              <span className="font-medium">Only Attendees (Attendance Marked)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg hover:bg-muted/50">
              <input type="radio" checked={eligibility === 'ALL'} onChange={() => setEligibility('ALL')} />
              <span className="font-medium">All Registered Participants</span>
            </label>
          </div>
          <div className="mt-6 bg-primary/10 border border-primary/20 p-4 rounded-lg flex items-center justify-between">
            <span className="font-medium">Selected Participants:</span>
            <span className="text-xl font-bold text-primary">{eligibleUsers.length}</span>
          </div>
          <div className="mt-6 flex justify-between">
            <button onClick={() => setCurrentStep(1)} className="px-6 py-2 border rounded-lg font-medium hover:bg-muted/50">Back</button>
            <button disabled={eligibleUsers.length === 0} onClick={() => setCurrentStep(3)} className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50">Next Step</button>
          </div>
        </div>
      )}

      {/* STEP 3: Duplicates */}
      {currentStep === 3 && (
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Duplicate Handling</h3>
          <p className="text-sm text-muted-foreground mb-4">What should happen if a student already has a certificate for this event using this template?</p>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer p-4 border rounded-lg hover:bg-muted/50">
              <input type="radio" checked={duplicateAction === 'SKIP'} onChange={() => setDuplicateAction('SKIP')} className="mt-1 shrink-0" />
              <div>
                <div className="font-medium">Skip (Recommended)</div>
                <div className="text-sm text-muted-foreground">Keep the old certificate, do nothing.</div>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer p-4 border rounded-lg hover:bg-muted/50">
              <input type="radio" checked={duplicateAction === 'REGENERATE'} onChange={() => setDuplicateAction('REGENERATE')} className="mt-1 shrink-0" />
              <div>
                <div className="font-medium">Generate New Certificate</div>
                <div className="text-sm text-muted-foreground">Issue a brand new certificate number and mark the old one as Revoked.</div>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer p-4 border rounded-lg hover:bg-muted/50">
              <input type="radio" checked={duplicateAction === 'OVERWRITE'} onChange={() => setDuplicateAction('OVERWRITE')} className="mt-1 shrink-0" />
              <div>
                <div className="font-medium">Update Existing PDF</div>
                <div className="text-sm text-muted-foreground">Update the PDF file quietly. Keeps the exact same certificate number.</div>
              </div>
            </label>
          </div>
          <div className="mt-6 flex justify-between">
            <button onClick={() => setCurrentStep(2)} className="px-6 py-2 border rounded-lg font-medium hover:bg-muted/50">Back</button>
            <button onClick={() => setCurrentStep(4)} className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:bg-primary/90">Next Step</button>
          </div>
        </div>
      )}

      {/* STEP 4: Preview */}
      {currentStep === 4 && (
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-2">Preview Sample</h3>
          <p className="text-sm text-muted-foreground mb-6">Generate a temporary preview using the first actual eligible participant.</p>
          
          {!previewData ? (
            <div className="text-center py-12 border-2 border-dashed rounded-xl">
              <button 
                onClick={() => previewMutation.mutate()}
                disabled={previewMutation.isPending || eligibleUsers.length === 0}
                className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
              >
                {previewMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Eye className="h-5 w-5" />}
                Generate Preview
              </button>
              {eligibleUsers.length === 0 && <p className="text-amber-500 mt-4 text-sm">No eligible users to preview.</p>}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-black/20 rounded-xl border overflow-hidden h-[500px]">
                <iframe src={`${previewData.pdfUrl}#toolbar=0`} className="w-full h-full border-0" title="Preview PDF" />
              </div>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Placeholder Validation</h4>
                  <div className="space-y-2">
                    {Object.entries(previewData.resolvedData).map(([key, value]) => (
                      <div key={key} className="flex items-start gap-2 text-sm bg-muted/50 p-2 rounded">
                        {value ? <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />}
                        <div>
                          <div className="font-mono text-xs text-muted-foreground">&lt;&lt;{key}&gt;&gt;</div>
                          <div className={value ? 'text-foreground font-medium' : 'text-amber-500 italic'}>{value ? String(value) : 'No data available'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="pt-4 border-t border-white/10">
                  <label className="flex items-center gap-2 cursor-pointer bg-primary/10 border border-primary/20 p-3 rounded-lg">
                    <input type="checkbox" checked={isPreviewVerified} onChange={(e) => setIsPreviewVerified(e.target.checked)} className="w-4 h-4 text-primary rounded" />
                    <span className="font-medium text-primary">Looks Good!</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-between">
            <button onClick={() => setCurrentStep(3)} className="px-6 py-2 border rounded-lg font-medium hover:bg-muted/50">Back</button>
            <button 
              disabled={!isPreviewVerified}
              onClick={() => setCurrentStep(5)} 
              className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              Next Step
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Generate */}
      {currentStep === 5 && (
        <div className="bg-card border rounded-xl p-8 shadow-sm flex flex-col items-center text-center">
           <h3 className="text-2xl font-bold mb-2">Ready to Generate</h3>
           <p className="text-muted-foreground mb-8 max-w-md">You are about to generate {eligibleUsers.length} certificates. This process will run in the background.</p>
           
           <div className="flex justify-between w-full max-w-sm mb-8">
             <button onClick={() => setCurrentStep(4)} className="px-6 py-3 border rounded-lg font-medium hover:bg-muted/50">Back</button>
             <button 
                disabled={generateMutation.isPending}
                onClick={() => generateMutation.mutate()}
                className="bg-emerald-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-emerald-500 transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-emerald-500/20"
             >
               {generateMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
               Generate Certificates
             </button>
           </div>
        </div>
      )}

      {/* STEP 6: Progress & Complete */}
      {currentStep === 6 && jobProgress && (
        <div className="bg-card border rounded-xl p-8 shadow-sm max-w-2xl mx-auto">
          {jobProgress.status === 'PROCESSING' ? (
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Generating Certificates...</h3>
              <p className="text-muted-foreground mb-6">Please do not close this window.</p>
              
              <div className="w-full bg-secondary rounded-full h-3 mb-2 overflow-hidden">
                <div 
                  className="bg-primary h-3 rounded-full transition-all duration-500 ease-in-out" 
                  style={{ width: `${Math.max(5, (jobProgress.current / jobProgress.total) * 100)}%` }}
                ></div>
              </div>
              <p className="font-mono text-sm mb-4">
                {jobProgress.current} / {jobProgress.total} completed
              </p>
              <div className="text-xs text-muted-foreground animate-pulse">Uploading PDFs &amp; Sending Notifications...</div>
            </div>
          ) : jobProgress.status === 'COMPLETED' ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-emerald-500/30">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Generation Complete</h3>
              
              <div className="flex justify-center gap-8 my-8 p-6 bg-black/20 rounded-xl border border-white/5">
                <div>
                  <div className="text-3xl font-bold text-emerald-400">{jobProgress.current}</div>
                  <div className="text-sm text-muted-foreground">Generated</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-amber-400">{jobProgress.total - jobProgress.current}</div>
                  <div className="text-sm text-muted-foreground">Skipped</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-red-400">0</div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
              </div>

              <div className="flex justify-center gap-4">
                <a 
                  href={`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/certificates/export/${eventId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/10 flex items-center justify-center gap-2"
                >
                  <Download size={18} /> Download Report
                </a>
                <Link 
                  to={`/admin/certificates/generated?eventId=${eventId}`}
                  className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors font-semibold flex items-center justify-center gap-2"
                >
                  <FileText size={18} /> View Certificates
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2 text-red-500">Generation Failed</h3>
              <p className="text-muted-foreground mb-6">An error occurred during the background job. Check server logs.</p>
              <button onClick={() => setCurrentStep(5)} className="px-6 py-2 border rounded-lg font-medium hover:bg-muted/50">Try Again</button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
