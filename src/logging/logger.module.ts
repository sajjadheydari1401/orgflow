import { Global, Logger, Module } from '@nestjs/common';

@Global()
@Module({
  providers: [{ provide: Logger, useFactory: () => new Logger() }],
  exports: [Logger],
})
export class LoggerModule {}
