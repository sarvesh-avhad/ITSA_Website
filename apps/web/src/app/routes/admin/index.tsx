import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Users, Calendar, CheckCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const fetchStats = async () => {
  const { data } = await apiClient.get('/admin/stats');
  return data.data;
};

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: fetchStats,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-violet-600/30 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    { title: 'Total Users', value: stats?.users?.total || 0, icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { title: 'Total Events', value: stats?.events?.total || 0, icon: Calendar, color: 'text-violet-400', bg: 'bg-violet-400/10' },
    { title: 'Registrations', value: stats?.registrations?.total || 0, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { title: 'Upcoming Events', value: stats?.events?.upcoming || 0, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard Overview</h1>
        <p className="text-muted-foreground">Welcome to the ITSA administration panel.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card rounded-2xl p-6 border border-white/5 relative overflow-hidden group"
            >
              <div className={`absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 group-hover:opacity-20 transition-all duration-500 ${stat.color}`}>
                <Icon size={80} />
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${stat.bg}`}>
                <Icon size={24} className={stat.color} />
              </div>
              <div className="relative z-10">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">{stat.title}</h3>
                <div className="text-4xl font-black text-white tabular-nums">{stat.value}</div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-8">
        {/* Placeholder for charts or recent activity */}
        <div className="glass-card rounded-2xl p-6 border border-white/5 min-h-[400px] flex items-center justify-center text-muted-foreground">
          Recent Activity Component (To be implemented)
        </div>
        <div className="glass-card rounded-2xl p-6 border border-white/5 min-h-[400px] flex items-center justify-center text-muted-foreground">
          Registrations Chart (To be implemented)
        </div>
      </div>
    </div>
  );
}
