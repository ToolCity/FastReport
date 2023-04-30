import { QueueManager, Message, Producer } from 'redis-smq';
import config from '../config/redis_smq';
import { Request, Response } from 'express';
import { io } from '../../src/index';

export const QUEUE_NAME = 'trigger_queue';

export const postMessage = (req: Request, res: Response) => {
  const { messages, roomId } = req.body;
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
            const msgIds: string[] = [];
            messages.forEach((data: Record<string, unknown>) => {
              const message = new Message();
              message.setBody(data).setTTL(3600000).setQueue(QUEUE_NAME);
              producer.produce(message, err => {
                if (err) throw err;
                else {
                  const msgId = message.getId();
                  if (msgId) msgIds.push(msgId);
                  console.log('Successfully produced. Message ID is ', msgId);
                  io.to(roomId).emit('message', { msgId });
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
