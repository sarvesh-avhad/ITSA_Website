import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { ArrowLeft, Play, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const fetchAlbumDetail = async (slug: string) => {
  try {
    const { data } = await apiClient.get(`/gallery/albums/${slug}`);
    if (data?.data) return data.data;
  } catch (err) {
    console.log('Using dummy data for album detail');
  }

  // Fallback Dummy Data
  return {
    title: slug.replace(/-/g, ' ').toUpperCase(),
    description: 'This is a sample event description showcasing our past events and hackathons. Click on any media to view it in full size.',
    media: [
      { id: '1', type: 'IMAGE', url: 'https://placehold.co/800x600/1a1a2e/7c3aed?text=Photo+1', caption: 'Event Kickoff' },
      { id: '2', type: 'IMAGE', url: 'https://placehold.co/800x600/1a1a2e/06b6d4?text=Photo+2', caption: 'Keynote Speaker' },
      { id: '3', type: 'IMAGE', url: 'https://placehold.co/800x600/1a1a2e/f59e0b?text=Photo+3', caption: 'Networking Session' },
      { id: '4', type: 'IMAGE', url: 'https://placehold.co/800x600/1a1a2e/ec4899?text=Photo+4', caption: 'Prize Distribution' },
      { id: '5', type: 'IMAGE', url: 'https://placehold.co/800x600/1a1a2e/10b981?text=Photo+5', caption: 'Group Photo' },
    ]
  };
};

export default function AlbumDetailPage() {
  const { slug } = useParams();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const { data: album, isLoading } = useQuery({
    queryKey: ['album', slug],
    queryFn: () => fetchAlbumDetail(slug as string),
    enabled: !!slug,
  });

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  
  const showPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex !== null && album?.media) {
      setLightboxIndex((lightboxIndex - 1 + album.media.length) % album.media.length);
    }
  };
  
  const showNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex !== null && album?.media) {
      setLightboxIndex((lightboxIndex + 1) % album.media.length);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-28 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-violet-600/30 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!album) return null;

  const currentMedia = lightboxIndex !== null ? album.media[lightboxIndex] : null;

  return (
    <div className="min-h-screen pt-28 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link to="/gallery" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-white mb-6 transition-colors">
            <ArrowLeft size={16} />
            Back to Gallery
          </Link>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">{album.title}</h1>
          <p className="text-muted-foreground max-w-3xl">{album.description}</p>
        </div>

        {/* Masonry-like Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {album.media.map((item: any, index: number) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              onClick={() => openLightbox(index)}
              className="relative group cursor-pointer rounded-xl overflow-hidden bg-white/5 aspect-square"
            >
              <img
                src={item.thumbnailUrl || item.url}
                alt={item.caption || 'Gallery media'}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                loading="lazy"
              />
              
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                {item.type === 'VIDEO' && (
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                    <Play className="text-white fill-white ml-1" size={20} />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && currentMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center"
            onClick={closeLightbox}
          >
            {/* Close Button */}
            <button 
              className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-50"
              onClick={closeLightbox}
            >
              <X size={24} />
            </button>

            {/* Navigation Controls */}
            {album.media.length > 1 && (
              <>
                <button 
                  className="absolute left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-50"
                  onClick={showPrev}
                >
                  <ChevronLeft size={32} />
                </button>
                <button 
                  className="absolute right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-50"
                  onClick={showNext}
                >
                  <ChevronRight size={32} />
                </button>
              </>
            )}

            {/* Content */}
            <div 
              className="relative max-w-5xl max-h-[80vh] w-full px-12"
              onClick={(e) => e.stopPropagation()}
            >
              {currentMedia.type === 'VIDEO' ? (
                <video 
                  src={currentMedia.url} 
                  controls 
                  autoPlay 
                  className="w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
                />
              ) : (
                <img 
                  src={currentMedia.url} 
                  alt={currentMedia.caption} 
                  className="w-full max-h-[80vh] object-contain rounded-xl shadow-2xl mx-auto"
                />
              )}
              
              {/* Caption */}
              {(currentMedia.caption || currentMedia.type === 'VIDEO') && (
                <div className="absolute -bottom-16 left-0 right-0 text-center">
                  <p className="text-white text-lg font-medium">{currentMedia.caption}</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    {lightboxIndex + 1} of {album.media.length}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
