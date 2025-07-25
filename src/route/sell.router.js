import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddlewate from '../middleware/auth.middlewate.js';
import { Prisma } from '@prisma/client';

const router = express.Router();


export default router;