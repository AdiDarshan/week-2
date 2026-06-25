import { Injectable } from '@nestjs/common';
import { z } from 'zod';

export type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; errorMessage: string };

@Injectable()
export class OutputParserService {
  parseToolArguments<T>(
    rawArguments: string,
    schema: z.ZodType<T>,
  ): ParseResult<T> {
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawArguments.trim() || '{}');
    } catch {
      return { success: false, errorMessage: 'Arguments were not valid JSON.' };
    }

    const result = schema.safeParse(parsed);
    if (!result.success) {
      return { success: false, errorMessage: formatIssues(result.error) };
    }
    return { success: true, data: result.data };
  }
}

function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('; ');
}
