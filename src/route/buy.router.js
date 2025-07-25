import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddlewate from '../middleware/auth.middlewate.js';
import { Prisma } from '@prisma/client';

const router = express.Router();

router.patch('/buy/:characterId', authMiddlewate, async (req, res, next) => {
  const { characterId } = req.params;
  const account = req.user;
  const boughtItem = req.body;

  const isExistCharacter = await prisma.character.findFirst({
    where: { characterId: +characterId },
  });

  if (!isExistCharacter) {
    return res.status(404).json({ message: '캐릭터 조회에 실패하였습니다.' });
  }

  if (account.accountId !== isExistCharacter.accountId) {
    return res.status(409).json({ message: '해당 캐릭터를 소유한 유저가 아닙니다.' });
  }

  await prisma.$transaction(
    async (tx) => {
      let totalPrice = 0;
      let selectedInventory;

      // 캐릭터가 가진 인벤토리 선택
      selectedInventory = await tx.inventory.findFirst({
        where: { characterId: +characterId },
      });

      // 해당 캐릭터에 인벤토리가 없으면 새로 생성
      if (!selectedInventory) {
        selectedInventory = await tx.inventory.create({
          data: {
            characterId: +characterId,
          },
        });
      }

      for (let i = 0; i < boughtItem.length; i++) {
        // 구매 할 아이템을 아이템 목록에서 찾음
        let item = await tx.items.findFirst({
          where: { itemId: boughtItem[i].itemId },
        });

        // 아이템 목록에 구매할 아이템이 없으면 실패 출력
        if (!item) {
          return res.status(404).json({ message: '아이템 조회에 실패 하였습니다.' });
        }

        // 있으면 전체 계산에 더해주기
        totalPrice += item.itemPrice * boughtItem[i].count;

        const isExist = await tx.inventoryItem.findFirst({
          where: {
            inventoryId: selectedInventory.inventoryId,
            itemId: item.itemId,
          },
        });

        if (!isExist) {
          await tx.inventoryItem.create({
            data: {
              inventoryId: selectedInventory.inventoryId,
              itemId: item.itemId,
              quantity: boughtItem[i].count,
            },
          });
        } else {
          await tx.inventoryItem.update({
            where: { inventoryItemId: isExist.inventoryItemId },
            data: {
              quantity:{
                increment: boughtItem[i].count,
              }
            },
          });
        }
      }

      if (isExistCharacter.money < totalPrice) {
        return res
          .status(400)
          .json({ message: `돈이 부족해요.(${totalPrice - isExistCharacter.money})` });
      } else {
        const resultPrice = isExistCharacter.money - totalPrice;

        await tx.character.update({
          where: { characterId: +characterId },
          data: {
            money: resultPrice,
          },
        });
      }
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
    },
  );

  return res.status(200).json({ message: '아이템을 구매하였습니다.' });
});

export default router;
