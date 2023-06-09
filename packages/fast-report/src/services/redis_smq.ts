import { QueueManager, Message, Producer, Consumer } from 'redis-smq';
import config from '../config/redis_smq';
import { messageConfig, statusConfig } from '../config/socket';
const defaultNumberOfConsumers = Number(process.env.REDIS_NUMBER_OF_QUEUE_CONSUMERS) ?? 4;

export const initialiseRedisQueueManager = (): Promise<QueueManager | undefined> => {
  return new Promise((resolve, reject) => {
    QueueManager.createInstance(config, (err, queueManager) => {
      if (err) {
        console.error('Error creating queue manager : ', err);
        reject(err);
      } else resolve(queueManager);
    });
  });
};

export const checkQueueExists = async (queueName: string) => {
  const queueManager = await initialiseRedisQueueManager();
  return new Promise((resolve, reject) => {
    queueManager?.queue.exists(queueName, (err, reply) => {
      if (err) {
        console.log('Error checking if queue exists');
        reject(err);
      } else {
        resolve(reply);
      }
    });
  });
};

export const createQueue = async (queueName: string) => {
  const queueExists = await checkQueueExists(queueName);
  if (queueExists) {
    console.log('Queue already exists');
    return 1;
  }
  const queueManager = await initialiseRedisQueueManager();
  return new Promise((resolve, reject) => {
    queueManager?.queue.save(queueName, 1, err => reject(err));
    console.log('Queue created successfully');
    resolve(1);
  });
};

export const produceMessage = (message: Message) => {
  return new Promise((resolve, reject) => {
    const producer = new Producer(config);
    producer.run(err => {
      if (err) reject(err);
      producer.produce(message, err => {
        if (err) reject(err);
        const msgId = message.getId();
        console.log('Successfully produced. Message ID is ', msgId);
        resolve(msgId);
      });
    });
  });
};

export const createMessage = (body: unknown, queueName: string) => {
  const message = new Message();
  message
    .setBody(body)
    .setTTL(3600000)
    .setQueue(queueName)
    .setRetryDelay(1000)
    .setRetryThreshold(2);

  return message;
};

export const runConsumer = (consumer: Consumer) => {
  return new Promise((resolve, reject) => {
    consumer.run((err, reply) => {
      if (err) reject(err);
      resolve(reply);
    });
  });
};

export const setupConsumers = async (
  queueName: string,
  messageHandler: (message: Message, cb: (err?: Error) => void) => Promise<void>,
  numberOfConsumers: number = defaultNumberOfConsumers
) => {
  await createQueue(queueName);
  const consumers = [];
  for (let i = 0; i < numberOfConsumers; i++) {
    const consumer = new Consumer(config);
    consumer.consume(queueName, messageHandler, err => {
      if (err) throw err;
    });
    consumers.push(consumer);
  }
  consumers.forEach(async consumer => {
    await runConsumer(consumer);
  });
};

export const setMessageStatus = (msgId: string, status: Record<string, any>, apiKey: string) => {
  messageConfig[msgId] = status;
  const obj = {
    [msgId]: messageConfig[msgId],
  };
  statusConfig[apiKey] = {
    ...statusConfig[apiKey],
    [status['status']]: obj,
  };
  return obj;
};
