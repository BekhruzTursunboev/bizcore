import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors();

  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('HIS Microservices API Gateway')
    .setDescription('The API documentation for the Advanced Hospital Information System.')
    .setVersion('1.0')
    .addTag('Patients')
    .addTag('Appointments')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(3000);
  console.log('API Gateway is running on http://localhost:3000');
  console.log('Swagger Docs available at http://localhost:3000/api/docs');
}
bootstrap();
