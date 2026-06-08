import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from './patient.entity';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>,
  ) {}

  async getPatients(): Promise<{ data: Patient[]; status: string }> {
    const patients = await this.patientRepository.find({ order: { createdAt: 'DESC' } });
    return { data: patients, status: 'success' };
  }

  async createPatient(data: Partial<Patient>): Promise<{ data: Patient; status: string }> {
    const newPatient = this.patientRepository.create(data);
    const saved = await this.patientRepository.save(newPatient);
    return { data: saved, status: 'created' };
  }

  async updatePatient(id: string, data: Partial<Patient>): Promise<{ status: string }> {
    await this.patientRepository.update(id, data);
    return { status: 'updated' };
  }

  async deletePatient(id: string): Promise<{ status: string }> {
    await this.patientRepository.delete(id);
    return { status: 'deleted' };
  }
}
