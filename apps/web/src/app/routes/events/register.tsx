import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { getDisplayName, getInitials } from '@/lib/utils';
import apiClient from '@/lib/api-client';
import { individualRegistrationSchema, teamRegistrationSchema } from '@itsa/shared';
import { Loader2, ArrowLeft, Users, User, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';

const fetchEventDetail = async (slug: string) => {
  const { data } = await apiClient.get(`/events/${slug}`);
  return data.data;
};

export default function EventRegistrationPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', slug],
    queryFn: () => fetchEventDetail(slug as string),
    enabled: !!slug,
  });

  const isTeam = event?.eventType === 'TEAM';

  const individualForm = useForm({
    resolver: zodResolver(individualRegistrationSchema),
    defaultValues: { eventId: '' },
  });

  const teamForm = useForm({
    resolver: zodResolver(teamRegistrationSchema),
    defaultValues: { 
      eventId: '', 
      teamName: '', 
      members: [{ name: '', email: '', phone: '', prn: '', branch: '', year: 1 }] 
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: teamForm.control,
    name: 'members' as never,
  });

  // Set event ID once loaded
  if (event && !individualForm.getValues('eventId')) {
    individualForm.setValue('eventId', event.id);
    teamForm.setValue('eventId', event.id);
  }

  const onSubmitIndividual = async (data: any) => {
    try {
      setIsSubmitting(true);
      await apiClient.post('/registrations/individual', data);
      setIsSuccess(true);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitTeam = async (data: any) => {
    try {
      setIsSubmitting(true);
      await apiClient.post('/registrations/team', data);
      setIsSuccess(true);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-28 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-violet-600/30 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!event) return null;

  if (isSuccess) {
    return (
      <div className="min-h-screen pt-28 pb-20 flex items-center justify-center px-6">
        <div className="glass-card rounded-3xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Registration Complete!</h1>
          <p className="text-muted-foreground mb-8">
            You have successfully registered for {event.title}. A confirmation email with your QR code has been sent.
          </p>
          <div className="space-y-3">
            <Link to="/dashboard/registrations" className="block w-full py-3 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-500 transition-colors">
              View My Registrations
            </Link>
            <Link to={`/events/${event.slug}`} className="block w-full py-3 rounded-xl bg-white/5 text-white font-semibold hover:bg-white/10 transition-colors">
              Back to Event
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-20 px-6">
      <div className="max-w-3xl mx-auto">
        <Link to={`/events/${event.slug}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-white mb-8 transition-colors">
          <ArrowLeft size={16} />
          Back to Event Details
        </Link>

        <div className="glass-card rounded-3xl p-8 shadow-2xl shadow-black/50">
          <div className="mb-8 pb-8 border-b border-white/10">
            <h1 className="text-3xl font-bold text-white mb-2">Register for {event.title}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                {isTeam ? <Users size={16} className="text-amber-400" /> : <User size={16} className="text-violet-400" />}
                {isTeam ? 'Team Registration' : 'Individual Registration'}
              </span>
              <span>•</span>
              <span>{new Date(event.startDate).toLocaleDateString()}</span>
            </div>
          </div>

          {isTeam ? (
            <form onSubmit={teamForm.handleSubmit(onSubmitTeam)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white mb-1.5">Team Name</label>
                <input
                  {...teamForm.register('teamName')}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-border text-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 outline-none"
                  placeholder="Enter team name"
                />
                {teamForm.formState.errors.teamName && (
                  <p className="text-xs text-red-400 mt-1.5">{teamForm.formState.errors.teamName.message as string}</p>
                )}
              </div>

              <div className="bg-white/5 rounded-xl p-5 border border-white/5">
                <h3 className="text-sm font-medium text-white mb-4">Team Leader (You)</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-violet-600/20 flex items-center justify-center font-bold text-violet-400">
                    {getInitials(user?.firstName || '', user?.lastName || '')}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{getDisplayName(user)}</div>
                    <div className="text-xs text-muted-foreground">{user?.email}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-white">Team Members</h3>
                  <div className="text-xs text-muted-foreground">
                    Min: {event.minTeamSize || 1} • Max: {event.maxTeamSize || 'Unlimited'}
                  </div>
                </div>
                
                {teamForm.formState.errors.members?.root?.message && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl mb-4">
                    <p className="text-sm text-red-400 flex items-center gap-2">
                      <AlertTriangle size={16} />
                      {teamForm.formState.errors.members.root.message}
                    </p>
                  </div>
                )}

                {fields.map((field, index) => (
                  <div key={field.id} className="bg-white/5 rounded-xl p-5 border border-white/5 relative">
                    <h4 className="text-sm font-medium text-white mb-4">Member {index + 1}</h4>
                    {fields.length > 1 && (
                      <button type="button" onClick={() => remove(index)} className="absolute top-4 right-4 p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                        <X size={16} />
                      </button>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">Full Name</label>
                        <input {...teamForm.register(`members.${index}.name` as const)} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-violet-500 outline-none text-sm" placeholder="John Doe" />
                        {(teamForm.formState.errors.members as any)?.[index]?.name && <p className="text-xs text-red-400 mt-1">{(teamForm.formState.errors.members as any)[index]?.name?.message as string}</p>}
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">Email</label>
                        <input {...teamForm.register(`members.${index}.email` as const)} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-violet-500 outline-none text-sm" placeholder="john@example.com" />
                        {(teamForm.formState.errors.members as any)?.[index]?.email && <p className="text-xs text-red-400 mt-1">{(teamForm.formState.errors.members as any)[index]?.email?.message as string}</p>}
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">Phone</label>
                        <input {...teamForm.register(`members.${index}.phone` as const)} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-violet-500 outline-none text-sm" placeholder="9876543210" />
                        {(teamForm.formState.errors.members as any)?.[index]?.phone && <p className="text-xs text-red-400 mt-1">{(teamForm.formState.errors.members as any)[index]?.phone?.message as string}</p>}
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">PRN</label>
                        <input {...teamForm.register(`members.${index}.prn` as const)} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-violet-500 outline-none text-sm" placeholder="PRN Number" />
                        {(teamForm.formState.errors.members as any)?.[index]?.prn && <p className="text-xs text-red-400 mt-1">{(teamForm.formState.errors.members as any)[index]?.prn?.message as string}</p>}
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">Branch</label>
                        <input {...teamForm.register(`members.${index}.branch` as const)} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-violet-500 outline-none text-sm" placeholder="Branch Name" />
                        {(teamForm.formState.errors.members as any)?.[index]?.branch && <p className="text-xs text-red-400 mt-1">{(teamForm.formState.errors.members as any)[index]?.branch?.message as string}</p>}
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">Year</label>
                        <select {...teamForm.register(`members.${index}.year` as const)} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-violet-500 outline-none text-sm">
                          <option value="1" className="bg-zinc-900">1st Year</option>
                          <option value="2" className="bg-zinc-900">2nd Year</option>
                          <option value="3" className="bg-zinc-900">3rd Year</option>
                          <option value="4" className="bg-zinc-900">4th Year</option>
                          <option value="5" className="bg-zinc-900">5th Year</option>
                        </select>
                        {(teamForm.formState.errors.members as any)?.[index]?.year && <p className="text-xs text-red-400 mt-1">{(teamForm.formState.errors.members as any)[index]?.year?.message as string}</p>}
                      </div>
                    </div>
                  </div>
                ))}

                {(!event.maxTeamSize || fields.length + 1 < event.maxTeamSize) && (
                  <button
                    type="button"
                    onClick={() => append({ name: '', email: '', phone: '', prn: '', branch: '', year: 1 } as never)}
                    className="text-sm text-violet-400 hover:text-violet-300 font-medium transition-colors"
                  >
                    + Add Team Member
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white font-bold text-lg shadow-xl shadow-violet-600/20 hover:shadow-violet-500/30 transition-all disabled:opacity-70 mt-8 btn-glow"
              >
                {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : 'Confirm Team Registration'}
              </button>
            </form>
          ) : (
            <form onSubmit={individualForm.handleSubmit(onSubmitIndividual)} className="space-y-6">
              <div className="bg-white/5 rounded-xl p-5 border border-white/5 mb-8">
                <h3 className="text-sm font-medium text-white mb-4">Participant Details</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-violet-600/20 flex items-center justify-center font-bold text-violet-400">
                    {getInitials(user?.firstName || '', user?.lastName || '')}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{getDisplayName(user)}</div>
                    <div className="text-xs text-muted-foreground">{user?.email}</div>
                  </div>
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                <p className="text-sm text-amber-200">
                  By registering, you agree to the event rules and guidelines. Make sure you have your PRN and College ID card handy during the event.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white font-bold text-lg shadow-xl shadow-violet-600/20 hover:shadow-violet-500/30 transition-all disabled:opacity-70 mt-8 btn-glow"
              >
                {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : 'Confirm Registration'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
