import { describe, it, expect } from '@jest/globals';
import { setUpLighthouseQueryString } from './services/pagespeed.js';
import { PSICategories, PSIStrategy } from '../../types/index.js';

describe('unit tests for pagespeed services', () => {
  describe('testing setUpLighthouseQueryString', () => {
    it('should return a valid query string for lighthouse score', () => {
      const params = {
        url: 'https://www.google.com',
        category: [PSICategories.PERFORMANCE],
        strategy: PSIStrategy.MOBILE,
      };
      const key = process.env.PSI_API_KEY;
      const response = setUpLighthouseQueryString(params.url, params.category, params.strategy);
      const expected = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${params.url}&key=${key}&category=${params.category[0]}&strategy=${params.strategy}&`;
      expect(response).toEqual(expected);
    });
  });
});
