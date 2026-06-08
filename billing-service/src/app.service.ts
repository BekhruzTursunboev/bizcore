import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Billing } from './billing.entity';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(Billing)
    private billingRepo: Repository<Billing>,
  ) {}

  async getBills(): Promise<{ data: Billing[]; status: string }> {
    const records = await this.billingRepo.find({ order: { createdAt: 'DESC' } });
    return { data: records, status: 'success' };
  }

  async createBill(data: Partial<Billing>): Promise<{ data: Billing; status: string }> {
    const newBill = this.billingRepo.create(data);
    const saved = await this.billingRepo.save(newBill);
    return { data: saved, status: 'created' };
  }

  async updateBill(id: string, data: Partial<Billing>): Promise<{ status: string }> {
    await this.billingRepo.update(id, data);
    return { status: 'updated' };
  }

  async deleteBill(id: string): Promise<{ status: string }> {
    await this.billingRepo.delete(id);
    return { status: 'deleted' };
  }
}
