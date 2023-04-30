import { RedisClientName, TRedisConfig } from 'redis-smq-common/dist/types';
export default {
  redis: {
    client: RedisClientName.REDIS_V4,
    options: {
      host: '127.0.0.1',
      port: 6379,
      connect_timeout: 3600000,
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
