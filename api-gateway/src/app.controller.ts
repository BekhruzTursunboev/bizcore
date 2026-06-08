import { Controller, Get, Post, Put, Delete, Body, Param, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@Controller('api')
export class AppController {
  constructor(
    @Inject('PATIENT_SERVICE') private patientClient: ClientProxy,
    @Inject('APPOINTMENT_SERVICE') private appointmentClient: ClientProxy,
    @Inject('STAFF_SERVICE') private staffClient: ClientProxy,
    @Inject('BILLING_SERVICE') private billingClient: ClientProxy,
  ) {}

  // ================= PATIENTS =================
  @ApiTags('Patients')
  @ApiOperation({ summary: 'Get all patients' })
  @Get('patients')
  getPatients() { return this.patientClient.send('get_patients', {}); }

  @ApiTags('Patients')
  @ApiOperation({ summary: 'Create patient' })
  @Post('patients')
  createPatient(@Body() data: any) { return this.patientClient.send('create_patient', data); }

  @ApiTags('Patients')
  @ApiOperation({ summary: 'Update patient' })
  @Put('patients/:id')
  updatePatient(@Param('id') id: string, @Body() data: any) { return this.patientClient.send('update_patient', { id, data }); }

  @ApiTags('Patients')
  @ApiOperation({ summary: 'Delete patient' })
  @Delete('patients/:id')
  deletePatient(@Param('id') id: string) { return this.patientClient.send('delete_patient', id); }

  // ================= APPOINTMENTS =================
  @ApiTags('Appointments')
  @ApiOperation({ summary: 'Get all appointments' })
  @Get('appointments')
  getAppointments() { return this.appointmentClient.send('get_appointments', {}); }

  @ApiTags('Appointments')
  @ApiOperation({ summary: 'Create appointment' })
  @Post('appointments')
  createAppointment(@Body() data: any) { return this.appointmentClient.send('create_appointment', data); }

  @ApiTags('Appointments')
  @ApiOperation({ summary: 'Update appointment' })
  @Put('appointments/:id')
  updateAppointment(@Param('id') id: string, @Body() data: any) { return this.appointmentClient.send('update_appointment', { id, data }); }

  @ApiTags('Appointments')
  @ApiOperation({ summary: 'Delete appointment' })
  @Delete('appointments/:id')
  deleteAppointment(@Param('id') id: string) { return this.appointmentClient.send('delete_appointment', id); }

  // ================= STAFF =================
  @ApiTags('Staff')
  @ApiOperation({ summary: 'Get all staff' })
  @Get('staff')
  getStaff() { return this.staffClient.send('get_staff', {}); }

  @ApiTags('Staff')
  @ApiOperation({ summary: 'Create staff' })
  @Post('staff')
  createStaff(@Body() data: any) { return this.staffClient.send('create_staff', data); }

  @ApiTags('Staff')
  @ApiOperation({ summary: 'Update staff' })
  @Put('staff/:id')
  updateStaff(@Param('id') id: string, @Body() data: any) { return this.staffClient.send('update_staff', { id, data }); }

  @ApiTags('Staff')
  @ApiOperation({ summary: 'Delete staff' })
  @Delete('staff/:id')
  deleteStaff(@Param('id') id: string) { return this.staffClient.send('delete_staff', id); }

  // ================= BILLING =================
  @ApiTags('Billing')
  @ApiOperation({ summary: 'Get all bills' })
  @Get('billing')
  getBills() { return this.billingClient.send('get_bills', {}); }

  @ApiTags('Billing')
  @ApiOperation({ summary: 'Create bill' })
  @Post('billing')
  createBill(@Body() data: any) { return this.billingClient.send('create_bill', data); }

  @ApiTags('Billing')
  @ApiOperation({ summary: 'Update bill' })
  @Put('billing/:id')
  updateBill(@Param('id') id: string, @Body() data: any) { return this.billingClient.send('update_bill', { id, data }); }

  @ApiTags('Billing')
  @ApiOperation({ summary: 'Delete bill' })
  @Delete('billing/:id')
  deleteBill(@Param('id') id: string) { return this.billingClient.send('delete_bill', id); }
}
