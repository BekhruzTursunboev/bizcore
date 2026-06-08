import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @MessagePattern('get_bills')
  handleGetBills() {
    return this.appService.getBills();
  }

  @MessagePattern('create_bill')
  handleCreateBill(@Payload() data: any) {
    return this.appService.createBill(data);
  }

  @MessagePattern('update_bill')
  handleUpdateBill(@Payload() payload: { id: string; data: any }) {
    return this.appService.updateBill(payload.id, payload.data);
  }

  @MessagePattern('delete_bill')
  handleDeleteBill(@Payload() id: string) {
    return this.appService.deleteBill(id);
  }
}
