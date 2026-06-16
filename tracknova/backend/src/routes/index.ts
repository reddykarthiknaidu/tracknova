import { Router, type IRouter } from "express";
import healthRouter from "./health";
import transportRouter from "./transport";
import liveRouter from "./live";

const router: IRouter = Router();

router.use(healthRouter);
router.use(liveRouter);
router.use(transportRouter);

export default router;
