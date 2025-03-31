import express from 'express';
import ferryRoutes from './ferryRoutes';
import authRoutes from './authRoute';

const router = express.Router();

router.use("/ferry", ferryRoutes);
router.use("/", authRoutes);

export default router;