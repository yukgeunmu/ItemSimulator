import express from 'express';
import { prisma } from '../utils/prisma/index.js';

const router = express.Router();

// itemId      Int  @id  @default(autoincrement()) @map("itemId")
// inventoryId Int? @map("inventoryId")
// itemName    String   @map("name")
// itemStat    Json? @map("itemStat")
// itemPrice   Int @map("itemPrice")
// quantity    Int @default(1) @map("quantity")
// createdAt   DateTime  @default(now()) @map("createdAt")
// updatedAt   DateTime @updatedAt @map("updatedAt")

//아이템 생성 API
router.post('/item', async (req, res, next) => {
  const iteminfo = req.body;

  const isExistItem = await prisma.items.findFirst({
    where: { itemName: iteminfo.itemName },
  });

  if (isExistItem) {
    return res.status(409).json({ message: '이미 존재하는 아이템 입니다.' });
  }

  await prisma.items.create({
    data: {
      itemName: iteminfo.itemName,
      itemStat: iteminfo.itemStat,
      itemPrice: iteminfo.itemPrice,
      itemType: iteminfo.itemType,
      isEquip: iteminfo.isEquip,
    },
  });

  return res.status(200).json({ message: '아이템이 생성되었습니다.' });
});

//아이템 수정 API
router.patch('/item/:itemId', async (req, res, next) => {
  const itemInfo = req.body;
  const { itemId } = req.params;

  const getItem = await prisma.items.findFirst({
    where: { itemId: +itemId },
  });

  if (!getItem) {
    return res.status(404).json({ message: '아이템 조회에 실패하였습니다.' });
  }

  if (itemInfo.itemPrice) {
    return res.status(405).json({ message: '가격은 수정 할 수 없습니다.' });
  }

  await prisma.items.update({
    data: {
      ...itemInfo,
    },
    where: { itemId: +itemId },
  });

  return res.status(200).json({ message: '아이템 정보 변경에 성공하였습니다.' });
});

//아이템 목록 조회 API
router.get('/item', async (req, res, next) => {
  const itmeData = await prisma.items.findMany({
    select: {
      itemId: true,
      itemName: true,
      itemPrice: true,
    },
  });

  if (!itmeData) {
    return res.status(404).json({ message: '조회할 아이템이 없습니다.' });
  }

  return res.status(200).json({ data: itmeData });
});

//아이템 상세 조회 API
router.get('/item/:itemId', async (req, res, next) => {
  const { itemId } = req.params;

  const itemData = await prisma.items.findFirst({
    where: { itemId: +itemId },
    select: {
      itemId: true,
      itemName: true,
      itemStat: true,
      itemPrice: true,
    },
  });

  if (!itemData) {
    return res.status(404).json({ message: '조회하는데 실패 하였습니다.' });
  }

  return res.status(200).json({ data: itemData });
});

export default router;
