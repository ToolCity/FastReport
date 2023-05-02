import { socketConfig } from '../../config/socket';
import { io } from '../../index';
import { Message } from 'redis-smq';
import {
  createMessage,
  setMessageStatus,
  produceMessage,
  setupConsumers,
  createQueue,
} from '../redis_smq';
import { alertMessageHandler } from './alert';

export const compareMessageHandler = async (message: Message, cb: (err?: Error) => void) => {
  const body = message.getBody();
  if (!body) throw new Error('body not found');
  const msgId = message.getId();
  if (!msgId) throw new Error('message not found');
  let messageStatus = setMessageStatus(msgId, {
    status: 'comparision',
    message: 'comparing with baseline...🟡',
  });

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const socketId = socketConfig[body.clientId];
  io.to(socketId).emit('status', messageStatus);

  // DUMMY PROCESSING
  await new Promise(r => setTimeout(r, 2000));
  console.log(body);

  messageStatus = setMessageStatus(msgId, {
    status: 'comparision',
    message: 'Scores have been compared with baseline and report generated! 🟢',
  });

  //TODO: push the data to alert queue
  await createQueue('alert_queue');
  const cmessage = createMessage(body, 'alert_queue');
  await produceMessage(cmessage);
  await setupConsumers('alert_queue', alertMessageHandler);
  if (socketId) io.to(socketId).emit('status', messageStatus);
  else console.log('socket connection not found, unable to notify client');
  cb();
};
