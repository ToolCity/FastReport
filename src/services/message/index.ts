import { messageConfig, socketConfig } from '../../config/socket';
import { io } from '../../index';
import { Message } from 'redis-smq';

export const triggerMessageHandler = async (message: Message, cb: (err?: Error) => void) => {
  const body = message.getBody();
  if (!body) throw new Error('body not found');
  const messageId = message.getId();
  if (!messageId) throw new Error('message not found');

  messageConfig[messageId] = {
    status: 'trigger',
    message: 'fetching data...🟡',
  };
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const socketId = socketConfig[body.clientId];
  io.to(socketId).emit('status', messageConfig[messageId]);

  // DUMMY PROCESSING
  await new Promise(r => setTimeout(r, 2000));
  console.log(body);

  messageConfig[messageId] = {
    status: 'trigger',
    message: 'lighthouse score has been fetched 🟢',
  };
  // push the data to compare queue
  if (socketId) io.to(socketId).emit('status', messageConfig[messageId]);
  else console.log('socket connection not found, unable to notify client');
  cb();
};

export const compareMessageHandler = async (message: Message, cb: (err?: Error) => void) => {
  const body = message.getBody();
  if (!body) throw new Error('body not found');
  const messageId = message.getId();
  if (!messageId) throw new Error('message not found');

  messageConfig[messageId] = {
    status: 'comparision',
    message: 'comparing with baseline...🟡',
  };
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const socketId = socketConfig[body.clientId];
  io.to(socketId).emit('status', messageConfig[messageId]);

  // DUMMY PROCESSING
  await new Promise(r => setTimeout(r, 2000));
  console.log(body);

  messageConfig[messageId] = {
    status: 'comparision',
    message: 'Scores have been compared with baseline and report generated! 🟢',
  };
  // push the data to alert queue
  if (socketId) io.to(socketId).emit('status', messageConfig[messageId]);
  else console.log('socket connection not found, unable to notify client');
  cb();
};

export const alertMessageHandler = async (message: Message, cb: (err?: Error) => void) => {
  const body = message.getBody();
  if (!body) throw new Error('body not found');
  const messageId = message.getId();
  if (!messageId) throw new Error('message not found');

  messageConfig[messageId] = {
    status: 'alert',
    message: 'Sending alerts...🟡',
  };
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const socketId = socketConfig[body.clientId];
  io.to(socketId).emit('status', messageConfig[messageId]);

  // DUMMY PROCESSING
  await new Promise(r => setTimeout(r, 2000));
  console.log(body);

  messageConfig[messageId] = {
    status: 'alert',
    message: 'Alerts have been sent! 🟢',
  };
  if (socketId) io.to(socketId).emit('status', messageConfig[messageId]);
  else console.log('socket connection not found, unable to notify client');
  cb();
};
