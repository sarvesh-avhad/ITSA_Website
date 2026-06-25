import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users } from 'lucide-react';
import { getRegistrationMode } from '@itsa/shared';

const events = [
  {
    id: 'code-o-fiesta',
    title: 'Code-O-Fiesta 2026',
    date: 'March 15, 2026',
    venue: 'Main Auditorium',
    image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=800',
    tags: ['Hackathon', 'Coding'],
    eventType: 'TEAM', minTeamSize: 2, maxTeamSize: 4
  },
  {
    id: 'stackstride',
    title: 'StackStride Web Dev',
    date: 'April 05, 2026',
    venue: 'Lab 402',
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800',
    tags: ['Workshop', 'Web'],
    eventType: 'INDIVIDUAL', minTeamSize: 1, maxTeamSize: 1
  },
  {
    id: 'alumni-nexus',
    title: 'Alumni Nexus',
    date: 'April 20, 2026',
    venue: 'Seminar Hall',
    image: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=800',
    tags: ['Networking', 'Talk'],
    eventType: 'INDIVIDUAL', minTeamSize: 1, maxTeamSize: 1
  },
  {
    id: 'tech-talk-series',
    title: 'Tech Talk: AI Era',
    date: 'May 02, 2026',
    venue: 'Virtual',
    image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=800',
    tags: ['Seminar', 'AI'],
    eventType: 'INDIVIDUAL', minTeamSize: 1, maxTeamSize: 1
  }
];

export function UpcomingEvents() {
  return (
    <section className="relative py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <motion.h2 
              className="text-4xl md:text-5xl font-black text-white mb-4"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              Upcoming <span className="gradient-text">Events</span>
            </motion.h2>
            <motion.p 
              className="text-lg text-muted-foreground max-w-xl"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              Don't miss out on our latest workshops, hackathons, and industry sessions designed to elevate your skills.
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <Link to="/events" className="glass-card bg-white/5 border-white/10 rounded-full px-8 py-3 text-sm font-medium text-white hover:bg-white/10 transition-colors inline-flex items-center gap-2">
              View All Events &rarr;
            </Link>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {events.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group liquid-glass rounded-2xl overflow-hidden border border-white/5 hover:border-violet-500/30 transition-colors flex flex-col"
            >
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={event.image} 
                  alt={event.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
                <div className="absolute top-4 left-4 flex gap-2">
                  {event.tags.map(tag => (
                    <span key={tag} className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-black/50 backdrop-blur-md text-white border border-white/10">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-white mb-4 line-clamp-2">{event.title}</h3>
                
                <div className="space-y-2 mt-auto mb-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-violet-400" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-cyan-400" />
                    <span>{event.venue}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-pink-400" />
                    <span>
                      {getRegistrationMode(event as any) === 'INDIVIDUAL' && '👤 Individual'}
                      {getRegistrationMode(event as any) === 'OPTIONAL_TEAM' && `👥 Individual / Team (${event.minTeamSize || 1}–${event.maxTeamSize || 'Unlimited'})`}
                      {getRegistrationMode(event as any) === 'MANDATORY_TEAM' && `👥 Team (${event.minTeamSize || 2}–${event.maxTeamSize || 'Unlimited'})`}
                    </span>
                  </div>
                </div>

                <Link 
                  to={`/events/${event.id}`}
                  className="w-full py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium text-center transition-colors mt-auto"
                >
                  Register Now
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
