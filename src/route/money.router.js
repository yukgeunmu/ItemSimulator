import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddlewate from '../middleware/auth.middlewate.js';

const router = express.Router();


router.patch('/money/:characterId', authMiddlewate, async (req, res, next) => {
  const { characterId } = req.params;
  const account = req.user;

  const isExistCharacter = await prisma.character.findFirst({
    where: { characterId: +characterId },
  });

  if (!isExistCharacter) {
    return res.status(404).json({ message: '캐릭터 조회에 실패하였습니다.' });
  }

  if (account.accountId !== isExistCharacter.accountId) {
    return res.status(409).json({ message: '해당 캐릭터를 소유한 유저가 아닙니다.' });
  }

  const curretMoney = await prisma.character.findFirst({
    where: { characterId: +characterId },
    select: {
      money: true,
    },
  });

  let addMoney = curretMoney.money + 100;

  const result = await prisma.character.update({
    where: { characterId: +characterId },
    data: {
      money: addMoney,
    },
  });

  return res.status(200).json({ message: `돈을 100원 벌었습니다.(잔액:${result.money})` });

});

export default router;
