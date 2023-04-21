import { Request, Response } from 'express';
import { getConfigService } from '../services/config';

export const getConfig = (req: Request, res: Response) => {
  const { apiKey } = req.query;
  if (!apiKey) {
    res.status(400).json({ error: 'apiKey is required' });
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
