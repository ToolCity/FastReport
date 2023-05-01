import { QueueManager, Message, Producer } from 'redis-smq';
import config from '../config/redis_smq';

export const createQueue = (queueName: string) => {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    QueueManager.createInstance(config, (err, queueManager) => {
      if (err) reject(err);
      else {
        queueManager?.queue.exists(queueName, (err, reply) => {
          if (err) reject(err);
          else {
            if (!reply) {
              console.log('Queue does not exist. Creating queue...');
              queueManager?.queue.save(queueName, 1, err => console.error(err));
            }
            resolve(1);
          }
        });
      }
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
