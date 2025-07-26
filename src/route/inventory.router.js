import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddlewate from '../middleware/auth.middlewate.js';
import { Prisma } from '@prisma/client';

const router = express.Router();

router.get('/inventory/:characterId', authMiddlewate, async (req, res, next) => {
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

  let inventory = await prisma.inventory.findFirst({
    where: { characterId: +characterId },
  });

  if (!inventory) {
    inventory = await prisma.inventory.create({
      data: {
        characterId: +characterId,
      },
    });
  }

  const inventoryData = await prisma.inventoryItem.findMany({
    where: { inventoryId: inventory.inventoryId },
    select: {
      item: {
        select: {
          itemId: true,
          itemName: true,
        },
      },
      quantity: true,
    },
  });

  const result = inventoryData.map((data) => {
    return {
      item_code: data.item.itemId,
      item_name: data.item.itemName,
      count: data.quantity,
    };
  });

  return res.status(200).json(result);
});

export default router;
