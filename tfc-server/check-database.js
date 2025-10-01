const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 Checking database tables...');
    
    // Check Users
    const usersCount = await prisma.user.count();
    console.log(`👥 Users: ${usersCount}`);
    
    // Check Metric Definitions
    const metricDefinitionsCount = await prisma.metricDefinition.count();
    console.log(`📊 Metric Definitions: ${metricDefinitionsCount}`);
    
    // Check Metric Values
    const metricValuesCount = await prisma.metricValue.count();
    console.log(`📈 Metric Values: ${metricValuesCount}`);
    
    // Check Teams
    const teamsCount = await prisma.team.count();
    console.log(`👨‍👩‍👧‍👦 Teams: ${teamsCount}`);
    
    // Check Tags
    const tagsCount = await prisma.tag.count();
    console.log(`🏷️ Tags: ${tagsCount}`);
    
    // Check Tasks
    const tasksCount = await prisma.task.count();
    console.log(`✅ Tasks: ${tasksCount}`);
    
    // Check Business Context
    const businessContextCount = await prisma.businessContext.count();
    console.log(`🏢 Business Contexts: ${businessContextCount}`);
    
    // Check User Teams
    const userTeamsCount = await prisma.userTeam.count();
    console.log(`🤝 User-Team Relations: ${userTeamsCount}`);
    
    console.log('\n✅ Database check completed successfully!');
    
    // Show some sample data
    console.log('\n📋 Sample Metric Definitions:');
    const sampleMetrics = await prisma.metricDefinition.findMany({
      take: 5,
      select: {
        name: true,
        category: true,
        unit: true
      }
    });
    
    sampleMetrics.forEach(metric => {
      console.log(`  - ${metric.name} (${metric.category}, ${metric.unit})`);
    });
    
    console.log('\n👥 Sample Users:');
    const sampleUsers = await prisma.user.findMany({
      take: 3,
      select: {
        name: true,
        surname: true,
        phone: true
      }
    });
    
    sampleUsers.forEach(user => {
      console.log(`  - ${user.name} ${user.surname} (${user.phone})`);
    });
    
  } catch (error) {
    console.error('❌ Error checking database:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();