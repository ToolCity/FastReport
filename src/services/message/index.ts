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

export const triggerMessageHandler = async (message: Message, cb: (err?: Error) => void) => {
  const body = message.getBody();
  if (!body) throw new Error('body not found');
  const msgId = message.getId();
  if (!msgId) throw new Error('message not found');
  let messageStatus = setMessageStatus(msgId, {
    status: 'trigger',
    message: 'fetching data...🟡',
  });
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const socketId = socketConfig[body.clientId];
  io.to(socketId).emit('status', messageStatus);

  // DUMMY PROCESSING
  await new Promise(r => setTimeout(r, 2000));
  console.log(body);

  messageStatus = setMessageStatus(msgId, {
    status: 'trigger',
    message: 'lighthouse score has been fetched 🟢',
  });
  //TODO: push the data to compare queue
  await createQueue('compare_queue');
  const cmessage = createMessage(body, 'compare_queue');
  await produceMessage(cmessage);
  await setupConsumers('compare_queue', compareMessageHandler);
  if (socketId) io.to(socketId).emit('status', messageStatus);
  else console.log('socket connection not found, unable to notify client');
  cb();
};

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

export const alertMessageHandler = async (message: Message, cb: (err?: Error) => void) => {
  const body = message.getBody();
  if (!body) throw new Error('body not found');
  const msgId = message.getId();
  if (!msgId) throw new Error('message not found');
  let messageStatus = setMessageStatus(msgId, {
    status: 'alert',
    message: 'Sending alerts...🟡',
  });
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const socketId = socketConfig[body.clientId];
  io.to(socketId).emit('status', messageStatus);

  // DUMMY PROCESSING
  await new Promise(r => setTimeout(r, 2000));

  console.log(body);
  messageStatus = setMessageStatus(msgId, {
    status: 'alert',
    message: 'Alerts have been sent! 🟢',
  });
  if (socketId) io.to(socketId).emit('status', messageStatus);
  else console.log('socket connection not found, unable to notify client');
  cb();
};
