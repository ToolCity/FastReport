import { Request, Response } from 'express';
import { getBaselineService } from '../services/baseline';

export const getBaseline = (req: Request, res: Response) => {
  const { apiKey } = req.query;
  if (!apiKey) {
    res.status(400).json({ error: 'apiKey is required' });
    return;
  }
  const baseline = getBaselineService(apiKey.toString());
  if (!baseline) {
    res.status(404).json({ error: 'baseline not found' });
    return;
  }
  res.json({ baseline });
};

export const postBaseline = (req: Request, res: Response) => {
  res.send('generate a baseline');
};
