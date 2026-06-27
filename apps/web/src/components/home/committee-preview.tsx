import { motion } from 'framer-motion';

const committee = [
  {
    name: 'Prof. Sonali Patil',
    role: 'Faculty Coordinator',
    image: '/assets/SonaliMadam.png',
    initials: 'SP',
    description: 'Guiding ITSA activities, mentoring students, and fostering technical excellence.',
    linkedinUrl: 'https://linkedin.com/in/sonali-patil-12b23a1a',
  }
];

export function CommitteePreview() {
  return (
    <section className="relative py-32 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.p
            className="text-[10px] uppercase tracking-[0.18em] text-violet-400/80 mb-2"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Our People
          </motion.p>
          <motion.h2
            className="text-4xl md:text-5xl font-black text-white mb-6 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Meet the <span className="gradient-text">Faculty Coordinator</span>
          </motion.h2>
          <motion.p
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            The dedicated mind working tirelessly behind the scenes to make every ITSA initiative a massive success.
          </motion.p>
        </div>

        {/* Cards */}
        <div className="flex justify-center gap-5 flex-wrap">
          {committee.map((member, i) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.6, ease: 'easeOut' }}
              className="profile-velorah-card"
              style={{
                width: '190px',
                borderRadius: '20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '0 0 20px',
                background: 'rgba(255,255,255,0.04)',
                boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.08)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Gradient border pseudo-element via inner div */}
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 'inherit',
                  padding: '1.2px',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.12) 20%, rgba(255,255,255,0) 42%, rgba(255,255,255,0) 58%, rgba(255,255,255,0.12) 80%, rgba(255,255,255,0.42) 100%)',
                  WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor',
                  maskComposite: 'exclude' as React.CSSProperties['maskComposite'],
                  pointerEvents: 'none',
                  zIndex: 2,
                }}
              />

              {/* Avatar */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '190px',
                  flexShrink: 0,
                  overflow: 'hidden',
                  borderRadius: '20px 20px 0 0',
                }}
                className="group"
              >
                {member.image ? (
                  <img
                    src={member.image}
                    alt={member.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'top center',
                      display: 'block',
                    }}
                    className="transition-transform duration-500 group-hover:scale-[1.05]"
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(160deg, rgba(99,102,241,0.25) 0%, rgba(167,139,250,0.1) 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'var(--font-display)',
                      fontSize: '52px',
                      color: 'rgba(255,255,255,0.55)',
                      fontWeight: 400,
                    }}
                  >
                    {member.initials}
                  </div>
                )}
                {/* Bottom fade */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '60px',
                    background: 'linear-gradient(to bottom, transparent, rgba(0,10,20,0.85))',
                    pointerEvents: 'none',
                  }}
                />
              </div>

              {/* Card Body */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '16px 16px 0',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              >
                {/* Name */}
                <p
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '15px',
                    color: 'white',
                    fontWeight: 400,
                    textAlign: 'center',
                    letterSpacing: '-0.2px',
                    lineHeight: 1.25,
                    margin: 0,
                  }}
                >
                  {member.name}
                </p>

                {/* Role */}
                <p
                  style={{
                    fontSize: '9px',
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: '#a78bfa',
                    textAlign: 'center',
                    margin: '-2px 0 0',
                  }}
                >
                  {member.role}
                </p>

                {/* Divider */}
                <hr
                  style={{
                    width: '44%',
                    height: '1px',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent)',
                    border: 'none',
                    margin: '2px 0',
                  }}
                />

                {/* Bio */}
                {member.description && (
                  <p
                    style={{
                      fontSize: '10.5px',
                      color: 'rgba(255,255,255,0.4)',
                      textAlign: 'center',
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    {member.description}
                  </p>
                )}

                {/* Social */}
                {member.linkedinUrl && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <a
                      href={member.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${member.name}'s LinkedIn`}
                      className="group/li"
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        position: 'relative',
                        overflow: 'hidden',
                        boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.08)',
                        transition: 'transform 0.2s ease',
                        textDecoration: 'none',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.transform = 'scale(1.12)';
                        const svg = e.currentTarget.querySelector('svg');
                        if (svg) svg.style.opacity = '1';
                        const paths = e.currentTarget.querySelectorAll('svg path, svg rect, svg circle');
                        paths.forEach((el) => (el as SVGElement).setAttribute('stroke', '#0A66C2'));
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                        const svg = e.currentTarget.querySelector('svg');
                        if (svg) svg.style.opacity = '0.6';
                        const paths = e.currentTarget.querySelectorAll('svg path, svg rect, svg circle');
                        paths.forEach((el) => (el as SVGElement).setAttribute('stroke', 'white'));
                      }}
                    >
                      {/* Gradient border */}
                      <div
                        aria-hidden="true"
                        style={{
                          position: 'absolute',
                          inset: 0,
                          borderRadius: 'inherit',
                          padding: '1px',
                          background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.3) 100%)',
                          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                          WebkitMaskComposite: 'xor',
                          maskComposite: 'exclude' as React.CSSProperties['maskComposite'],
                        }}
                      />
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ width: '13px', height: '13px', opacity: 0.6, transition: 'opacity 0.2s, stroke 0.2s' }}
                      >
                        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                        <rect x="2" y="9" width="4" height="12" />
                        <circle cx="4" cy="4" r="2" />
                      </svg>
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
