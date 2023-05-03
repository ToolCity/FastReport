import { socketConfig } from '../../config/socket';
import { io } from '../../index';
import { Message } from 'redis-smq';
import { setMessageStatus } from '../redis_smq';
import { sendAlertMail } from '../alert/email';
import { PSIStrategy } from '../../types';
import { sendAlertToSlackChannel } from '../alert/slack';

export const alertMessageHandler = async (message: Message, cb: (err?: Error) => void) => {
  const body = message.getBody() as Record<string, unknown>;
  if (!body) throw new Error('body not found');
  const msgId = message.getId();
  if (!msgId) throw new Error('message not found');
  let messageStatus = setMessageStatus(msgId, {
    status: 'alert',
    message: 'Sending alerts...🟡',
  });
  const { result, alertConfig, chosenStartegy, clientId } = body;
  const socketId = socketConfig[clientId as string];

  try {
    io.to(socketId).emit('status', messageStatus);

    const onlyAlertIfBelowBaseline = true; // set this to true if you want to send alert only if the score is below the baseline
    const emailAlertStatus = await sendAlertMail(
      alertConfig as Record<string, unknown>,
      result as Record<string, unknown>,
      chosenStartegy as PSIStrategy,
      onlyAlertIfBelowBaseline
    );
    const slackAlertStatus = await sendAlertToSlackChannel(
      alertConfig as Record<string, unknown>,
      result as Record<string, unknown>,
      chosenStartegy as PSIStrategy,
      onlyAlertIfBelowBaseline
    );

    messageStatus = setMessageStatus(msgId, {
      status: 'alert',
      message: 'Alerts have been sent! 🟢',
      alertStatus: {
        emailAlertStatus,
        slackAlertStatus,
      },
    });
    if (socketId) io.to(socketId).emit('status', messageStatus);
    else console.log('socket connection not found, unable to notify client');
    cb();
  } catch (e: any) {
    console.log('Error occured in alertMessageHandler', e);
    messageStatus = setMessageStatus(msgId, {
      status: 'alert',
      message: 'Error occured while alerting',
      error: e,
    });
    if (socketId) io.to(socketId).emit('status', messageStatus);
    cb(e);
  }
};
