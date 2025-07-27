import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddlewate from '../middleware/auth.middlewate.js';
import { ItemType, Prisma } from '@prisma/client';
import { characterValidationMiddleware } from '../middleware/character.middleware.js';

const router = express.Router();

// 아이템 장착
router.post(
  '/equip/:characterId',
  authMiddlewate,
  characterValidationMiddleware,
  async (req, res, next) => {
    const { itemId } = req.body;
    const character = req.character;

    const itemToInventory = await prisma.inventoryItem.findFirst({
      where: { inventoryId: character.inventory.inventoryId, itemId: itemId },
      include: {
        item: true,
      },
    });

    if (!itemToInventory) {
      return res.status(404).json({ message: '해당 아이템이 인벤토리에 없습니다.' });
    }

    const isExistEquip = await prisma.equippedItem.findFirst({
      where: {
        OR: [{ itemId }, { slot: itemToInventory.item.itemType }],
      },
    });

    if (isExistEquip) {
      return res.status(409).json({ message: `해당 ${isExistEquip.slot} 슬롯은 장착 중 입니다.` });
    }

    // 아이템 장착 트랜잭션
    await prisma.$transaction(async (tx) => {
      // 장비 장착 테이블 추가
      const created = await tx.equippedItem.create({
        data: {
          characterId: character.characterId,
          itemId: itemId,
          slot: itemToInventory.item.itemType,
        },
      });

      // 장착 아이템 스탯 가져오기
      const equippedItem = await tx.equippedItem.findFirst({
        where: { equippedItemId: created.equippedItemId },
        select: {
          item: {
            select: {
              itemStat: true,
            },
          },
        },
      });

      // 장착 아이템 스탯 할당
      const { health: statHealth = 0, power: statPower = 0 } = equippedItem.item.itemStat;

      // 캐릭터 불러오기
      // const character = await tx.character.findFirst({
      //   where: { characterId: character.characterId },
      //   select: { health: true, power: true },
      // });

      // 캐릭터에 장착 아이템 스탯 반영
      await tx.character.update({
        where: { characterId: character.characterId },
        data: {
          health: character.health + statHealth,
          power: character.power + statPower,
        },
      });

      // 인벤토리에서 수량 줄이기
      const upadateInventoryItem = await tx.inventoryItem.update({
        where: {
          inventoryItemId: itemToInventory.inventoryItemId,
        },
        data: {
          quantity: {
            decrement: 1,
          },
        },
      });

      // 수량 0개 이하면 아이템 삭제
      if (upadateInventoryItem.quantity <= 0) {
        await tx.inventoryItem.delete({
          where: { inventoryItemId: itemToInventory.inventoryItemId },
        });
      }
    });

    return res.status(200).json({ message: '아이템이 장착 되었습니다.' });
  },
);

// 장착 아이템 조회
router.get('/equip/:characterId', async (req, res, next) => {
  const { characterId } = req.params;

  // 장착 테이블에서 아이템 가져오기
  const itemDatas = await prisma.equippedItem.findMany({
    where: { characterId: +characterId },
    select: {
      item: {
        select: {
          itemId: true,
          itemName: true,
        },
      },
    },
  });

  const result = itemDatas.map((data) => {
    return {
      item_code: data.item.itemId,
      item_Name: data.item.itemName,
    };
  });

  return res.status(200).json(result);
});

// 아아팀 탈착 API
router.delete(
  '/equip/:characterId',
  authMiddlewate,
  characterValidationMiddleware,
  async (req, res, next) => {
    const { itemId } = req.body;
    const character = req.character;

    const euippedItem = await prisma.equippedItem.findFirst({
      where: {
        AND: [{ characterId: character.characterId }, { itemId: itemId }],
      },
      include: {
        character: true,
        item: true,
      },
    });

    if (!euippedItem) {
      return res.status(409).json({ message: '장착 중인 아이템이 아닙니다.' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.equippedItem.delete({
        where: { equippedItemId: euippedItem.equippedItemId },
      });

      const { health: statHealth = 0, power: statPower = 0 } = euippedItem.item.itemStat;

      const result = await tx.character.update({
        where: { characterId: character.characterId },
        data: {
          health: character.health - statHealth,
          power: character.power - statPower,
        },
      });

      //
      const isExitItmeToInventory = await tx.inventoryItem.findFirst({
        where: { inventoryId: character.inventory.inventoryId, itemId },
      });

      // 인벤토리에서 수량 늘리기
      if (isExitItmeToInventory) {
        await tx.inventoryItem.update({
          where: { inventoryItemId: isExitItmeToInventory.inventoryItemId },
          data: {
            quantity: {
              increment: 1,
            },
          },
        });
      } else {
        await tx.inventoryItem.create({
          data: {
            inventoryId: character.inventory.inventoryId,
            itemId,
          },
        });
      }
    });

    return res.status(200).json({ message: '아이템이 해제되었습니다.' });
  },
);

export default router;
