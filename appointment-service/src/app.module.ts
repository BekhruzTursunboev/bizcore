import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Appointment } from './appointment.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL || 'postgresql://bekhruz:uGJ5pdXVXWjjONc3OARKgw@wobbly-manta-16748.jxf.gcp-asia-southeast1.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full',
      autoLoadEntities: true,
      synchronize: true, // For university project only!
      ssl: {
        rejectUnauthorized: false,
      },
    }),
    TypeOrmModule.forFeature([Appointment]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
