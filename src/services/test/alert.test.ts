import { describe, it, expect } from '@jest/globals';
import { sendAlertMail } from '../alert';

describe('unit tests for alert services', () => {
  describe('testing sendAlertEmail', () => {
    it('it should return error if alertConfig is not defined', async () => {
      const result = await sendAlertMail(undefined, {});
      expect(result).toEqual({
        message: 'Alert config not found, generate one by /POST to /alert',
        failed: true,
      });
    });
    it('it should return error if email is not defined in alertConfig', async () => {
      const result = await sendAlertMail({ email: null }, {});
      expect(result).toEqual({
        message: 'Email in alertConfig not found, add one by /PATCH to /alert',
        failed: true,
      });
    });

    it('it should not alert if onlyAlertIfBelowBaseline is true and alert is not required', async () => {
      const result = await sendAlertMail({ email: 'test@gmail.com' }, {}, undefined, true);
      expect(result).toEqual({
        message: `No alert required for this report`,
      });
    });
  });
});
