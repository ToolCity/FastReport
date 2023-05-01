import { QueueManager, Message, Producer, Consumer } from 'redis-smq';
import config from '../config/redis_smq';
import { triggerMessageHandler } from './message';
import { messageConfig } from '../config/socket';

export const checkQueueExists = (queueName: string) => {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    QueueManager.createInstance(config, (err, queueManager) => {
      if (err) reject(err);
      else {
        queueManager?.queue.exists(queueName, (err, reply) => {
          if (err) {
            console.log('Error checking if queue exists');
            reject(err);
          } else {
            resolve(reply);
          }
        });
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
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    QueueManager.createInstance(config, (err, queueManager) => {
      if (err) reject(err);
      queueManager?.queue.save(queueName, 1, err => reject(err));
      console.log('Queue created successfully');
      resolve(1);
    });
  });
};

export const produceMessage = (message: Message) => {
  return new Promise((resolve, reject) => {
    const producer = new Producer();
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
    console.log('Running consumer');
    consumer.run((err, status) => {
      if (err) reject(err);
      if (status) {
        consumer.shutdown();
        resolve(status);
      }
    });
  });
};
export const setupConsumers = async (queueName: string) => {
  await createQueue(queueName);
  const numberOfConsumers = Number(process.env.REDIS_NUMBER_OF_QUEUE_CONSUMERS) ?? 4;
  const consumers = [];
  for (let i = 0; i < numberOfConsumers; i++) {
    const consumer = new Consumer();
    consumer.consume(queueName, triggerMessageHandler, err => {
      if (err) throw err;
    });
    consumers.push(consumer);
  }
  consumers.forEach(async consumer => {
    await runConsumer(consumer);
  });
};

export const setMessageStatus = (msgId: string, status: Record<string, unknown>) => {
  messageConfig[msgId] = status;
  return {
    [msgId]: messageConfig[msgId],
  };
};
