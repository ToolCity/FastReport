import { RedisClientName, TRedisConfig } from 'redis-smq-common/dist/types';
import { config as dotenvConfig } from 'dotenv';
dotenvConfig();
const host = process.env.REDIS_HOST;
const port = process.env.REDIS_PORT;
const oneHourInMiliSecond = 3600000;

export const TRIGGER_QUEUE_NAME = 'trigger_queue';
export const COMPARE_QUEUE_NAME = 'compare_queue';
export const ALERT_QUEUE_NAME = 'alert_queue';

export default {
  redis: {
    client: RedisClientName.REDIS_V4,
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
} as unknown as TRedisConfig;
