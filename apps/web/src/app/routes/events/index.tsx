import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import apiClient from '@/lib/api-client';
import { Search, Calendar, MapPin, Users, Filter, SlidersHorizontal, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const fetchEvents = async (searchParams: URLSearchParams) => {
  const { data } = await apiClient.get(`/events?${searchParams.toString()}`);
  return data;
};

const fetchCategories = async () => {
  const { data } = await apiClient.get('/events/categories');
  return data.data;
};

const statusConfig = {
  UPCOMING: { label: 'Upcoming', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  ONGOING: { label: 'Live Now', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  COMPLETED: { label: 'Completed', className: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
  DRAFT: { label: 'Draft', className: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
  CANCELLED: { label: 'Cancelled', className: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

import { SEO } from '@/components/seo';

export default function EventsListingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ['events', searchParams.toString()],
    queryFn: () => fetchEvents(searchParams),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const search = formData.get('search') as string;

    const newParams = new URLSearchParams(searchParams);
    if (search) newParams.set('search', search);
    else newParams.delete('search');
    
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const setFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === 'ALL') newParams.delete(key);
    else newParams.set(key, value);
    
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  return (
    <div className="min-h-screen pt-28 pb-20">
      <SEO title="Events" description="Explore workshops, hackathons, and competitions organized by ITSA." />
      {/* Background */}
      <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            Explore <span className="gradient-text">Events</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Discover workshops, hackathons, and competitions. Register to participate, compete, and learn.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="glass-card rounded-2xl p-4 mb-8 sticky top-24 z-30 shadow-2xl shadow-black/50">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                name="search"
                defaultValue={searchParams.get('search') || ''}
                placeholder="Search events..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-border text-white placeholder:text-muted-foreground focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all outline-none"
              />
            </form>

            <div className="flex w-full md:w-auto items-center gap-3 overflow-x-auto no-scrollbar pb-2 md:pb-0">
              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFilter('categoryId', 'ALL')}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                    !searchParams.get('categoryId') ? "bg-violet-600 text-white" : "glass hover:bg-white/10 text-muted-foreground"
                  )}
                >
                  All
                </button>
                {categories?.map((cat: any) => (
                  <button
                    key={cat.id}
                    onClick={() => setFilter('categoryId', cat.id)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors border border-transparent",
                      searchParams.get('categoryId') === cat.id 
                        ? "bg-white/10 text-white border-white/20" 
                        : "glass hover:bg-white/10 text-muted-foreground"
                    )}
                    style={searchParams.get('categoryId') === cat.id ? { borderColor: cat.color, color: cat.color, backgroundColor: `${cat.color}15` } : {}}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Mobile Filter Toggle */}
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="md:hidden p-2.5 rounded-xl glass border border-border text-white ml-auto"
              >
                <SlidersHorizontal size={20} />
              </button>
            </div>
          </div>

          {/* Advanced Filters (Expandable) */}
          <AnimatePresence>
            {isFilterOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden md:!h-auto md:!opacity-100"
              >
                <div className="pt-4 mt-4 border-t border-white/5 flex flex-wrap gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</label>
                    <select
                      value={searchParams.get('status') || 'ALL'}
                      onChange={(e) => setFilter('status', e.target.value)}
                      className="bg-white/5 border border-border text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500"
                    >
                      <option value="ALL">All Status</option>
                      <option value="UPCOMING">Upcoming</option>
                      <option value="ONGOING">Live Now</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Event Type</label>
                    <select
                      value={searchParams.get('eventType') || 'ALL'}
                      onChange={(e) => setFilter('eventType', e.target.value)}
                      className="bg-white/5 border border-border text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500"
                    >
                      <option value="ALL">All Types</option>
                      <option value="INDIVIDUAL">Individual</option>
                      <option value="TEAM">Team</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Results Grid */}
        {eventsLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-violet-600/30 border-t-violet-600 rounded-full animate-spin" />
          </div>
        ) : eventsData?.data?.length === 0 ? (
          <div className="text-center py-20 glass-card rounded-2xl">
            <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-white mb-2">No events found</h3>
            <p className="text-muted-foreground mb-6">Try adjusting your search or filters to find what you're looking for.</p>
            <button
              onClick={() => setSearchParams(new URLSearchParams())}
              className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventsData?.data?.map((event: any, index: number) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <Link
                  to={`/events/${event.slug}`}
                  className="block glass-card rounded-2xl overflow-hidden group h-full flex flex-col"
                >
                  {/* Card Header / Image Placeholder */}
                  <div className="relative h-48 bg-gradient-to-br from-violet-600/20 via-purple-600/10 to-cyan-500/20 flex items-center justify-center overflow-hidden shrink-0">
                    <div className="absolute inset-0 bg-grid opacity-30" />
                    <div className="relative text-center">
                      <div
                        className="text-6xl font-black opacity-10 group-hover:opacity-20 transition-opacity"
                        style={{ color: event.category?.color || '#7c3aed' }}
                      >
                        {event.title.split(' ')[0]}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="absolute top-4 left-4">
                      <span
                        className={cn(
                          'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-md',
                          (statusConfig as any)[event.status]?.className || statusConfig.UPCOMING.className
                        )}
                      >
                        {event.status === 'ONGOING' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse" />
                        )}
                        {(statusConfig as any)[event.status]?.label || event.status}
                      </span>
                    </div>

                    {/* Category Badge */}
                    {event.category && (
                      <div className="absolute top-4 right-4">
                        <span
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md"
                          style={{
                            backgroundColor: `${event.category.color}25`,
                            color: event.category.color,
                            border: `1px solid ${event.category.color}40`,
                          }}
                        >
                          {event.category.name}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-violet-400 transition-colors">
                      {event.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6 line-clamp-2 flex-1">
                      {event.shortDescription}
                    </p>

                    {/* Meta */}
                    <div className="space-y-3 text-sm text-muted-foreground mt-auto">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                          <Calendar size={14} className="text-violet-400" />
                        </div>
                        <span className="font-medium text-white/80">
                          {new Date(event.startDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                          <MapPin size={14} className="text-cyan-400" />
                        </div>
                        <span className="font-medium text-white/80 truncate">
                          {event.venue || 'TBA'}
                        </span>
                      </div>
                    </div>

                    {/* Registration Progress */}
                    {event.maxParticipants && (
                      <div className="mt-6 pt-6 border-t border-white/10">
                        <div className="flex justify-between text-xs mb-2">
                          <span className="text-muted-foreground">Registration fills fast!</span>
                          <span className="text-white font-medium">{event.currentCount} / {event.maxParticipants}</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 transition-all duration-500"
                            style={{
                              width: `${Math.min((event.currentCount / event.maxParticipants) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {eventsData?.meta?.totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-2">
            {Array.from({ length: eventsData.meta.totalPages }).map((_, i) => {
              const page = i + 1;
              const isCurrent = page === eventsData.meta.page;
              return (
                <button
                  key={page}
                  onClick={() => {
                    const newParams = new URLSearchParams(searchParams);
                    newParams.set('page', page.toString());
                    setSearchParams(newParams);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold transition-all",
                    isCurrent 
                      ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30" 
                      : "glass hover:bg-white/10 text-muted-foreground hover:text-white"
                  )}
                >
                  {page}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
