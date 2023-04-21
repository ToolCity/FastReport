import { describe, it, expect } from '@jest/globals';

describe('Check if testing env variables are defined properly', () => {
  it('Check for pagespeed api key', () => {
    expect(process.env.PSI_API_KEY).toBeDefined();
    expect(process.env.PSI_API_KEY).toEqual('1234');
  });
});
