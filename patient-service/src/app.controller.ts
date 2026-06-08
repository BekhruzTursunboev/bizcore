import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @MessagePattern('get_patients')
  handleGetPatients() {
    return this.appService.getPatients();
  }

  @MessagePattern('create_patient')
  handleCreatePatient(@Payload() data: any) {
    return this.appService.createPatient(data);
  }

  @MessagePattern('update_patient')
  handleUpdatePatient(@Payload() payload: { id: string; data: any }) {
    return this.appService.updatePatient(payload.id, payload.data);
  }

  @MessagePattern('delete_patient')
  handleDeletePatient(@Payload() id: string) {
    return this.appService.deletePatient(id);
  }
}
