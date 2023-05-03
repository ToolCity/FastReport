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
import { compareReportWithBaseline, getBaselineService } from '../baseline';
import { PSICategories, PSIStrategy } from '../../types';

export const compareMessageHandler = async (message: Message, cb: (err?: Error) => void) => {
  const body = message.getBody() as Record<string, unknown>;
  if (!body) throw new Error('body not found');
  const msgId = message.getId();
  if (!msgId) throw new Error('message not found');
  let messageStatus = setMessageStatus(msgId, {
    status: 'comparision',
    message: 'comparing with baseline...🟡',
  });
  const { apiKey, report, clientId, alertConfig, chosenCategory, chosenStartegy } = body;
  console.log(body);
  const socketId = socketConfig[clientId as string];

  try {
    io.to(socketId).emit('status', messageStatus);
    const baseline = getBaselineService(apiKey as string);
    const result = compareReportWithBaseline(
      report as Record<string, unknown>[],
      baseline,
      chosenCategory as PSICategories[],
      chosenStartegy as PSIStrategy
    );

    messageStatus = setMessageStatus(msgId, {
      status: 'comparision',
      message: 'Scores have been compared with baseline and report generated! 🟢',
      result,
    });

    //TODO: push the data to alert queue
    await createQueue('alert_queue');
    const cmessage = createMessage(
      { result, alertConfig, chosenStartegy, clientId },
      'alert_queue'
    );
    await produceMessage(cmessage);
    await setupConsumers('alert_queue', alertMessageHandler);
    if (socketId) io.to(socketId).emit('status', messageStatus);
    else console.log('socket connection not found, unable to notify client');
    cb();
  } catch (e: any) {
    console.log('Error occured in compareMessageHandler', e);
    messageStatus = setMessageStatus(msgId, {
      status: 'comparision',
      message: 'Error occured while comparing',
      error: e,
    });
    if (socketId) io.to(socketId).emit('status', messageStatus);
    cb(e);
  }
};
