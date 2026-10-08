import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { SuccessResponseInterceptor } from './common/interceptors/success-response.interceptor.js';
import { LoggerModule } from './logging/logger.module.js';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), LoggerModule, AuthModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: SuccessResponseInterceptor,
    },
  ],
})
export class AppModule {}
