import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddlewate from '../middleware/auth.middlewate.js';
import { ItemType, Prisma } from '@prisma/client';

const router = express.Router();

router.post('/equip/:characterId', authMiddlewate, async (req, res, next) => {
  const { characterId } = req.params;
  const account = req.user;
  const { itemId } = req.body;

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
    inventory = await tx.inventory.create({
      data: {
        characterId: +characterId,
      },
    });
  }

  const isExistInventory = await prisma.inventoryItem.findFirst({
    where: { inventoryId: inventory.inventoryId, itemId: itemId },
  });

  if (!isExistInventory) {
    return res.status(404).json({ message: '해당 아이템이 인벤토리에 없습니다.' });
  }

  const isExistEquip = await prisma.equippedItem.findFirst({
    where: { itemId: itemId },
  });

  if (isExistEquip) {
    return res.status(409).json({ message: '장착 중 입니다.' });
  }

  const item = await prisma.items.findFirst({
    where: { itemId },
  });

  // 아이템 장착
  await prisma.$transaction(async (tx) => {
    const created = await tx.equippedItem.create({
      data: {
        characterId: +characterId,
        itemId: itemId,
        slot: item.itemType,
      },
    });

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

    const { health: statHealth = 0, power: statPower = 0 } = equippedItem.item.itemStat;

    const character = await tx.character.findFirst({
      where: { characterId: +characterId },
      select: { health: true, power: true },
    });

    await tx.character.update({
      where: { characterId: +characterId },
      data: {
        health: character.health + statHealth,
        power: character.power + statPower,
      },
    });

    // 인벤토리에서 수량 줄이기
    const upadateInventoryItem = await tx.inventoryItem.update({
      where: {
        inventoryItemId: isExistInventory.inventoryItemId,
      },
      data: {
        quantity: {
          decrement: 1,
        },
      },
    });

    if (upadateInventoryItem.quantity <= 0) {
      await tx.inventoryItem.delete({
        where: { inventoryItemId: isExistInventory.inventoryItemId },
      });
    }
  });

  return res.status(200).json({ message: '아이템이 장착 되었습니다.' });
});

router.delete('/equip', async (req, res, next) => {
  const { equippedItemId } = req.body;

  await prisma.equippedItem.delete({
    where: { equippedItemId },
  });
});

export default router;
