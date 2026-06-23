import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Award, Download, Loader2, Calendar } from 'lucide-react';
import { SEO } from '@/components/seo';

export default function StudentCertificatesPage() {
  const { data: certificates, isLoading } = useQuery({
    queryKey: ['my-certificates'],
    queryFn: async () => {
      // Assuming a GET /certificates/my endpoint exists
      // Wait, let's look at the shared backend for certificates!
      // In a real app we'd fetch the user's specific certificates.
      // Let's use the registrations endpoint which includes certificate details for the student.
      const res = await apiClient.get('/registrations/my');
      return res.data.data.filter((r: any) => r.certificateId);
    },
  });

  return (
    <div className="animate-fade-rise">
      <SEO title="My Certificates | Student Hub" />
      
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">My Certificates</h1>
          <p className="text-muted-foreground">Download and verify your earned certificates.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="glass-card rounded-3xl p-12 flex justify-center text-muted-foreground">
          <Loader2 className="animate-spin w-8 h-8 text-violet-400" />
        </div>
      ) : !certificates || certificates.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10">
            <Award size={24} className="text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No certificates yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Attend events and complete requirements to earn certificates. They will appear here once issued.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-6">
          {certificates.map((reg: any) => (
            <div key={reg.id} className="glass-card rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
              
              <div className="flex items-start justify-between mb-4 relative z-10">
                <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center shrink-0">
                  <Award className="text-amber-400" size={24} />
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Certificate ID</div>
                  <div className="text-sm font-mono text-white">{reg.certificateId}</div>
                </div>
              </div>

              <h3 className="text-xl font-bold text-white mb-2 relative z-10">
                {reg.event.title}
              </h3>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6 relative z-10">
                <Calendar size={14} />
                Issued on {new Date(reg.event.endDate).toLocaleDateString()}
              </div>

              <div className="flex gap-3 relative z-10">
                <a
                  href={`/api/v1/certificates/${reg.certificateId}/download`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 btn-glow flex items-center justify-center gap-2 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold transition-colors"
                >
                  <Download size={16} />
                  Download
                </a>
                <a
                  href={`/certificates/verify?id=${reg.certificateId}`}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-colors border border-border flex items-center justify-center"
                  title="Verify Certificate"
                >
                  <Award size={16} />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
