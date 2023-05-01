import { config as dotenvConfig } from 'dotenv';
import { QueueManager, Message, Producer } from 'redis-smq';
import { Consumer } from 'redis-smq';
import config from '../config/redis_smq';
import { Request, Response } from 'express';
import { io } from '../../src/index';
import { socketConfig, messageConfig } from '../config/socket';
import { triggerMessageHandler } from '../services/message';
dotenvConfig();

export const QUEUE_NAME = String(process.env.QUEUE_NAME) ?? 'trigger_queue';

export const postMessage = (req: Request, res: Response) => {
  const { messages, apiKey: clientId } = req.body;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  QueueManager.createInstance(config, (err, queueManager) => {
    if (err) throw err;
    else {
      queueManager?.queue.exists(QUEUE_NAME, (err, reply) => {
        if (err) throw err;
        else {
          if (!reply) {
            console.log('Queue does not exist. Creating queue...');
            queueManager?.queue.save(QUEUE_NAME, 1, err => console.error(err));
          }
          const producer = new Producer();
          producer.run(err => {
            if (err) throw err;
            messages.forEach((data: Record<string, unknown>) => {
              const message = new Message();
              message
                .setBody({ ...data, clientId })
                .setTTL(3600000)
                .setQueue(QUEUE_NAME)
                .setRetryDelay(1000)
                .setRetryThreshold(2);
              producer.produce(message, err => {
                if (err) throw err;
                else {
                  const msgId = message.getId();
                  console.log('Successfully produced. Message ID is ', msgId);
                  messageConfig[message.getId() as string] = {
                    status: 'queued',
                    message: 'message has been queued 🟡',
                  };
                  const roomId = socketConfig[clientId];
                  io.to(roomId).emit('message_id', { msgId });
                }
              });
            });
          });
          res.status(200).json({ status: 'success', message: 'messages have been queued' });
        }
      });
    }
  });
};

const numberOfConsumers = Number(process.env.REDIS_NUMBER_OF_QUEUE_CONSUMERS) ?? 4;

const consumers = [];
for (let i = 0; i < numberOfConsumers; i++) {
  const consumer = new Consumer();
  consumer.consume(QUEUE_NAME, triggerMessageHandler, err => {
    if (err) throw err;
  });
  consumers.push(consumer);
}

consumers.forEach(consumer => consumer.run());
