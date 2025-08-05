import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddlewate from '../middleware/auth.middleware.js';
import characterValidationMiddleware from '../middleware/character.middleware.js';

const router = express.Router();

router.get(
  '/inventory/:characterId',
  authMiddlewate,
  characterValidationMiddleware,
  async (req, res, next) => {
    const character = req.character;

    const inventoryData = await prisma.inventoryItem.findMany({
      where: { inventoryId: character.inventory.inventoryId },
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
  },
);

export default router;
