import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @MessagePattern('get_appointments')
  handleGetAppointments() {
    return this.appService.getAppointments();
  }

  @MessagePattern('create_appointment')
  handleCreateAppointment(@Payload() data: any) {
    return this.appService.createAppointment(data);
  }

  @MessagePattern('update_appointment')
  handleUpdateAppointment(@Payload() payload: { id: string; data: any }) {
    return this.appService.updateAppointment(payload.id, payload.data);
  }

  @MessagePattern('delete_appointment')
  handleDeleteAppointment(@Payload() id: string) {
    return this.appService.deleteAppointment(id);
  }
}
