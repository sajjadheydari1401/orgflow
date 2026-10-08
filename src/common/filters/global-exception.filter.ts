import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();

    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 500;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();

      const result = this.getErrorDetails(status, exception);

      code = result.code;
      message = result.message;
      status = result.code;
    }

    response.status(status).json({
      success: false,
      code,
      message,
    });
  }

  private getErrorDetails(
    status: number,
    exception: HttpException,
  ): {
    code: number;
    message: string;
  } {
    const customMessage = this.getCustomMessage(exception);

    switch (status) {
      case 400:
        return {
          code: 400,
          message: customMessage ?? 'Bad request',
        };

      case 401:
        return {
          code: 401,
          message: customMessage ?? 'Unauthorized',
        };

      case 403:
        return {
          code: 403,
          message: customMessage ?? 'Forbidden',
        };

      case 404:
        return {
          code: 404,
          message: customMessage ?? 'Resource not found',
        };

      case 409:
        return {
          code: 409,
          message: customMessage ?? 'Conflict',
        };

      case 422:
        return {
          code: 422,
          message: customMessage ?? 'Validation failed',
        };

      default:
        if (status >= 400 && status < 500) {
          return {
            code: status,
            message: customMessage ?? 'Request failed',
          };
        }

        return {
          code: 500,
          message: 'Internal server error',
        };
    }
  }

  private getCustomMessage(exception: HttpException): string | undefined {
    const error = exception.getResponse();

    if (typeof error === 'string') {
      return this.isDefaultMessage(exception, error) ? undefined : error;
    }

    if (typeof error === 'object' && error !== null && 'message' in error) {
      const message = (error as { message?: string | string[] }).message;

      if (Array.isArray(message)) {
        return message.join(', ');
      }

      return message && this.isDefaultMessage(exception, message)
        ? undefined
        : message;
    }

    return undefined;
  }

  // Nest fills in the status phrase (e.g. "Not Found") when no message is given.
  private isDefaultMessage(exception: HttpException, message: string) {
    const phrase = exception.name
      .replace(/Exception$/, '')
      .replace(/([a-z])([A-Z])/g, '$1 $2');

    return message === phrase;
  }
}
