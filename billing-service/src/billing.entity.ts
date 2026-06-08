import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('billing')
export class Billing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  patientName: string;

  @Column()
  serviceName: string;

  @Column('numeric')
  amount: number;

  @Column()
  date: string;

  @Column()
  status: string; // Masalan: "To'langan", "Qarz"

  @CreateDateColumn()
  createdAt: Date;
}
