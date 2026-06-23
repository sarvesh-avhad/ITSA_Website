import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Award, Search, CheckCircle2, XCircle, Loader2, Calendar, User, Download } from 'lucide-react';
import { SEO } from '@/components/seo';
import { motion } from 'framer-motion';

export default function CertificateVerifyPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [certId, setCertId] = useState(searchParams.get('id') || '');
  const [searchedId, setSearchedId] = useState(searchParams.get('id') || '');

  // Update URL and searchedId when the form is submitted
  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certId.trim()) return;
    setSearchedId(certId.trim());
    setSearchParams({ id: certId.trim() });
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['verify-certificate', searchedId],
    queryFn: async () => {
      if (!searchedId) return null;
      const res = await apiClient.get(`/certificates/${searchedId}/verify`);
      return res.data.data;
    },
    enabled: !!searchedId,
    retry: false,
  });

  return (
    <div className="min-h-screen pt-28 pb-20 px-6">
      <SEO title="Verify Certificate" description="Verify the authenticity of ITSA certificates." />
      
      {/* Background */}
      <div className="fixed inset-0 z-0 bg-grid opacity-20 pointer-events-none" />
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="w-16 h-16 bg-violet-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-violet-500/20 shadow-[0_0_30px_rgba(124,58,237,0.3)]">
              <Award className="text-violet-400" size={32} />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
              Verify <span className="gradient-text">Certificate</span>
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Enter the unique certificate ID found at the bottom of the certificate to verify its authenticity.
            </p>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ delay: 0.1 }}
          className="glass-card rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/50 mb-12"
        >
          <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search className="text-muted-foreground" size={20} />
              </div>
              <input
                type="text"
                value={certId}
                onChange={(e) => setCertId(e.target.value)}
                placeholder="e.g. cert_clh3k..."
                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-border rounded-xl text-white placeholder:text-muted-foreground focus:outline-none focus:border-violet-500 text-lg transition-colors font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={!certId.trim() || isLoading}
              className="btn-glow px-8 py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors shrink-0"
            >
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : 'Verify'}
            </button>
          </form>
        </motion.div>

        {/* Results Section */}
        {searchedId && !isLoading && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {isError ? (
              <div className="glass-card rounded-3xl p-8 border-red-500/20 bg-red-500/5 text-center">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                  <XCircle className="text-red-500" size={32} />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Invalid Certificate</h2>
                <p className="text-muted-foreground">
                  We couldn't find a valid certificate matching the ID <span className="font-mono text-white">"{searchedId}"</span>.
                </p>
              </div>
            ) : data ? (
              <div className="glass-card rounded-3xl p-8 border-emerald-500/20 bg-emerald-500/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
                  <div className="w-24 h-24 bg-emerald-500/10 rounded-2xl flex items-center justify-center shrink-0 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                    <CheckCircle2 className="text-emerald-400" size={48} />
                  </div>
                  
                  <div className="flex-1 text-center md:text-left">
                    <h2 className="text-2xl font-bold text-white mb-2">Verified Successfully!</h2>
                    <p className="text-emerald-400/80 mb-6">This is a valid, officially issued ITSA certificate.</p>
                    
                    <div className="grid sm:grid-cols-2 gap-6 bg-background/50 rounded-2xl p-6 border border-border/50">
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1.5 justify-center md:justify-start">
                          <User size={14} /> Recipient
                        </div>
                        <div className="font-bold text-white text-lg">{data.user.firstName} {data.user.lastName}</div>
                      </div>
                      
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1.5 justify-center md:justify-start">
                          <Award size={14} /> Event
                        </div>
                        <div className="font-bold text-white">{data.event.title}</div>
                      </div>
                      
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1.5 justify-center md:justify-start">
                          <Calendar size={14} /> Issued On
                        </div>
                        <div className="text-white">{new Date(data.issuedAt).toLocaleDateString()}</div>
                      </div>
                      
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1.5 justify-center md:justify-start">
                          <Award size={14} /> Certificate ID
                        </div>
                        <div className="font-mono text-white text-sm">{data.id}</div>
                      </div>
                    </div>

                    <div className="mt-8 flex justify-center md:justify-start">
                      <a
                        href={`/api/v1/certificates/${data.id}/download`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-glow inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-100 text-black rounded-xl font-bold transition-colors"
                      >
                        <Download size={18} />
                        Download Original PDF
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </motion.div>
        )}
      </div>
    </div>
  );
}
