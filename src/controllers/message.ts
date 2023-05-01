import { config as dotenvConfig } from 'dotenv';
import { Request, Response } from 'express';
import { io } from '../../src/index';
import { socketConfig, messageConfig } from '../config/socket';
import { createMessage, produceMessage, setupConsumers } from '../services/redis_smq';
dotenvConfig();

export const QUEUE_NAME = String(process.env.REDIS_QUEUE_NAME) ?? 'trigger_queue';

export const postMessage = async (req: Request, res: Response) => {
  const { messages, apiKey: clientId } = req.body;
  messages.forEach(async (data: Record<string, unknown>) => {
    const message = createMessage({ ...data, clientId }, QUEUE_NAME);
    const msgId = (await produceMessage(message)) as string;
    messageConfig[msgId] = {
      status: 'queued',
      message: 'message has been queued 🟡',
    };
    const roomId = socketConfig[clientId];
    io.to(roomId).emit('message_id', { msgId });
  });
  await setupConsumers(QUEUE_NAME);
  res.status(200).json({ status: 'success', message: 'messages have been queued' });
};
