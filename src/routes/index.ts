import { Router } from "express";
import { getTrigger } from "../controllers/trigger.js";
import { getBaseline, postBaseline } from "../controllers/baseline.js";

const router = Router()

router.route('/trigger')
     .get(getTrigger)

router.route('/baseline')
     .get(getBaseline)
     .post(postBaseline)

router.route('/config')
     .get(getBaseline)
     .post(postBaseline)

export default router
