import { PrismaClient, UserRole, EventStatus, EventType, SponsorTier, AnnouncementCategory } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ============================================================
  // 1. Create Super Admin
  // ============================================================
  const adminPassword = await bcrypt.hash('Admin@123456', 12);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@itsa.edu' },
    update: {},
    create: {
      email: 'admin@itsa.edu',
      passwordHash: adminPassword,
      firstName: 'ITSA',
      lastName: 'Admin',
      role: UserRole.SUPER_ADMIN,
      isEmailVerified: true,
      isActive: true,
    },
  });
  console.log('✅ Super Admin created:', superAdmin.email);

  // ============================================================
  // 2. Create Sample Users
  // ============================================================
  const studentPassword = await bcrypt.hash('Student@123', 12);
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'coordinator@itsa.edu' },
      update: {},
      create: {
        email: 'coordinator@itsa.edu',
        passwordHash: studentPassword,
        firstName: 'Priya',
        lastName: 'Sharma',
        role: UserRole.COORDINATOR,
        prn: '2023IT001',
        branch: 'Information Technology',
        year: 3,
        isEmailVerified: true,
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'student1@itsa.edu' },
      update: {},
      create: {
        email: 'student1@itsa.edu',
        passwordHash: studentPassword,
        firstName: 'Arjun',
        lastName: 'Patel',
        role: UserRole.STUDENT,
        prn: '2023IT002',
        branch: 'Information Technology',
        year: 2,
        isEmailVerified: true,
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'student2@itsa.edu' },
      update: {},
      create: {
        email: 'student2@itsa.edu',
        passwordHash: studentPassword,
        firstName: 'Sneha',
        lastName: 'Deshmukh',
        role: UserRole.STUDENT,
        prn: '2023CE003',
        branch: 'Computer Engineering',
        year: 2,
        isEmailVerified: true,
        isActive: true,
      },
    }),
  ]);
  console.log(`✅ ${users.length + 1} users created`);

  // ============================================================
  // 3. Event Categories
  // ============================================================
  const categories = await Promise.all([
    prisma.eventCategory.upsert({
      where: { slug: 'coding' },
      update: {},
      create: { name: 'Coding', slug: 'coding', description: 'Programming and coding competitions', color: '#7c3aed', icon: 'code' },
    }),
    prisma.eventCategory.upsert({
      where: { slug: 'workshop' },
      update: {},
      create: { name: 'Workshop', slug: 'workshop', description: 'Technical workshops and hands-on sessions', color: '#06b6d4', icon: 'wrench' },
    }),
    prisma.eventCategory.upsert({
      where: { slug: 'hackathon' },
      update: {},
      create: { name: 'Hackathon', slug: 'hackathon', description: '24-hour coding marathon', color: '#f59e0b', icon: 'zap' },
    }),
    prisma.eventCategory.upsert({
      where: { slug: 'seminar' },
      update: {},
      create: { name: 'Seminar', slug: 'seminar', description: 'Guest talks and technical seminars', color: '#10b981', icon: 'mic' },
    }),
    prisma.eventCategory.upsert({
      where: { slug: 'cultural' },
      update: {},
      create: { name: 'Cultural', slug: 'cultural', description: 'Cultural and fun events', color: '#ec4899', icon: 'music' },
    }),
  ]);
  console.log(`✅ ${categories.length} categories created`);

  // ============================================================
  // 4. Events
  // ============================================================
  const events = await Promise.all([
    prisma.event.upsert({
      where: { slug: 'code-o-fiesta-2026' },
      update: {},
      create: {
        title: 'Code-O-Fiesta 2026',
        slug: 'code-o-fiesta-2026',
        description: `<h2>The Ultimate Coding Championship</h2>
<p>Code-O-Fiesta is ITSA's flagship annual coding competition that brings together the brightest minds from across engineering colleges. Compete in multiple rounds of algorithmic challenges, debug-a-thons, and speed coding.</p>
<h3>What to Expect</h3>
<ul>
  <li>3 intense rounds of competitive programming</li>
  <li>Industry-standard problem sets</li>
  <li>Prizes worth ₹50,000+</li>
  <li>Networking with industry professionals</li>
  <li>Certificate for all participants</li>
</ul>`,
        shortDescription: 'ITSA\'s flagship annual coding competition — compete in algorithmic challenges and win prizes worth ₹50,000+',
        rules: `1. Individual participation only\n2. Languages allowed: C, C++, Java, Python\n3. No use of AI tools during the contest\n4. Internet access restricted to contest platform\n5. Time limit: 3 hours for each round`,
        faqs: [
          { question: 'Who can participate?', answer: 'Any engineering student with a valid college ID can participate.' },
          { question: 'Is there a registration fee?', answer: 'No, participation is completely free.' },
          { question: 'What languages are supported?', answer: 'C, C++, Java, and Python are supported on the contest platform.' },
        ],
        schedule: [
          { time: '09:00 AM', title: 'Registration & Check-in', description: 'Collect your participant badge' },
          { time: '10:00 AM', title: 'Opening Ceremony', description: 'Welcome address and rules briefing' },
          { time: '10:30 AM', title: 'Round 1: MCQ Elimination', description: '30-minute aptitude round' },
          { time: '11:30 AM', title: 'Round 2: Coding Sprint', description: '90-minute problem solving' },
          { time: '02:00 PM', title: 'Round 3: Championship', description: 'Final round for top 20' },
          { time: '04:00 PM', title: 'Prize Distribution', description: 'Awards and closing ceremony' },
        ],
        venue: 'Seminar Hall, IT Department',
        startDate: new Date('2026-08-15T09:00:00'),
        endDate: new Date('2026-08-15T17:00:00'),
        registrationDeadline: new Date('2026-08-10T23:59:59'),
        maxParticipants: 200,
        currentCount: 45,
        eventType: EventType.INDIVIDUAL,
        status: EventStatus.UPCOMING,
        isFeatured: true,
        isPublished: true,
        categoryId: categories[0].id,
        createdBy: superAdmin.id,
      },
    }),
    prisma.event.upsert({
      where: { slug: 'stackstride-2026' },
      update: {},
      create: {
        title: 'StackStride 2026',
        slug: 'stackstride-2026',
        description: `<h2>24-Hour Hackathon</h2>
<p>StackStride is a 24-hour hackathon where teams of 2-4 build innovative solutions to real-world problems. This year's theme focuses on AI & Sustainability.</p>`,
        shortDescription: '24-hour hackathon — build innovative solutions to real-world problems. Theme: AI & Sustainability.',
        venue: 'Innovation Lab, Main Building',
        startDate: new Date('2026-09-20T10:00:00'),
        endDate: new Date('2026-09-21T10:00:00'),
        registrationDeadline: new Date('2026-09-15T23:59:59'),
        maxParticipants: 50,
        currentCount: 12,
        eventType: EventType.TEAM,
        status: EventStatus.UPCOMING,
        isFeatured: true,
        isPublished: true,
        maxTeamSize: 4,
        minTeamSize: 2,
        categoryId: categories[2].id,
        createdBy: superAdmin.id,
      },
    }),
    prisma.event.upsert({
      where: { slug: 'alumni-nexus-2026' },
      update: {},
      create: {
        title: 'Alumni Nexus 2026',
        slug: 'alumni-nexus-2026',
        description: '<h2>Connect with ITSA Alumni</h2><p>A networking event bridging current students with successful alumni working at top tech companies. Hear their journeys, get career guidance, and build lasting connections.</p>',
        shortDescription: 'Networking event bridging current students with successful alumni at top tech companies.',
        venue: 'Auditorium, Main Campus',
        startDate: new Date('2026-07-10T14:00:00'),
        endDate: new Date('2026-07-10T18:00:00'),
        maxParticipants: 300,
        currentCount: 156,
        eventType: EventType.INDIVIDUAL,
        status: EventStatus.UPCOMING,
        isPublished: true,
        categoryId: categories[3].id,
        createdBy: superAdmin.id,
      },
    }),
    prisma.event.upsert({
      where: { slug: 'web-dev-bootcamp-2025' },
      update: {},
      create: {
        title: 'Web Dev Bootcamp 2025',
        slug: 'web-dev-bootcamp-2025',
        description: '<h2>Full-Stack Development Workshop</h2><p>An intensive 3-day workshop covering React, Node.js, and PostgreSQL. Build a production-ready app from scratch.</p>',
        shortDescription: '3-day intensive workshop on full-stack development with React, Node.js, and PostgreSQL.',
        venue: 'Computer Lab 301',
        startDate: new Date('2025-11-15T09:00:00'),
        endDate: new Date('2025-11-17T17:00:00'),
        maxParticipants: 60,
        currentCount: 60,
        eventType: EventType.INDIVIDUAL,
        status: EventStatus.COMPLETED,
        isPublished: true,
        categoryId: categories[1].id,
        createdBy: superAdmin.id,
      },
    }),
  ]);
  console.log(`✅ ${events.length} events created`);

  // ============================================================
  // 5. Sponsors
  // ============================================================
  const sponsors = await Promise.all([
    prisma.sponsor.upsert({
      where: { slug: 'techcorp-india' },
      update: {},
      create: {
        name: 'TechCorp India',
        slug: 'techcorp-india',
        logoUrl: 'https://placehold.co/400x200/7c3aed/ffffff?text=TechCorp',
        description: 'Leading technology solutions provider partnering with ITSA for student development.',
        websiteUrl: 'https://example.com/techcorp',
        tier: SponsorTier.GOLD,
        isActive: true,
        sortOrder: 1,
      },
    }),
    prisma.sponsor.upsert({
      where: { slug: 'innovate-labs' },
      update: {},
      create: {
        name: 'Innovate Labs',
        slug: 'innovate-labs',
        logoUrl: 'https://placehold.co/400x200/06b6d4/ffffff?text=InnovateLabs',
        description: 'AI and ML startup supporting the next generation of tech talent.',
        websiteUrl: 'https://example.com/innovatelabs',
        tier: SponsorTier.SILVER,
        isActive: true,
        sortOrder: 2,
      },
    }),
    prisma.sponsor.upsert({
      where: { slug: 'cloud-nexus' },
      update: {},
      create: {
        name: 'Cloud Nexus',
        slug: 'cloud-nexus',
        logoUrl: 'https://placehold.co/400x200/10b981/ffffff?text=CloudNexus',
        description: 'Cloud infrastructure provider offering student credits and workshops.',
        websiteUrl: 'https://example.com/cloudnexus',
        tier: SponsorTier.BRONZE,
        isActive: true,
        sortOrder: 3,
      },
    }),
  ]);
  console.log(`✅ ${sponsors.length} sponsors created`);

  // ============================================================
  // 6. Announcements
  // ============================================================
  await Promise.all([
    prisma.announcement.upsert({
      where: { slug: 'code-o-fiesta-2026-registrations-open' },
      update: {},
      create: {
        title: 'Code-O-Fiesta 2026 Registrations Open!',
        slug: 'code-o-fiesta-2026-registrations-open',
        content: '<p>We are thrilled to announce that registrations for Code-O-Fiesta 2026 are now open. Register before August 10th to secure your spot!</p>',
        excerpt: 'Registrations for Code-O-Fiesta 2026 are now open. Compete in algorithmic challenges and win prizes worth ₹50,000+.',
        category: AnnouncementCategory.NOTICE,
        isPinned: true,
        isPublished: true,
        publishedAt: new Date(),
        authorId: superAdmin.id,
      },
    }),
    prisma.announcement.upsert({
      where: { slug: 'new-committee-2026-27' },
      update: {},
      create: {
        title: 'ITSA Committee 2026-27 Announced',
        slug: 'new-committee-2026-27',
        content: '<p>We are pleased to announce the new ITSA committee for the academic year 2026-27. Congratulations to all selected members!</p>',
        excerpt: 'The new ITSA committee for 2026-27 has been announced. Congratulations to all selected members!',
        category: AnnouncementCategory.CLUB_UPDATE,
        isPublished: true,
        publishedAt: new Date(),
        authorId: superAdmin.id,
      },
    }),
  ]);
  console.log('✅ Announcements created');

  // ============================================================
  // 7. Site Config (CMS)
  // ============================================================
  const configs = [
    { key: 'hero_title', value: JSON.stringify('Information Technology Students Association'), section: 'homepage' },
    { key: 'hero_subtitle', value: JSON.stringify('Innovate. Collaborate. Excel.'), section: 'homepage' },
    { key: 'hero_video_url', value: JSON.stringify(''), section: 'homepage' },
    { key: 'about_content', value: JSON.stringify('ITSA is the official student association of the Information Technology Department, dedicated to fostering technical excellence, innovation, and collaboration among students.'), section: 'homepage' },
    { key: 'vision', value: JSON.stringify('To be the premier platform for IT students to innovate, learn, and grow into industry-ready professionals.'), section: 'about' },
    { key: 'mission', value: JSON.stringify('To organize impactful technical events, provide hands-on learning opportunities, and build a vibrant community of tech enthusiasts.'), section: 'about' },
    { key: 'stats_members', value: JSON.stringify(500), section: 'homepage' },
    { key: 'stats_events', value: JSON.stringify(50), section: 'homepage' },
    { key: 'stats_years', value: JSON.stringify(8), section: 'homepage' },
    { key: 'stats_alumni', value: JSON.stringify(2000), section: 'homepage' },
  ];

  for (const config of configs) {
    await prisma.siteConfig.upsert({
      where: { key: config.key },
      update: { value: config.value },
      create: {
        key: config.key,
        value: config.value,
        section: config.section,
      },
    });
  }
  console.log('✅ Site config seeded');

  // ============================================================
  // 8. Gallery Albums
  // ============================================================
  await Promise.all([
    prisma.galleryAlbum.upsert({
      where: { slug: 'code-o-fiesta-2025' },
      update: {},
      create: {
        title: 'Code-O-Fiesta 2025',
        slug: 'code-o-fiesta-2025',
        description: 'Highlights from the coding championship held in August 2025.',
        year: 2025,
        isPublished: true,
        sortOrder: 1,
      },
    }),
    prisma.galleryAlbum.upsert({
      where: { slug: 'teachers-day-2025' },
      update: {},
      create: {
        title: 'Teachers Day Celebration 2025',
        slug: 'teachers-day-2025',
        description: 'ITSA\'s Teachers Day celebration with faculty members.',
        year: 2025,
        isPublished: true,
        sortOrder: 2,
      },
    }),
  ]);
  console.log('✅ Gallery albums created');

  console.log('\n🎉 Database seeded successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Login credentials:');
  console.log('  Super Admin: admin@itsa.edu / Admin@123456');
  console.log('  Coordinator: coordinator@itsa.edu / Student@123');
  console.log('  Student: student1@itsa.edu / Student@123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
