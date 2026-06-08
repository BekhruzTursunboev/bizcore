import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  patientName: string;

  @Column()
  doctorName: string;

  @Column()
  date: string;

  @Column()
  time: string;

  @Column()
  reason: string;

  @Column()
  status: string; // Masalan: "Tasdiqlangan", "Kutilmoqda", "Bekor qilingan"

  @CreateDateColumn()
  createdAt: Date;
}
