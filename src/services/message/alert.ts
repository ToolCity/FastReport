import { socketConfig } from '../../config/socket';
import { io } from '../../index';
import { Message } from 'redis-smq';
import { setMessageStatus } from '../redis_smq';
import { sendAlertMail } from '../alert/email';
import { PSIStrategy } from '../../types';
import { sendAlertToSlackChannel } from '../alert/slack';

export const alertMessageHandler = async (message: Message, cb: (err?: Error) => void) => {
  const status = 'alert';
  const body = message.getBody() as Record<string, unknown>;
  if (!body) throw new Error('body not found');
  const { result, alertConfig, chosenStartegy } = body;
  const clientId = body.clientId as string;
  const socketId = socketConfig[clientId as string];

  const msgId = message.getId();
  if (!msgId) throw new Error('message not found');
  let messageStatus = setMessageStatus(
    msgId,
    {
      status,
      message: 'Sending alerts...🟡',
    },
    clientId
  );

  try {
    io.to(socketId).emit('status', messageStatus);

    const onlyAlertIfBelowBaseline = false; // set this to true if you want to send alert only if the score is below the baseline
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

    messageStatus = setMessageStatus(
      msgId,
      {
        status,
        message: 'Alerts have been sent! 🟢',
        alertStatus: {
          emailAlertStatus,
          slackAlertStatus,
        },
      },
      clientId
    );

    if (socketId) {
      io.to(socketId).emit('status', messageStatus);
      if (emailAlertStatus.html) {
        io.to(socketId).emit('final-report', {
          html: emailAlertStatus.html,
        });
      }
    } else console.log('socket connection not found, unable to notify client');
    cb();
  } catch (e: any) {
    console.log('Error occured in alertMessageHandler', e);
    messageStatus = setMessageStatus(
      msgId,
      {
        status,
        message: 'Error occured while alerting',
        error: e,
      },
      clientId
    );
    if (socketId) io.to(socketId).emit('status', messageStatus);
    cb(e);
  }
};
