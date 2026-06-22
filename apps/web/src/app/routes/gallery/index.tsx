import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import apiClient from '@/lib/api-client';
import { motion } from 'framer-motion';
import { Image as ImageIcon, Video, Images, Calendar } from 'lucide-react';

const DUMMY_ALBUMS = [
  {
    id: 'dummy-1',
    title: 'Code-O-Fiesta 2026',
    slug: 'code-o-fiesta-2026',
    coverImageUrl: '/assets/gallery/code-o-fiesta/photo1.jpg',
    mediaCount: 45,
    year: 2026,
    event: { title: 'Code-O-Fiesta' }
  },
  {
    id: 'dummy-2',
    title: 'StackStride Web Dev',
    slug: 'stackstride',
    coverImageUrl: '/assets/gallery/code-o-fiesta/photo2.jpg',
    mediaCount: 32,
    year: 2026,
    event: { title: 'Workshop' }
  },
  {
    id: 'dummy-3',
    title: 'Teachers Day',
    slug: 'teachers-day',
    coverImageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=800',
    mediaCount: 88,
    year: 2025,
    event: { title: 'Celebration' }
  },
  {
    id: 'dummy-4',
    title: 'Alumni Nexus',
    slug: 'alumni-nexus',
    coverImageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=800',
    mediaCount: 120,
    year: 2026,
    event: { title: 'Networking' }
  },
  {
    id: 'dummy-5',
    title: 'Industry Visit - TCS',
    slug: 'industry-visit',
    coverImageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800',
    mediaCount: 65,
    year: 2025,
    event: { title: 'Industrial Visit' }
  }
];

export default function GalleryPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['gallery-albums'],
    queryFn: async () => {
      const res = await apiClient.get('/gallery/albums?limit=20');
      return res.data;
    },
  });

  return (
    <div className="min-h-screen pt-28 pb-20 px-6">
      <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            Event <span className="gradient-text">Gallery</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Relive the memories. Browse through photos and videos from our past events, hackathons, and seminars.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-violet-600/30 border-t-violet-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {(!data?.data || data.data.length === 0 ? DUMMY_ALBUMS : data.data).map((album: any, index: number) => (
              <motion.div
                key={album.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                <Link
                  to={`/gallery/${album.slug}`}
                  className="group block glass-card rounded-2xl overflow-hidden"
                >
                  {/* Cover Image Placeholder */}
                  <div className="relative aspect-video bg-gradient-to-br from-violet-600/20 to-cyan-500/20 overflow-hidden">
                    {album.coverUrl || album.coverImageUrl ? (
                      <img 
                        src={album.coverUrl || album.coverImageUrl} 
                        alt={album.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-12 h-12 text-white/20" />
                      </div>
                    )}
                    
                    {/* Media Count Badge */}
                    <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md text-white text-xs font-medium flex items-center gap-1.5">
                      <Images size={14} />
                      {album.mediaCount} items
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="font-bold text-white text-lg mb-1 group-hover:text-violet-400 transition-colors line-clamp-1">
                      {album.title}
                    </h3>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={14} />
                        {album.year}
                      </span>
                      {album.event && (
                        <span className="truncate max-w-[120px] bg-white/5 px-2 py-0.5 rounded text-xs">
                          {album.event.title}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
