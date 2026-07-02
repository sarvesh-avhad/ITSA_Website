import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Award, Download, Loader2, Calendar, FileText, CheckCircle2, Eye, ExternalLink, X } from 'lucide-react';
import { SEO } from '@/components/seo';
import { Link } from 'react-router-dom';

export default function StudentCertificatesPage() {
  const [previewPdf, setPreviewPdf] = useState<string | null>(null);

  const { data: certificates, isLoading } = useQuery({
    queryKey: ['my-certificates'],
    queryFn: async () => {
      const res = await apiClient.get('/certificates/my');
      return res.data.data;
    },
  });

  return (
    <div className="animate-fade-rise">
      <SEO title="My Certificates | Student Hub" />
      
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">My Certificates</h1>
          <p className="text-muted-foreground">View and download your earned certificates.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="glass-card rounded-3xl p-12 flex justify-center text-muted-foreground">
          <Loader2 className="animate-spin w-8 h-8 text-violet-400" />
        </div>
      ) : !certificates || certificates.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 flex flex-col items-center justify-center text-center border-white/5">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10">
            <Award size={24} className="text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No certificates yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Attend events and complete requirements to earn certificates. They will appear here once issued.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((cert: any) => (
            <div key={cert.id} className="glass-card rounded-2xl p-6 relative overflow-hidden group border border-white/5">
              <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
              
              <div className="flex items-start justify-between mb-4 relative z-10">
                <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center shrink-0">
                  <Award className="text-amber-400" size={24} />
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end text-emerald-400 mb-1">
                    <CheckCircle2 size={12} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Verified</span>
                  </div>
                  <div className="text-xs font-mono text-muted-foreground">{cert.certificateNumber}</div>
                </div>
              </div>

              <h3 className="text-xl font-bold text-white mb-1 relative z-10 line-clamp-2">
                {cert.event.title}
              </h3>
              <p className="text-sm text-primary mb-4 relative z-10 font-medium">
                {cert.template.type.replace(/_/g, ' ')} Certificate
              </p>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6 relative z-10">
                <Calendar size={14} />
                Issued {new Date(cert.createdAt).toLocaleDateString()}
              </div>

              <div className="flex gap-2 relative z-10">
                <button
                  onClick={() => setPreviewPdf(cert.pdfUrl)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-bold transition-colors"
                >
                  <Eye size={16} />
                  View
                </button>
                <a
                  href={cert.pdfUrl}
                  download={`ITSA_Certificate_${cert.certificateNumber}.pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/10 flex items-center justify-center"
                  title="Download PDF"
                >
                  <Download size={16} />
                </a>
                <Link
                  to={`/verify/certificate/${cert.certificateNumber}`}
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/10 flex items-center justify-center"
                  title="Verify online"
                >
                  <FileText size={16} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PDF Preview Modal */}
      {previewPdf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setPreviewPdf(null)} />
          <div className="relative w-full max-w-5xl h-[85vh] bg-[#0f111a] rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <FileText className="text-violet-400" size={20} />
                Certificate Preview
              </h3>
              <div className="flex items-center gap-3">
                <a 
                  href={previewPdf} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors"
                >
                  <ExternalLink size={16} /> Open in new tab
                </a>
                <button 
                  onClick={() => setPreviewPdf(null)}
                  className="p-1 text-muted-foreground hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-black/40">
              <iframe 
                src={`${previewPdf}#toolbar=0`} 
                className="w-full h-full border-0"
                title="Certificate PDF"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
