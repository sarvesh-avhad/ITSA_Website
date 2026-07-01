import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import apiClient from '@/lib/api-client';
import { Loader2, CheckCircle, XCircle, ShieldCheck, Download, Calendar, User, Trophy, CalendarDays, ExternalLink, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

export default function CertificateVerifyPage() {
  const { tokenOrNumber } = useParams<{ tokenOrNumber: string }>();

  const { data: verifyData, isLoading } = useQuery({
    queryKey: ['verifyCertificate', tokenOrNumber],
    queryFn: async () => {
      const { data } = await apiClient.get(`/certificates/verify/${tokenOrNumber}`);
      return data.data;
    },
    enabled: !!tokenOrNumber,
    retry: false
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isValid = verifyData?.isValid;
  const cert = verifyData?.certificate;

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      <Link 
        to="/" 
        className="absolute top-8 left-8 text-xl font-bold tracking-tighter hover:text-primary transition-colors flex items-center gap-2"
      >
        <span className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white text-sm">
          IT
        </span>
        ITSA
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl z-10"
      >
        <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          
          {/* Status Header */}
          <div className="flex flex-col items-center text-center mb-10">
            <div className="relative mb-6">
              {isValid ? (
                <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center border-4 border-emerald-500/30">
                  <ShieldCheck className="w-12 h-12 text-emerald-400" />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center border-4 border-red-500/30">
                  <XCircle className="w-12 h-12 text-red-400" />
                </div>
              )}
              {isValid && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-full border-2 border-black"
                >
                  <CheckCircle className="w-5 h-5" />
                </motion.div>
              )}
            </div>
            
            <h1 className="text-3xl font-bold mb-3">
              {isValid ? 'Certificate Verified' : 'Verification Failed'}
            </h1>
            <p className="text-muted-foreground text-lg max-w-md">
              {isValid 
                ? 'This is a valid, officially issued certificate by ITSA.'
                : 'The certificate number or verification token is invalid, revoked, or does not exist.'}
            </p>
          </div>

          {isValid && cert && (
            <div className="space-y-6">
              {/* Certificate Details Card */}
              <div className="bg-black/40 rounded-2xl p-6 border border-white/5 shadow-inner">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div>
                    <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                      <User className="w-4 h-4" /> Holder Name
                    </div>
                    <div className="font-semibold text-lg">{cert.holder}</div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                      <Trophy className="w-4 h-4" /> Certificate Type
                    </div>
                    <div className="font-semibold text-lg capitalize">{cert.type.replace(/_/g, ' ')}</div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                      <CalendarDays className="w-4 h-4" /> Event
                    </div>
                    <div className="font-semibold text-lg">{cert.event}</div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> Issue Date
                    </div>
                    <div className="font-semibold text-lg">{format(new Date(cert.issueDate), 'MMMM d, yyyy')}</div>
                  </div>
                  
                </div>

                <div className="mt-6 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-mono">Certificate ID</div>
                    <div className="font-mono text-white/90">{cert.number}</div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full text-sm font-medium border border-emerald-400/20">
                    <Activity className="w-4 h-4" />
                    Active Status
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Verification Footer Note */}
          <div className="mt-8 text-center text-xs text-muted-foreground">
            <p>To report an issue with this certificate, contact <a href="mailto:admin@itsa.com" className="text-primary hover:underline">admin@itsa.com</a></p>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
