import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddlewate from '../middleware/auth.middlewate.js';
import { Prisma } from '@prisma/client';
import { characterValidationMiddleware } from '../middleware/character.middleware.js';

const router = express.Router();

router.delete(
  '/sell/:characterId',
  authMiddlewate,
  characterValidationMiddleware,
  async (req, res, next) => {
    const sellItem = req.body;
    const character = req.character;

    await prisma.$transaction(
      async (tx) => {
        let totalPrice = 0;

        for (let i = 0; i < sellItem.length; i++) {
          // 판매 할 아이템을 인벤토리에서 찾음
          const itemToInven = await tx.inventoryItem.findFirst({
            where: { inventory: { characterId: character.characterId }, itemId: sellItem[i].itemId },
            select: {
              inventoryItemId: true,
              itemId: true,
              quantity: true,
              item: {
                select: {
                  itemName: true,
                  itemPrice: true,
                },
              },
            },
          });

          // 아이템 목록에 판매할 아이템이 없으면 실패 출력
          if (!itemToInven) {
            const nullitemName = await tx.items.findFirst({
              where: { itemId: sellItem[i].itemId },
              select: {
                itemName: true,
              },
            });

            return res
              .status(404)
              .json({ message: `인벤토리에 해당 아이템이 없습니다.(${nullitemName.itemName})` });
          }


          // 실패 시 보유 수량 보여주기
          let count;

          if (itemToInven) {
            count = itemToInven.quantity;
          } else {
            count = 0;
          }

          if (itemToInven.quantity < sellItem[i].count) {
            return res.status(404).json({ message: `판매 수량이 많습니다.(보유 수량:${count})` });
          }

          // 전체 계산에 더해주기
          totalPrice += itemToInven.item.itemPrice * 0.6 * sellItem[i].count;

          // 인벤토리에서 갯수만큼 빼주기
          const updatedInven = await tx.inventoryItem.update({
            where: { inventoryItemId: itemToInven.inventoryItemId },
            data: {
              quantity: itemToInven.quantity - sellItem[i].count,
            },
          });

          // 0개 이하면 삭제
          if (updatedInven.quantity <= 0) {
            await tx.inventoryItem.delete({
              where: { inventoryItemId: itemToInven.inventoryItemId },
            });
          }
        }

        const resultPrice = character.money + totalPrice;

        await tx.character.update({
          where: { characterId: character.characterId },
          data: {
            money: resultPrice,
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      },
    );

    return res.status(200).json({ message: '아이템을 판매하였습니다.' });
  },
);

export default router;
