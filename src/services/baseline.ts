import { baselineStore } from '../store/index.js';
import { PSICategories } from '../types/index.js';

export const getBaselineService = (apiKey: string) => {
  const baseline = baselineStore.find(baseline => baseline.id === apiKey);
  return baseline;
};

export const compareReportWithBaseline = (
  report: Record<string, any>,
  apiKey: string,
  chosenCategory: PSICategories[]
) => {
  const baseline = getBaselineService(apiKey);
  if (!baseline) {
    return {
      result: 'baseline config not found, generate one by /POST to /baseline',
    };
  }
  const result: Record<string, any> = {};
  report.forEach((data: any) => {
    if (data.failed) {
      result[data.url] = {
        message: 'Failed to fetch lighthouse score and baseline comparision',
        failed: true,
      };
    } else {
      const baselineConfig = baseline.baselineConfig.find(bs => bs.url === data.url);
      if (!baselineConfig) {
        result[data.url] = {
          message:
            'Baseline config is not defined for this URL, please generate one by a POST request on /baseline',
          failed: true,
        };
      } else {
        chosenCategory.forEach(category => {
          if (baselineConfig[category]) {
            const baselineScore = Math.round(Number(baselineConfig[category]) * 100);
            if (data[category]) {
              const score = Math.round(data[category].score * 100);
              const belowBaseline = score < baselineScore;
              result[data.url] = {
                ...result[data.url],
                [category]: {
                  message: belowBaseline ? `🔴 Below baseline` : '🟢 Above baseline',
                  score,
                  baselineScore,
                  alertRequired: belowBaseline,
                },
              };
            }
          } else {
            result[data.url] = {
              ...result[data.url],
              [category]: {
                message: 'Baseline config does not exist for this metric on this particular URL',
                failed: true,
              },
            };
          }
        });
      }
    }
  });
  return result;
};
