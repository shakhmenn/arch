const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('Checking users in database...');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        phone: true,
        name: true,
        surname: true,
        password: true
      }
    });
    
    console.log(`Found ${users.length} users:`);
    
    for (const user of users) {
      console.log(`- ${user.name} ${user.surname} (${user.phone})`);
      
      // Check if password 'test123' matches
      const isMatch = await bcrypt.compare('test123', user.password);
      console.log(`  Password 'test123' matches: ${isMatch}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();