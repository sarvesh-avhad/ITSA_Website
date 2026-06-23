import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import apiClient from '@/lib/api-client';
import { Calendar, MapPin, Users, Clock, AlertCircle, ChevronRight, CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn, timeUntil } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { SEO } from '@/components/seo';
import { AuthModal } from '@/components/auth/auth-modal';

const fetchEventDetail = async (slug: string) => {
  const { data } = await apiClient.get(`/events/${slug}`);
  return data.data;
};

// Countdown Timer Component
function CountdownTimer({ deadline }: { deadline: string }) {
  const [timeLeft, setTimeLeft] = useState(timeUntil(deadline));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(timeUntil(deadline));
    }, 1000);
    return () => clearInterval(timer);
  }, [deadline]);

  return (
    <div className="grid grid-cols-4 gap-4 text-center">
      {[
        { label: 'Days', value: timeLeft.days },
        { label: 'Hours', value: timeLeft.hours },
        { label: 'Minutes', value: timeLeft.minutes },
        { label: 'Seconds', value: timeLeft.seconds },
      ].map((item) => (
        <div key={item.label} className="glass-card rounded-xl p-3 sm:p-4">
          <div className="text-2xl sm:text-4xl font-black text-white tabular-nums tracking-tighter">
            {item.value.toString().padStart(2, '0')}
          </div>
          <div className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-widest mt-1">
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function EventDetailPage() {
  const { slug } = useParams();
  const { isAuthenticated } = useAuthStore();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const { data: event, isLoading, error } = useQuery({
    queryKey: ['event', slug],
    queryFn: () => fetchEventDetail(slug as string),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen pt-28 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-violet-600/30 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen pt-28 flex flex-col items-center justify-center text-center px-6">
        <h1 className="text-4xl font-bold text-white mb-4">Event Not Found</h1>
        <p className="text-muted-foreground mb-8">The event you are looking for does not exist or has been removed.</p>
        <Link to="/events" className="btn-glow px-6 py-3 bg-violet-600 text-white rounded-xl font-semibold">
          Back to Events
        </Link>
      </div>
    );
  }

  const isRegistrationOpen = event.status === 'UPCOMING' && 
    (!event.registrationDeadline || new Date() < new Date(event.registrationDeadline)) &&
    (!event.maxParticipants || event.currentCount < event.maxParticipants);

  return (
    <div className="min-h-screen pb-20">
      <SEO title={event.title} description={event.shortDescription} />
      {/* Hero Banner Section */}
      <div className="relative pt-28 pb-20 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-background" />
          <div 
            className="absolute inset-0 opacity-20 blur-3xl"
            style={{ 
              background: `radial-gradient(circle at center, ${event.category?.color || '#7c3aed'}50 0%, transparent 70%)` 
            }}
          />
          <div className="absolute inset-0 bg-grid opacity-30" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <Link to="/events" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-white mb-8 transition-colors">
            <ArrowLeft size={16} />
            Back to all events
          </Link>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Title & Short Description */}
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
              <div className="flex items-center gap-3 mb-6">
                <span 
                  className="px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md"
                  style={{ backgroundColor: `${event.category?.color || '#7c3aed'}25`, color: event.category?.color || '#7c3aed', border: `1px solid ${event.category?.color || '#7c3aed'}40` }}
                >
                  {event.category?.name || 'General'}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/5 border border-border text-white">
                  {event.eventType === 'TEAM' ? 'Team Event' : 'Individual Event'}
                </span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.1] mb-6">
                {event.title}
              </h1>
              
              <p className="text-xl text-muted-foreground mb-8 text-balance">
                {event.shortDescription}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                {isRegistrationOpen ? (
                  isAuthenticated ? (
                    <Link
                      to={`/events/${event.slug}/register`}
                      className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white font-bold text-lg shadow-xl shadow-violet-600/25 hover:shadow-violet-500/40 hover:scale-[1.02] transition-all btn-glow"
                    >
                      Register Now
                      <ArrowRight size={20} />
                    </Link>
                  ) : (
                    <button
                      onClick={() => setIsAuthModalOpen(true)}
                      className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white font-bold text-lg shadow-xl shadow-violet-600/25 hover:shadow-violet-500/40 hover:scale-[1.02] transition-all btn-glow"
                    >
                      Register Now
                      <ArrowRight size={20} />
                    </button>
                  )
                ) : (
                  <div className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl glass border border-white/10 text-muted-foreground font-bold text-lg cursor-not-allowed">
                    <AlertCircle size={20} />
                    Registration Closed
                  </div>
                )}
              </div>
            </motion.div>

            {/* Info Cards / Countdown */}
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="space-y-6">
              {event.status === 'UPCOMING' && (
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">Event starts in</h3>
                  <CountdownTimer deadline={event.startDate} />
                </div>
              )}

              <div className="glass-card rounded-2xl p-6 space-y-6 border-t border-white/10">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-violet-600/10 flex items-center justify-center shrink-0">
                    <Calendar size={24} className="text-violet-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-lg">Date & Time</h4>
                    <p className="text-muted-foreground mt-1">
                      {new Date(event.startDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-muted-foreground">
                      {new Date(event.startDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      {' - '}
                      {new Date(event.endDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div className="w-full h-px bg-border" />

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0">
                    <MapPin size={24} className="text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-lg">Venue</h4>
                    <p className="text-muted-foreground mt-1">{event.venue || 'To be announced'}</p>
                  </div>
                </div>

                {event.maxParticipants && (
                  <>
                    <div className="w-full h-px bg-border" />
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                        <Users size={24} className="text-amber-400" />
                      </div>
                      <div className="w-full pr-4">
                        <h4 className="text-white font-semibold text-lg flex justify-between">
                          <span>Capacity</span>
                          <span className="text-sm bg-white/10 px-2 py-1 rounded-md">{event.currentCount} / {event.maxParticipants}</span>
                        </h4>
                        <div className="mt-3 h-2 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                            style={{ width: `${Math.min((event.currentCount / event.maxParticipants) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main Content Section */}
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-3 gap-12 mt-12">
        <div className="lg:col-span-2 space-y-12">
          {/* Details (HTML Content) */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-violet-600/20 flex items-center justify-center">
                <CheckCircle2 size={16} className="text-violet-400" />
              </span>
              About the Event
            </h2>
            <div 
              className="prose prose-invert prose-violet max-w-none text-muted-foreground prose-headings:text-white prose-a:text-violet-400 hover:prose-a:text-violet-300"
              dangerouslySetInnerHTML={{ __html: event.description }}
            />
          </section>

          {/* Rules */}
          {event.rules && (
            <section>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <AlertCircle size={16} className="text-cyan-400" />
                </span>
                Rules & Guidelines
              </h2>
              <div className="glass-card rounded-2xl p-6 sm:p-8">
                <div 
                  className="prose prose-invert prose-cyan max-w-none text-muted-foreground whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: event.rules }}
                />
              </div>
            </section>
          )}

          {/* FAQs */}
          {event.faqs && event.faqs.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <Lightbulb size={16} className="text-amber-400" />
                </span>
                Frequently Asked Questions
              </h2>
              <div className="space-y-4">
                {event.faqs.map((faq: any, index: number) => (
                  <div key={index} className="glass border border-white/5 rounded-xl overflow-hidden">
                    <div className="px-6 py-4 bg-white/[0.02]">
                      <h4 className="text-white font-semibold">{faq.question}</h4>
                    </div>
                    <div className="px-6 py-4 border-t border-white/5 text-muted-foreground">
                      {faq.answer}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Schedule */}
          {event.schedule && event.schedule.length > 0 && (
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Clock size={20} className="text-violet-400" />
                Schedule
              </h3>
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
                {event.schedule.map((item: any, index: number) => (
                  <div key={index} className="relative flex items-start gap-4">
                    <div className="w-6 h-6 rounded-full bg-background border-2 border-violet-500 flex items-center justify-center mt-1 z-10 shrink-0">
                      <div className="w-2 h-2 rounded-full bg-violet-500" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-violet-400 mb-1">{item.time}</div>
                      <h4 className="text-white font-semibold">{item.title}</h4>
                      {item.description && <p className="text-sm text-muted-foreground mt-1">{item.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sponsors specific to this event */}
          {event.sponsors && event.sponsors.length > 0 && (
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-6">Event Sponsors</h3>
              <div className="space-y-4">
                {event.sponsors.map(({ sponsor }: any) => (
                  <a key={sponsor.id} href="#" className="block p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-transparent hover:border-white/10">
                    <img src={sponsor.logoUrl} alt={sponsor.name} className="h-8 object-contain mb-3" />
                    <div className="text-sm font-semibold text-white">{sponsor.name}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">{sponsor.tier} Partner</div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onSuccess={() => setIsAuthModalOpen(false)} 
      />
    </div>
  );
}

// Ensure Lightbulb is imported
import { Lightbulb } from 'lucide-react';
