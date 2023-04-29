export default {
  redis: {
    client: 'redis',
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
};
