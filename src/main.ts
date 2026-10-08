import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = app.get(Logger);
  const configService = app.get(ConfigService);
  const port = Number(configService.get('APP_PORT', '3001'));
  const appUrl = configService.get('APP_URL', `http://localhost:${port}/api`);
  app.setGlobalPrefix('api');
  app.useLogger(logger);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('OrgFlow API')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config), {
    swaggerOptions: { useGlobalPrefix: true, persistAuthorization: true },
  });

  await app.listen(port);
  logger.log(`Application is running at ${appUrl}`);
}
bootstrap();
