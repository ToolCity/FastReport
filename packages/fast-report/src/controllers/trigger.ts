import { Request, Response } from 'express';
import { configStore } from '../store/index';
import { defaultCategory, defaultStrategy } from '../services/pagespeed';
import { PSICategories, PSIStrategy } from '../types/index';
import { config as dotenvConfig } from 'dotenv';
import { io } from '../index';
import { socketConfig, messageConfig, statusConfig } from '../config/socket';
import { createMessage, createQueue, produceMessage, setupConsumers } from '../services/redis_smq';
import { triggerMessageHandler } from '../services/message/trigger';
import { TRIGGER_QUEUE_NAME } from '../config/redis_smq';

dotenvConfig();

export const getTrigger = async (req: Request, res: Response) => {
  try {
    const { apiKey, category, strategy } = req.query;
    if (!apiKey) {
      res.status(400).json({ error: 'apiKey is required' });
      return;
    }
    const config = configStore.find(config => config.id === apiKey.toString());
    if (!config) {
      res.status(404).json({ error: 'config not found' });
      return;
    }
    // access the categories requested by user
    let chosenCategory: PSICategories[] = defaultCategory;
    if (category) {
      if (typeof category === 'string') {
        chosenCategory = category.split(',').filter((c: string) => {
          const psic = c.trim().toLocaleLowerCase();
          if (Object.values(PSICategories).includes(psic as PSICategories)) {
            return psic;
          }
        }) as PSICategories[];
        if (chosenCategory?.length === 0) {
          res.status(400).json({
            error: `category should be a string separated by , and can accept only ${Object.values(
              PSICategories
            ).join(', ')}`,
          });
          return;
        }
      } else {
        res.status(400).json({
          error: `category should be a string separated by , and can accept only ${Object.values(
            PSICategories
          ).join(', ')}`,
        });
        return;
      }
    }

    let chosenStartegy: PSIStrategy = defaultStrategy;
    if (
      strategy &&
      Object.values(PSIStrategy).includes((strategy as string).toLocaleLowerCase() as PSIStrategy)
    ) {
      chosenStartegy = strategy as PSIStrategy;
    }
    const { urls, alertConfig } = config;

    const clientId = apiKey.toString();

    statusConfig[clientId] = {
      trigger: 'yet to be triggered',
      compare: 'yet to be compared',
      alert: 'yet to be alerted',
    };

    await createQueue(TRIGGER_QUEUE_NAME);
    const message = createMessage(
      { urls, apiKey, clientId, alertConfig, chosenStartegy, chosenCategory },
      TRIGGER_QUEUE_NAME
    );
    const msgId = (await produceMessage(message)) as string;
    messageConfig[msgId] = {
      status: 'queued',
      message: 'message has been queued 🟡',
    };
    const roomId = socketConfig[clientId];
    if (roomId) io.to(roomId).emit('message_id', { msgId });
    await setupConsumers(TRIGGER_QUEUE_NAME, triggerMessageHandler);
    res
      .status(200)
      .json({ status: 'success', message: 'message have been queued, started processing!', msgId });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: `Internal Server Error ${e.message}` });
  }
};
