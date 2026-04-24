import { Router, type IRouter } from "express";
import healthRouter from "./health";
import roastsRouter from "./roasts";

const router: IRouter = Router();

router.use(healthRouter);
router.use(roastsRouter);

export default router;
