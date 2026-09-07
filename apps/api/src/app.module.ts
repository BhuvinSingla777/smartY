import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma/prisma.module';
import { BdgModule } from './modules/bdg/bdg.module';
import { PodsModule } from './modules/pods/pods.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    PrismaModule,
    BdgModule,
    PodsModule,
    DashboardModule,
  ],
})
export class AppModule {}
