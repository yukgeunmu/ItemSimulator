import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddlewate from '../middleware/auth.middlewate.js';
import { characterValidationMiddleware } from '../middleware/character.middleware.js';

const router = express.Router();


router.patch('/money/:characterId', authMiddlewate,characterValidationMiddleware, async (req, res, next) => {

  const character = req.character;

  const curretMoney = await prisma.character.findFirst({
    where: { characterId: character.characterId },
    select: {
      money: true,
    },
  });

  const addMoney = curretMoney.money + 100;

  const result = await prisma.character.update({
    where: { characterId: character.characterId },
    data: {
      money: addMoney,
    },
  });

  return res.status(200).json({ message: `돈을 100원 벌었습니다.(잔액:${result.money})` });

});

export default router;
