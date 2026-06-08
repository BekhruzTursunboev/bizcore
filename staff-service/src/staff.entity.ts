import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('staff')
export class Staff {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fullName: string;

  @Column()
  role: string;

  @Column()
  department: string;

  @Column()
  phone: string;

  @Column()
  status: string; // Masalan: "Faol", "Ta'tilda"

  @CreateDateColumn()
  createdAt: Date;
}
