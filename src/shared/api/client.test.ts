import { AxiosError } from 'axios';
import { describe, expect, it } from 'vitest';
import { getApiErrorMessage } from './client';

describe('getApiErrorMessage', () => {
  it('explains backend cold starts', () => {
    const error = new AxiosError(
      'Service Unavailable',
      'ERR_BAD_RESPONSE',
      undefined,
      undefined,
      {
        data: {},
        status: 503,
        statusText: 'Service Unavailable',
        headers: {},
        config: { headers: {} as never },
      },
    );

    expect(getApiErrorMessage(error, 'fallback')).toBe(
      'The backend is starting. Please wait a moment and try again.',
    );
  });
});
