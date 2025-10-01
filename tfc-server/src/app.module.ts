import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TeamsModule } from './teams/teams.module';
import { TasksModule } from './tasks/tasks.module';
import { CommentsModule } from './comments/comments.module';
import { UsersModule } from './users/users.module';
import { ProfilesModule } from './profiles/profiles.module';
import { MetricsModule } from './metrics/metrics.module';
import { TestController } from './test.controller';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    TeamsModule,
    TasksModule,
    CommentsModule,
    UsersModule,
    ProfilesModule,
    MetricsModule,
  ],
  controllers: [TestController],
  providers: [],
})
export class AppModule {}
