import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddlewate from '../middleware/auth.middleware.js';
import { characterValidationMiddleware } from '../middleware/character.middleware.js';
import ItemService from '../services/item.service.js';

const router = express.Router();

// 아이템 장착
router.post(
  '/equip/:characterId',
  authMiddlewate,
  characterValidationMiddleware,
  async (req, res, next) => {
    try {
      const { itemId } = req.body;
      const character = req.character;

      await ItemService.equippedItmes(character, itemId);

      return res.status(200).json({ message: '아이템이 장착 되었습니다.' });
    } catch (err) {
      next(err);
    }
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
    try {
      const { itemId } = req.body;
      const character = req.character;

      await ItemService.equipmentRemove(character, itemId);

      return res.status(200).json({ message: '아이템이 해제되었습니다.' });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
