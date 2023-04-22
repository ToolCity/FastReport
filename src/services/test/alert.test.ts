import { describe, it, expect } from '@jest/globals';
import { sendAlertMail } from '../alert/email';
import { sendAlertToSlackChannel } from '../alert/slack';
import { PSIStrategy } from '../../types';

describe('unit tests for alert services', () => {
  const defaultAlertConfig = {
    email: {
      id: 'test@gmail.com',
      enabled: true,
    },
    slack: {
      id: 'test',
      enabled: true,
    },
  };
  describe('testing email alerting service', () => {
    it('it should return error if alertConfig is not defined', async () => {
      const alertConfig = undefined;
      const result = await sendAlertMail(alertConfig, {});
      expect(result).toEqual({
        message: 'Alert config not found, generate one by /POST to /alert',
        failed: true,
      });
    });
    it('it should return error if email is not defined in alertConfig', async () => {
      const alertConfig = { ...defaultAlertConfig, email: { id: null, enabled: true } };
      const result = await sendAlertMail(alertConfig, {});
      expect(result).toEqual({
        message: 'Email in alertConfig not found, add one by /PATCH to /alert',
        failed: true,
      });
    });

    it('it should not alert if onlyAlertIfBelowBaseline is true and alert is not required', async () => {
      const result = await sendAlertMail(defaultAlertConfig, {}, undefined, true);
      expect(result).toEqual({
        message: `No alert required for this report`,
      });
    });
    it('it should not send alert if email is not enabled in alertConfig', async () => {
      const alertConfig = defaultAlertConfig;
      alertConfig.email.enabled = false;
      const result = await sendAlertMail(alertConfig, {});
      expect(result).toEqual({
        message: 'Email alert not enabled in config',
      });
    });
  });
  describe('testing slack alerting service', () => {
    it('it should return error if alertConfig is not defined', async () => {
      const alertConfig = undefined;
      const result = await sendAlertToSlackChannel(alertConfig, {});
      expect(result).toEqual({
        message: 'Alert config not found, generate one by /POST to /alert',
        failed: true,
      });
    });
    it('it should return error if slack is not defined in alertConfig', async () => {
      const alertConfig = { ...defaultAlertConfig, slack: { id: null, enabled: true } };
      const result = await sendAlertToSlackChannel(alertConfig, {});
      expect(result).toEqual({
        message: 'Slack Channel in alertConfig not found, add one by /PATCH to /alert',
        failed: true,
      });
    });
    it('it should not alert if onlyAlertIfBelowBaseline is true and alert is not required', async () => {
      const result = await sendAlertToSlackChannel(
        defaultAlertConfig,
        {},
        PSIStrategy.DESKTOP,
        true
      );
      expect(result).toEqual({
        message: `No alert required for this report`,
      });
    });
    it('it should not send alert if slack is not enabled in alertConfig', async () => {
      const alertConfig = defaultAlertConfig;
      alertConfig.slack.enabled = false;
      const result = await sendAlertToSlackChannel(alertConfig, {});
      expect(result).toEqual({
        message: 'Slack alert not enabled in config',
      });
    });
  });
});
