import { socketConfig } from '../../config/socket';
import { ALERT_QUEUE_NAME } from '../../config/redis_smq';
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
import { compareReportWithBaseline, getBaselineService } from '../baseline';
import { PSICategories, PSIStrategy } from '../../types';

export const compareMessageHandler = async (message: Message, cb: (err?: Error) => void) => {
  const status = 'compare';
  const body = message.getBody() as Record<string, unknown>;
  if (!body) throw new Error('body not found');

  const { apiKey, report, alertConfig, chosenCategory, chosenStartegy } = body;
  const clientId = body.clientId as string;
  const socketId = socketConfig[clientId];

  const msgId = message.getId();
  if (!msgId) throw new Error('message not found');
  let messageStatus = setMessageStatus(
    msgId,
    {
      status,
      message: 'comparing with baseline...🟡',
    },
    clientId
  );

  try {
    io.to(socketId).emit('status', messageStatus);
    const baseline = getBaselineService(apiKey as string);
    const result = compareReportWithBaseline(
      report as Record<string, unknown>[],
      baseline,
      chosenCategory as PSICategories[],
      chosenStartegy as PSIStrategy
    );

    messageStatus = setMessageStatus(
      msgId,
      {
        status,
        message: 'Scores have been compared with baseline and report generated! 🟢',
        result,
      },
      clientId
    );

    await createQueue(ALERT_QUEUE_NAME);
    const cmessage = createMessage(
      { result, alertConfig, chosenStartegy, clientId },
      ALERT_QUEUE_NAME
    );
    await produceMessage(cmessage);
    await setupConsumers(ALERT_QUEUE_NAME, alertMessageHandler);
    if (socketId) io.to(socketId).emit('status', messageStatus);
    else console.log('socket connection not found, unable to notify client');
    cb();
  } catch (e: unknown) {
    console.log('Error occured in compareMessageHandler', e);
    messageStatus = setMessageStatus(
      msgId,
      {
        status,
        message: 'Error occured while comparing',
        error: e,
      },
      clientId
    );
    if (socketId) io.to(socketId).emit('status', messageStatus);
    cb(e as Error);
  }
};
