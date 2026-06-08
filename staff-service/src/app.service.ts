import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Staff } from './staff.entity';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(Staff)
    private staffRepo: Repository<Staff>,
  ) {}

  async getStaff(): Promise<{ data: Staff[]; status: string }> {
    const records = await this.staffRepo.find({ order: { createdAt: 'DESC' } });
    return { data: records, status: 'success' };
  }

  async createStaff(data: Partial<Staff>): Promise<{ data: Staff; status: string }> {
    const newStaff = this.staffRepo.create(data);
    const saved = await this.staffRepo.save(newStaff);
    return { data: saved, status: 'created' };
  }

  async updateStaff(id: string, data: Partial<Staff>): Promise<{ status: string }> {
    await this.staffRepo.update(id, data);
    return { status: 'updated' };
  }

  async deleteStaff(id: string): Promise<{ status: string }> {
    await this.staffRepo.delete(id);
    return { status: 'deleted' };
  }
}
