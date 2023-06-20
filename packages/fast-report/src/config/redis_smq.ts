import { config as dotenvConfig } from 'dotenv';
import { IConfig } from 'redis-smq/dist/types';
dotenvConfig();
const host = process.env.REDIS_HOST;
const port = process.env.REDIS_PORT;
const oneHourInMiliSecond = 3600000;

export const TRIGGER_QUEUE_NAME = 'trigger_queue';
export const COMPARE_QUEUE_NAME = 'compare_queue';
export const ALERT_QUEUE_NAME = 'alert_queue';

export default {
  redis: {
    options: {
      host,
      port,
      connect_timeout: oneHourInMiliSecond,
    },
  },
  logger: {
    enabled: true,
    options: {
      level: 'info',
    },
  },
  messages: {
    store: false,
  },
} as unknown as IConfig;
