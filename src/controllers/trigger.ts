import { Request, Response } from 'express';
import { configStore } from '../store/index';
import {
  getScore,
  defaultCategory,
  setUpLighthouseQueryString,
  defaultStrategy,
} from '../services/pagespeed';
import { PSICategories, PSIStrategy } from '../types/index';
import { compareReportWithBaseline, getBaselineService } from '../services/baseline';
import { sendAlertMail } from '../services/alert/email';
import { sendAlertToSlackChannel } from '../services/alert/slack';

export const getTrigger = async (req: Request, res: Response) => {
  const { apiKey, category, strategy } = req.query;
  if (!apiKey) {
    res.status(400).json({ error: 'apiKey is required' });
    return;
  }
  const config = configStore.find(config => config.id === apiKey.toString());
  if (!config) {
    res.status(404).json({ error: 'config not found' });
    return;
  }
  // access the categories requested by user
  let chosenCategory: PSICategories[] = defaultCategory;
  if (category) {
    if (typeof category === 'string') {
      chosenCategory = category.split(',').filter((c: string) => {
        const psic = c.trim().toLocaleLowerCase();
        if (Object.values(PSICategories).includes(psic as PSICategories)) {
          return psic;
        }
      }) as PSICategories[];
      if (chosenCategory?.length === 0) {
        res.status(400).json({
          error: `category should be a string separated by , and can accept only ${Object.values(
            PSICategories
          ).join(', ')}`,
        });
        return;
      }
    } else {
      res.status(400).json({
        error: `category should be a string separated by , and can accept only ${Object.values(
          PSICategories
        ).join(', ')}`,
      });
      return;
    }
  }

  let chosenStartegy: PSIStrategy = defaultStrategy;
  if (strategy && Object.values(PSIStrategy).includes(strategy as PSIStrategy)) {
    chosenStartegy = strategy as PSIStrategy;
  }

  const { urls, alertConfig } = config;

  const queries = urls.map(url => setUpLighthouseQueryString(url, chosenCategory, chosenStartegy));
  // trigger the queries
  const data = await Promise.allSettled(
    queries.map(async query => {
      const response = await (await fetch(query)).json();
      if (response.error) {
        throw new Error(response.error.message);
      }
      const { lighthouseResult } = response;
      return getScore(lighthouseResult);
    })
  );
  const report = data.map((result, index) => {
    const url = urls[index];
    if (result.status === 'fulfilled') {
      const score = result.value;
      return { url, ...score };
    } else {
      return { url, error: result.reason.message, failed: true };
    }
  });

  const onlyAlertIfBelowBaseline = true; // set this to true if you want to send alert only if the score is below the baseline
  const baseline = getBaselineService(apiKey.toString(), chosenStartegy);
  const result = compareReportWithBaseline(report, baseline, chosenCategory);
  const emailAlertStatus = await sendAlertMail(
    alertConfig,
    result,
    chosenStartegy,
    onlyAlertIfBelowBaseline
  );
  const slackAlertStatus = await sendAlertToSlackChannel(
    alertConfig,
    result,
    chosenStartegy,
    onlyAlertIfBelowBaseline
  );
  res.json({
    result,
    report,
    alertStatus: {
      email: emailAlertStatus,
      slack: slackAlertStatus,
    },
  });
};
