import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export function useSiteConfig() {
  return useQuery({
    queryKey: ['public-cms'],
    queryFn: async () => {
      const res = await apiClient.get('/cms/public');
      return res.data.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
