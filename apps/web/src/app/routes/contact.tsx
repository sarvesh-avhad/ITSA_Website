import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, CheckCircle2, Loader2, MessageSquare, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const contactSchema = z.object({
  name: z.string().min(2, 'Name is too short'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(5, 'Subject is too short'),
  message: z.string().min(10, 'Message is too short'),
});

type ContactForm = z.infer<typeof contactSchema>;

import { SEO } from '@/components/seo';

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactForm) => {
    try {
      setIsSubmitting(true);
      await apiClient.post('/contact', data);
      setIsSuccess(true);
      reset();
      setTimeout(() => setIsSuccess(false), 5000);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to send message');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-28 pb-20 overflow-hidden">
      <SEO title="Contact Us" description="Get in touch with the Information Technology Students Association (ITSA) team." />
      {/* Background */}
      <div className="fixed inset-0 z-0 bg-grid opacity-20 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16 mt-8 relative">
          <button 
            onClick={() => navigate(-1)}
            className="absolute left-0 top-0 p-2 rounded-full hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6">
              Get in <span className="gradient-text">Touch</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Have questions about an event? Interested in sponsoring us? 
              Drop us a message and we'll get back to you as soon as possible.
            </p>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start max-w-5xl mx-auto">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-8"
          >
            <div className="glass-card rounded-3xl p-8 space-y-8 border-violet-500/20">
              <h2 className="text-2xl font-bold text-white">Contact Information</h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-violet-600/10 flex items-center justify-center shrink-0">
                    <Mail size={24} className="text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-1">Email</h3>
                    <a href="mailto:itsa@college.edu" className="text-muted-foreground hover:text-violet-400 transition-colors">itsa@college.edu</a>
                    <p className="text-xs text-muted-foreground mt-1">Our team typically responds within 24 hours.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0">
                    <Phone size={24} className="text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-1">Phone</h3>
                    <a href="tel:+919876543210" className="text-muted-foreground hover:text-cyan-400 transition-colors">+91 98765 43210</a>
                    <p className="text-xs text-muted-foreground mt-1">Mon-Fri from 9am to 5pm.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                    <MapPin size={24} className="text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-1">Location</h3>
                    <p className="text-muted-foreground">Information Technology Department<br />Engineering College Campus<br />Maharashtra, India</p>
                  </div>
                </div>
              </div>

              {/* Socials */}
              <div className="pt-8 border-t border-white/10">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Follow Us</h3>
                <div className="flex gap-4">
                  {['Instagram', 'LinkedIn', 'Twitter', 'GitHub'].map((social) => (
                    <a key={social} href="#" className="w-10 h-10 rounded-full bg-white/5 hover:bg-violet-600 hover:text-white flex items-center justify-center transition-all text-muted-foreground">
                      <span className="text-xs font-bold">{social.charAt(0)}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="glass-card rounded-3xl p-8 lg:p-10 shadow-2xl shadow-black/50">
              <div className="flex items-center gap-3 mb-8">
                <MessageSquare className="text-violet-400" size={24} />
                <h2 className="text-2xl font-bold text-white">Send a Message</h2>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-white mb-1.5">Your Name</label>
                    <input
                      {...register('name')}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-border text-white placeholder:text-muted-foreground focus:border-violet-500 outline-none"
                      placeholder="John Doe"
                    />
                    {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-1.5">Email Address</label>
                    <input
                      {...register('email')}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-border text-white placeholder:text-muted-foreground focus:border-violet-500 outline-none"
                      placeholder="john@example.com"
                    />
                    {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-1.5">Subject</label>
                  <input
                    {...register('subject')}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-border text-white placeholder:text-muted-foreground focus:border-violet-500 outline-none"
                    placeholder="How can we help you?"
                  />
                  {errors.subject && <p className="text-xs text-red-400 mt-1">{errors.subject.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-1.5">Message</label>
                  <textarea
                    {...register('message')}
                    rows={5}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-border text-white placeholder:text-muted-foreground focus:border-violet-500 outline-none resize-none"
                    placeholder="Tell us more about your inquiry..."
                  />
                  {errors.message && <p className="text-xs text-red-400 mt-1">{errors.message.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white font-bold text-lg shadow-xl shadow-violet-600/20 hover:shadow-violet-500/30 transition-all disabled:opacity-70 mt-4 btn-glow"
                >
                  {isSubmitting ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : isSuccess ? (
                    <>
                      <CheckCircle2 size={20} />
                      Message Sent Successfully!
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
