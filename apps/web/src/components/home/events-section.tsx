import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Calendar, MapPin, Users, ArrowRight, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

// Sample events data (will be replaced by API data)
const sampleEvents = [
  {
    id: '1',
    title: 'Code-O-Fiesta 2026',
    slug: 'code-o-fiesta-2026',
    shortDescription: "ITSA's flagship annual coding competition — compete in algorithmic challenges and win prizes worth ₹50,000+",
    startDate: '2026-08-15T09:00:00',
    venue: 'Seminar Hall, IT Department',
    status: 'UPCOMING' as keyof typeof statusConfig,
    currentCount: 45,
    maxParticipants: 200,
    category: { name: 'Coding', color: '#7c3aed' },
    isFeatured: true,
  },
  {
    id: '2',
    title: 'StackStride 2026',
    slug: 'stackstride-2026',
    shortDescription: '24-hour hackathon — build innovative solutions to real-world problems. Theme: AI & Sustainability.',
    startDate: '2026-09-20T10:00:00',
    venue: 'Innovation Lab, Main Building',
    status: 'UPCOMING' as keyof typeof statusConfig,
    currentCount: 12,
    maxParticipants: 50,
    category: { name: 'Hackathon', color: '#f59e0b' },
    isFeatured: true,
  },
  {
    id: '3',
    title: 'Alumni Nexus 2026',
    slug: 'alumni-nexus-2026',
    shortDescription: 'Networking event bridging current students with successful alumni at top tech companies.',
    startDate: '2026-07-10T14:00:00',
    venue: 'Auditorium, Main Campus',
    status: 'UPCOMING' as keyof typeof statusConfig,
    currentCount: 156,
    maxParticipants: 300,
    category: { name: 'Seminar', color: '#10b981' },
    isFeatured: false,
  },
];

const statusConfig = {
  UPCOMING: { label: 'Upcoming', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  ONGOING: { label: 'Live Now', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  COMPLETED: { label: 'Completed', className: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
  DRAFT: { label: 'Draft', className: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
  CANCELLED: { label: 'Cancelled', className: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

export function EventsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="section-padding relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(124,58,237,0.06)_0%,transparent_50%)]" />

      <div className="relative max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12 gap-4"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div>
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest text-violet-400 bg-violet-500/10 border border-violet-500/20 mb-4">
              Events
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white">
              Upcoming <span className="gradient-text">Events</span>
            </h2>
          </div>
          <Link
            to="/events"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl glass border border-white/10 text-sm font-medium text-white hover:bg-white/[0.06] transition-all group"
          >
            View All Events
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        {/* Events Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sampleEvents.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Link
                to={`/events/${event.slug}`}
                className="block liquid-glass rounded-2xl overflow-hidden group"
              >
                {/* Card Header / Image Placeholder */}
                <div className="relative h-48 bg-gradient-to-br from-violet-600/20 via-purple-600/10 to-cyan-500/20 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-grid opacity-30" />
                  <div className="relative text-center">
                    <div
                      className="text-6xl font-black opacity-10 group-hover:opacity-20 transition-opacity"
                      style={{ color: event.category.color }}
                    >
                      {event.title.split(' ')[0]}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="absolute top-4 left-4">
                    <span
                      className={cn(
                        'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border',
                        statusConfig[event.status].className
                      )}
                    >
                      {event.status === 'ONGOING' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse" />
                      )}
                      {statusConfig[event.status].label}
                    </span>
                  </div>

                  {/* Category Badge */}
                  <div className="absolute top-4 right-4">
                    <span
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: `${event.category.color}15`,
                        color: event.category.color,
                        border: `1px solid ${event.category.color}30`,
                      }}
                    >
                      {event.category.name}
                    </span>
                  </div>

                  {/* Featured Badge */}
                  {event.isFeatured && (
                    <div className="absolute bottom-4 right-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        ★ Featured
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-violet-400 transition-colors">
                    {event.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {event.shortDescription}
                  </p>

                  {/* Meta */}
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-violet-400" />
                      <span>
                        {new Date(event.startDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-violet-400" />
                      <span>{event.venue}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-violet-400" />
                      <span>
                        {event.currentCount}/{event.maxParticipants} registered
                      </span>
                    </div>
                  </div>

                  {/* Registration Progress */}
                  <div className="mt-4">
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            (event.currentCount / (event.maxParticipants || 1)) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1.5">
                      {Math.round((event.currentCount / (event.maxParticipants || 1)) * 100)}% filled
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
