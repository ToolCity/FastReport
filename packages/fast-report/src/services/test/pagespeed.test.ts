import { describe, it, expect } from '@jest/globals';
import { defaultStrategy, getScore, setUpLighthouseQueryString } from '../pagespeed';
import { PSICategories, PSIStrategy } from '../../types';

describe('unit tests for pagespeed services', () => {
  const key = process.env.PSI_API_KEY;
  const lighthouseResult = {
    categories: {
      performance: {
        score: 0.9,
        auditRefs: [
          {
            id: 'first-contentful-paint',
            weight: 5,
          },
        ],
      },
    },
    audits: {
      'first-contentful-paint': {
        score: 1,
        displayValue: '1s',
      },
    },
    configSettings: {
      formFactor: 'mobile',
    },
  };
  describe('testing setUpLighthouseQueryString', () => {
    it('simple query string for lighthouse score', () => {
      const params = {
        url: 'https://www.google.com',
        category: [PSICategories.PERFORMANCE],
        strategy: PSIStrategy.MOBILE,
      };
      const response = setUpLighthouseQueryString(params.url, params.category, params.strategy);
      const expected = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${params.url}&key=${key}&category=${params.category[0]}&strategy=${params.strategy}&`;
      expect(response).toEqual(expected);
    });
    it('query string for lighthouse score with multiple categories and default startegy', () => {
      const params = {
        url: 'https://www.google.com',
        category: [PSICategories.PERFORMANCE, PSICategories.SEO],
      };
      const response = setUpLighthouseQueryString(params.url, params.category);
      const expected = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${params.url}&key=${key}&category=${params.category[0]}&category=${params.category[1]}&strategy=${defaultStrategy}&`;
      expect(response).toEqual(expected);
    });
  });

  describe('testing getScore', () => {
    it('should return score', () => {
      const response = getScore(lighthouseResult);
      const expected = {
        performance: {
          score: 0.9,
          metrics: [
            {
              id: 'first-contentful-paint',
              score: 1,
              weight: 5,
              displayValue: '1s',
            },
          ],
        },
        configSettings: {
          formFactor: 'mobile',
        },
      };
      expect(response).toEqual(expected);
    });
  });
});
