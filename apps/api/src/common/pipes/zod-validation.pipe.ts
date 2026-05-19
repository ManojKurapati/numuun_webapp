import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { ZodSchema } from 'zod';
import { AppException } from '../errors/app-exception';

/**
 * Validates and parses a request payload against a Zod schema.
 * On failure it raises a 422 with field-level details — no input is trusted
 * past this boundary (master guide, section 8).
 */
@Injectable()
export class ZodValidationPipe<T> implements PipeTransform {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown, _metadata: ArgumentMetadata): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw AppException.unprocessable(
        'VALIDATION_ERROR',
        'Request validation failed.',
        result.error.flatten(),
      );
    }
    return result.data;
  }
}
