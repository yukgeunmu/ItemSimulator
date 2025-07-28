import express from 'express';
import authMiddlewate from '../middleware/auth.middleware.js';
import characterValidationMiddleware from '../middleware/character.middleware.js';
import ItemService from '../services/item.service.js';

const router = express.Router();

// 아이템 구매 API
router.patch(
  '/buy/:characterId',
  authMiddlewate,
  characterValidationMiddleware,
  async (req, res, next) => {
    try {
      const boughtItem = req.body;
      const character = req.character;

      await ItemService.buyItems(character, boughtItem);

      return res.status(200).json({ message: '아이템을 구매하였습니다.' });
    } catch (error) {
      next(error);
    }
  },
);

// 아이템 판매 API
router.delete(
  '/sell/:characterId',
  authMiddlewate,
  characterValidationMiddleware,
  async (req, res, next) => {
    try {
      const sellItems = req.body;
      const character = req.character;

      await ItemService.sellItems(character, sellItems);

      return res.status(200).json({ message: '아이템을 판매하였습니다.' });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
