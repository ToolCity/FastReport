import { describe, it, expect } from '@jest/globals';
import { getBaselineService, compareReportWithBaseline } from '../baseline';
import { PSICategories } from '../../types';
describe('unit tests for baseline services', () => {
  describe('testing getBaselineService', () => {
    it('should return undefined if null apiKey is provided', () => {
      const baselineConfig = getBaselineService('');
      expect(baselineConfig).toBeFalsy();
    });
  });
  describe('testing compareReportWithBaseline', () => {
    it('should return baseline config not found', () => {
      const result = compareReportWithBaseline({}, undefined, []);
      expect(result).toEqual({
        result: 'baseline config not found, generate one by /POST to /baseline',
      });
    });
    it('should return a failed message if report is failed', () => {
      const result = compareReportWithBaseline(
        [
          {
            url: 'https://www.google.com',
            failed: true,
          },
        ],
        {
          id: '1234',
          baselineConfig: [
            {
              url: 'https://www.google.com',
              performance: '0.9',
              accessibility: '0.9',
              bestPractices: '0.9',
              seo: '0.9',
              pwa: '0.9',
            },
          ],
        },
        [PSICategories.PERFORMANCE]
      );
      expect(result).toEqual({
        'https://www.google.com': {
          message: 'Failed to fetch lighthouse score and baseline comparision',
          failed: true,
        },
      });
    });

    it('should return a failed message if baseline config is not defined for the url', () => {
      const result = compareReportWithBaseline(
        [
          {
            url: 'https://www.google.com',
            failed: false,
          },
        ],
        {
          id: '1234',
          baselineConfig: [],
        },
        [PSICategories.PERFORMANCE]
      );
      expect(result).toEqual({
        'https://www.google.com': {
          message:
            'Baseline config is not defined for this URL, please generate one by a POST request on /baseline',
          failed: true,
        },
      });
    });

    it('should return a failed message if baseline config is not defined for the category', () => {
      const result = compareReportWithBaseline(
        [
          {
            url: 'https://www.google.com',
            seo: {
              score: 0.9,
            },
          },
        ],
        {
          id: '1234',
          baselineConfig: [
            {
              url: 'https://www.google.com',
              performance: '0.9',
            },
          ],
        },
        [PSICategories.SEO]
      );
      expect(result).toEqual({
        'https://www.google.com': {
          seo: {
            message: 'Baseline config does not exist for this metric on this particular URL',
            failed: true,
          },
        },
      });
    });

    it('should return a comparision result', () => {
      const result = compareReportWithBaseline(
        [
          {
            url: 'https://www.google.com',
            seo: {
              score: 0.9,
            },
          },
        ],
        {
          id: '1234',
          baselineConfig: [
            {
              url: 'https://www.google.com',
              seo: '0.9',
            },
          ],
        },
        [PSICategories.SEO]
      );
      expect(result).toEqual({
        'https://www.google.com': {
          seo: {
            message: '🟢 Above baseline',
            score: 90,
            baselineScore: 90,
            alertRequired: false,
          },
        },
      });
    });
  });
});
