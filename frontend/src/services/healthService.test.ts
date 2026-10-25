import axios, { type AxiosResponse } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getHealthStatus } from './healthService';

describe('getHealthStatus', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns health response data', async () => {
    const data = { status: 200 };
    vi.spyOn(axios, 'get').mockResolvedValue({
      data,
    } as AxiosResponse<typeof data>);

    await expect(getHealthStatus()).resolves.toEqual(data);
    expect(axios.get).toHaveBeenCalledWith('api/health', { timeout: 5000 });
  });
});
