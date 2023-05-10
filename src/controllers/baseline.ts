import { Request, Response } from 'express';
import { getBaselineService } from '../services/baseline';
import { baselineStore } from '../store';

export const getBaseline = (req: Request, res: Response) => {
  const { apiKey } = req.query;
  if (!apiKey) {
    res.send(baselineStore);
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
