import { useState, useEffect } from 'react';
import { Search, Loader2, ArrowRight, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from '@/hooks/use-debounce'; // Will need to create this hook

export function GlobalSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['global-search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery) return null;
      // In a real app, this might be a dedicated global search endpoint
      // Here we'll search events as an example
      const { data } = await apiClient.get(`/events?search=${debouncedQuery}&limit=5`);
      return data.data;
    },
    enabled: debouncedQuery.length > 2,
  });

  // Handle Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(true);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [onOpenChange]);

  const handleClose = () => {
    onOpenChange(false);
    setQuery('');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] sm:pt-[15vh]">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-[600px] mx-4 bg-[#111118] border border-white/10 shadow-2xl shadow-black/50 rounded-2xl overflow-hidden flex flex-col">
        {/* Search Input */}
        <div className="flex items-center px-4 py-4 border-b border-white/10">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <input
            className="flex-1 bg-transparent border-none outline-none px-4 text-base text-white placeholder:text-muted-foreground"
            placeholder="Search events..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
          ) : (
            <button onClick={handleClose} className="p-1 rounded-md hover:bg-white/10 text-muted-foreground transition-colors">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {!query && (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Type to start searching...
            </div>
          )}

          {query && !isLoading && data?.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No results found for "{query}"
            </div>
          )}

          <AnimatePresence>
            {data && data.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Events
                </div>
                {data.map((event: any) => (
                  <Link
                    key={event.id}
                    to={`/events/${event.slug}`}
                    onClick={handleClose}
                    className="flex flex-col gap-1 p-3 rounded-xl hover:bg-white/5 transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white group-hover:text-violet-400 transition-colors">
                        {event.title}
                      </span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-xs text-muted-foreground line-clamp-1">
                      {event.shortDescription}
                    </span>
                  </Link>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
