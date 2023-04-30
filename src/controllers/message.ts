import { QueueManager, Message, Producer } from 'redis-smq';
import { Consumer } from 'redis-smq';
import config from '../config/redis_smq';
import { Request, Response } from 'express';
import { io } from '../../src/index';
import { socketConfig } from '../services/socket';
import { time } from 'console';

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
              message
                .setBody(data)
                .setTTL(3600000)
                .setQueue(QUEUE_NAME)
                .setRetryDelay(1000)
                .setRetryThreshold(2);
              producer.produce(message, err => {
                if (err) throw err;
                else {
                  const msgId = message.getId();
                  if (msgId) msgIds.push(msgId);
                  console.log('Successfully produced. Message ID is ', msgId);
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

const messageHandler = async (message: Message, cb: (err?: Error) => void) => {
  const body = message.getBody();
  if (!body) throw new Error('body not found');
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //   @ts-ignore
  const socketId = socketConfig[body.clientId];
  io.to(socketId).emit('status', { message: 'message has been received by worker 🟡' });
  // get the socket id for the client which queued the message
  await new Promise(r => setTimeout(r, 2000));
  console.log(body);
  // what to do if no socket id is found?
  // maintain a message_id : status object so in case user asks for status of a particular message later it should be able to get it
  // Client will then get data when they emit event of get_status
  io.to(socketId).emit('status', { message: 'message has been processed 🟢' });
  cb(new Error('error'));
};

const consumer = new Consumer();
consumer.consume(QUEUE_NAME, messageHandler, err => {
  if (err) throw err;
});
consumer.run();
