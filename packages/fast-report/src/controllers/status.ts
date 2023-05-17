import { Request, Response } from 'express';
import { statusConfig } from '../config/socket';

export const getStatus = (req: Request, res: Response) => {
  const { apiKey } = req.query;
  if (!apiKey) {
    res.status(400).json({ error: 'apiKey is required' });
    return;
  }
  const config = statusConfig[apiKey.toString()];
  res.json(config);
};
