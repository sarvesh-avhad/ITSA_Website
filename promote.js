const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log('All users:');
  users.forEach(u => console.log(`- ${u.email} | ${u.firstName} ${u.lastName} | Role: ${u.role}`));

  console.log('\nPromoting sarveshavhad4@gmail.com to ADMIN...');
  try {
    await prisma.user.update({
      where: { email: 'sarveshavhad4@gmail.com' },
      data: { role: 'ADMIN', permissions: [] }
    });
    console.log('Promoted successfully!');
  } catch (err) {
    console.log('User not found or error:', err.message);
  }
}

main().finally(() => prisma.$disconnect());
