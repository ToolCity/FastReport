import { Router } from 'express';
import { getTrigger } from '../controllers/trigger';
import { getBaseline, postBaseline } from '../controllers/baseline';
import { getConfig, patchConfig, postConfig } from '../controllers/config';
import { postMessage } from '../controllers/message';

const router = Router();

router.route('/trigger').get(getTrigger);

router.route('/message').post(postMessage);

router.route('/baseline').get(getBaseline).post(postBaseline);

router.route('/config').get(getConfig).post(postConfig).patch(patchConfig);

export default router;
