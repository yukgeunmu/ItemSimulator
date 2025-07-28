import express from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import characterValidationMiddleware from '../middleware/character.middleware.js';
import { prisma } from '../utils/prisma/index.js';
import { HttpError } from '../utils/prisma/HttpError.js';

const router = express.Router();

// 캐릭터 생성 API
router.post('/character', authMiddleware, async (req, res, next) => {
  const { charactername } = req.body;
  const account = req.user;

  const characters = await prisma.character.findFirst({
    where: { charactername },
  });

  if (characters) throw new HttpError('존재하는 캐릭터 닉네임 입니다.', 404);

  await prisma.$transaction(async (tx) => {
    const character = await tx.character.create({
      data: {
        charactername,
        health: 500,
        power: 100,
        money: 10000,
        profileImage: '',
        account: {
          connect: {
            accountId: account.accountId,
          },
        },
      },
    });

    await tx.inventory.create({
      data: {
        characterId: character.characterId,
      },
    });
  });

  return res.status(201).json({ message: '캐릭터가 생성되었습니다.' });
});

// 캐릭터 삭제 API
router.delete(
  '/character/:characterId',
  authMiddleware,
  characterValidationMiddleware,
  async (req, res, next) => {
    const character = req.character;

    await prisma.character.delete({
      where: { characterId: character.characterId },
    });

    return res
      .status(200)
      .json({ message: `캐릭터 ${character.charactername}(을)를 삭제하였습니다.` });
  },
);

//캐릭터 상세 조회 API
router.get('/character/:characterId', authMiddleware, async (req, res, next) => {
  const { characterId } = req.params;
  const account = req.user;
  let data;

  const isExistCharacter = await prisma.character.findFirst({
    where: { characterId: +characterId },
  });

  if (!isExistCharacter) throw new HttpError('캐릭터 조회에 실패하였습니다.', 404);

  if (account.accountId !== isExistCharacter.accountId) {
    data = await prisma.character.findFirst({
      where: { characterId: +characterId },
      select: {
        charactername: true,
        health: true,
        power: true,
      },
    });

    return res.status(200).json({ data: data });
  } else {
    data = await prisma.character.findFirst({
      where: { characterId: +characterId },
      select: {
        charactername: true,
        health: true,
        power: true,
        money: true,
      },
    });
    return res.status(200).json({ data: data });
  }
});

export default router;
