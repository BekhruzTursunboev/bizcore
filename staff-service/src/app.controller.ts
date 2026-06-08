import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @MessagePattern('get_staff')
  handleGetStaff() {
    return this.appService.getStaff();
  }

  @MessagePattern('create_staff')
  handleCreateStaff(@Payload() data: any) {
    return this.appService.createStaff(data);
  }

  @MessagePattern('update_staff')
  handleUpdateStaff(@Payload() payload: { id: string; data: any }) {
    return this.appService.updateStaff(payload.id, payload.data);
  }

  @MessagePattern('delete_staff')
  handleDeleteStaff(@Payload() id: string) {
    return this.appService.deleteStaff(id);
  }
}
