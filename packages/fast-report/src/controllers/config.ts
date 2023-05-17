import { Request, Response } from 'express';
import { getConfigService } from '../services/config';
import { configStore } from '../store';

export const getConfig = (req: Request, res: Response) => {
  const { apiKey } = req.query;
  if (!apiKey) {
    res.send(configStore);
    return;
  }
  const config = getConfigService(apiKey.toString());
  if (!config) {
    res.status(404).json({ error: 'config not found' });
    return;
  }
  res.json({ config });
};

export const postConfig = (req: Request, res: Response) => {
  res.send('generate a config and return apiKey');
};

export const patchConfig = (req: Request, res: Response) => {
  res.send('update the config');
};
