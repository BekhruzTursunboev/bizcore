import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from './appointment.entity';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
  ) {}

  async getAppointments(): Promise<{ data: Appointment[]; status: string }> {
    const apps = await this.appointmentRepository.find({ order: { createdAt: 'DESC' } });
    return { data: apps, status: 'success' };
  }

  async createAppointment(data: Partial<Appointment>): Promise<{ data: Appointment; status: string }> {
    const newApp = this.appointmentRepository.create(data);
    const saved = await this.appointmentRepository.save(newApp);
    return { data: saved, status: 'created' };
  }

  async updateAppointment(id: string, data: Partial<Appointment>): Promise<{ status: string }> {
    await this.appointmentRepository.update(id, data);
    return { status: 'updated' };
  }

  async deleteAppointment(id: string): Promise<{ status: string }> {
    await this.appointmentRepository.delete(id);
    return { status: 'deleted' };
  }
}
