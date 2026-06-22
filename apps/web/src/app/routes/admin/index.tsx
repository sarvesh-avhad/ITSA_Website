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
        {/* Recent Activity */}
        <div className="glass-card rounded-2xl p-6 border border-white/5 flex flex-col">
          <h3 className="text-xl font-bold text-white mb-6">Recent Activity</h3>
          <div className="space-y-6 flex-1">
            {[
              { text: "New user registered", time: "10 minutes ago", color: "text-blue-400", bg: "bg-blue-400/20" },
              { text: "Registration for Code-O-Fiesta", time: "1 hour ago", color: "text-emerald-400", bg: "bg-emerald-400/20" },
              { text: "Event StackStride updated", time: "3 hours ago", color: "text-amber-400", bg: "bg-amber-400/20" },
              { text: "Gallery album published", time: "1 day ago", color: "text-violet-400", bg: "bg-violet-400/20" },
            ].map((activity, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full mt-1.5 ${activity.bg} ${activity.color} ring-4 ring-background`} />
                  {i !== 3 && <div className="w-0.5 h-full bg-white/5 mt-2" />}
                </div>
                <div className="flex-1 pb-2">
                  <p className="text-white text-sm font-medium">{activity.text}</p>
                  <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mock Registration Chart */}
        <div className="glass-card rounded-2xl p-6 border border-white/5 flex flex-col">
          <h3 className="text-xl font-bold text-white mb-6">Registration Activity (Last 7 Days)</h3>
          <div className="flex-1 flex items-end gap-2 h-[250px] mt-auto">
            {[40, 25, 60, 30, 80, 45, 90].map((height, i) => (
              <div key={i} className="flex-1 flex flex-col justify-end group relative">
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {height} regs
                </div>
                <div 
                  className="w-full bg-gradient-to-t from-violet-600/50 to-violet-400 rounded-t-sm transition-all duration-500 group-hover:opacity-80" 
                  style={{ height: `${height}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-xs text-muted-foreground">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>
        </div>
      </div>
    </div>
  );
}
