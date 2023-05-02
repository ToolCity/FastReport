import { socketConfig } from '../../config/socket';
import { io } from '../../index';
import { Message } from 'redis-smq';
import { setMessageStatus } from '../redis_smq';

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
