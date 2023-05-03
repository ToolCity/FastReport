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
import { compareMessageHandler } from './compare';
import { getScore, setUpLighthouseQueryString } from '../pagespeed';
import { PSICategories, PSIStrategy } from '../../types';

export const triggerMessageHandler = async (message: Message, cb: (err?: Error) => void) => {
  const body = message.getBody() as Record<string, unknown>;
  if (!body) throw new Error('body not found');
  const msgId = message.getId();
  if (!msgId) throw new Error('message not found');
  let messageStatus = setMessageStatus(msgId, {
    status: 'trigger',
    message: 'fetching data...🟡',
  });
  const { urls, chosenCategory, chosenStartegy, clientId, ...rest } = body;
  const socketId = socketConfig[clientId as string];
  try {
    io.to(socketId).emit('status', messageStatus);
    const queries = (urls as string[]).map(url =>
      setUpLighthouseQueryString(
        url,
        chosenCategory as PSICategories[],
        chosenStartegy as PSIStrategy
      )
    );

    const data = await Promise.allSettled(
      (queries as string[]).map(async (query: string) => {
        const response = await (await fetch(query)).json();
        if (response.error) {
          throw new Error(response.error.message);
        }
        const { lighthouseResult } = response;
        return getScore(lighthouseResult);
      })
    );
    const report = data.map((result, index) => {
      const url = (urls as string[])[index];
      if (result.status === 'fulfilled') {
        const score = result.value;
        return { url, ...score };
      } else {
        return { url, error: result.reason.message, failed: true };
      }
    });

    messageStatus = setMessageStatus(msgId, {
      status: 'trigger',
      message: 'lighthouse score has been fetched 🟢',
      report,
    });

    await createQueue('compare_queue');
    const cmessage = createMessage(
      { report, chosenCategory, chosenStartegy, clientId, ...rest },
      'compare_queue'
    );
    await produceMessage(cmessage);
    await setupConsumers('compare_queue', compareMessageHandler);
    if (socketId) io.to(socketId).emit('status', messageStatus);
    else console.log('socket connection not found, unable to notify client');
    cb();
  } catch (e: any) {
    console.error('Error occured in triggerMessageHandler', e);
    messageStatus = setMessageStatus(msgId, {
      status: 'trigger',
      message: 'Error occured while triggering',
      error: e,
    });
    if (socketId) io.to(socketId).emit('status', messageStatus);
    cb(e);
  }
};
