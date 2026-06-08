import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('patients')
export class Patient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  status: string; // Masalan: "Kuzatuvda", "Qabul qilingan", "Javob berilgan"

  @Column()
  doctorName: string;

  @Column({ nullable: true })
  appointmentTime: string;

  @CreateDateColumn()
  createdAt: Date;
}
