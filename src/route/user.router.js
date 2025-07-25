import express from 'express';
import authMiddlewate from '../middleware/auth.middlewate.js';
import jwt from 'jsonwebtoken';
import bcrpyt from 'bcrypt';
import { prisma, IsValidInput } from '../utils/prisma/index.js';
import { Prisma } from '@prisma/client';

const router = express.Router();

// 회원가입 API
router.post('/sign-up', async (req, res, next) => {
  try {
    const { userId, password, passwordCheck, name } = req.body;

    const isExistUserId = await prisma.account.findFirst({
      where: { userId },
    });

    if (isExistUserId) {
      return res.status(409).json({ message: '이미 존재하는 아이디 입니다.' });
    }

    if (!IsValidInput(userId)) {
      return res.status(422).json({ message: '아디디 형식이 맞지 않습니다.' });
    }

    if (password.length < 6) {
      return res.status(422).json({ message: '비밀번호가 6자 미만입니다.' });
    }

    if (password !== passwordCheck) {
      return res
        .status(400)
        .json({ message: '입력하신 비밀번호가 확인 비밀번호와 일치하지않습니다.' });
    }

    const hashedPassword = await bcrpyt.hash(password, 10);

    const [account] = await prisma.$transaction(
      async (tx) => {
        const account = await tx.account.create({
          data: {
            userId,
            password: hashedPassword,
            name,
          },
        });

        return [account];
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      },
    );

    return res.status(200).json({ message: '회원가입이 완료되었습니다.' });
  } catch (err) {
    next(err);
  }
});

// 로그인 API
router.post('/sign-in', async (req, res, next) => {
  const { userId, password } = req.body;

  const user = await prisma.account.findFirst({ where: { userId } });

  if (!user) return res.status(409).json({ message: '존재하지 않는 이메일 입니다.' });

  if (!(await bcrpyt.compare(password, user.password)))
    return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });

  const token = jwt.sign(
    {
      userId: user.userId,
    },
    'custom-secret-key',
  );

  res.cookie('authorization', `Bearer ${token}`);

  return res.status(200).json({ message: '로그인 성공' });
});

// 캐릭터 생성 API
router.post('/character', authMiddlewate, async (req, res, next) => {
  const { charactername } = req.body;
  const account = req.user;

  const characters = await prisma.character.findFirst({
    where: { charactername },
  });

  if (characters) return res.status(404).json({ message: '존재하는 캐릭터 닉네임 입니다.' });

  await prisma.character.create({
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

  return res.status(201).json({ message: '캐릭터가 생성되었습니다.' });
});

// 캐릭터 삭제 API
router.delete('/character/:characterId', authMiddlewate, async (req, res, next) => {
  const account = req.user;
  const { characterId } = req.params;

  const isExistCharacter = await prisma.character.findFirst({
    where: { characterId: +characterId },
  });

  if (!isExistCharacter) {
    return res.status(404).json({ message: '캐릭터 조회에 실패하였습니다.' });
  }

  if (account.accountId !== isExistCharacter.accountId) {
    return res.status(404).json({ message: '해당 캐릭터를 소유한 유저가 아닙니다.' });
  }

  await prisma.character.delete({
    where: { characterId: +characterId },
  });

  return res
    .status(404)
    .json({ message: `캐릭터 ${isExistCharacter.charactername}(을)를 삭제하였습니다.` });
});

//캐릭터 상세 조회 API
router.get('/character/:characterId', authMiddlewate, async (req, res, next) => {
  const { characterId } = req.params;
  const account = req.user;
  let data;

  const isExistCharacter = await prisma.character.findFirst({
    where: { characterId: +characterId },
  });

  if (!isExistCharacter) {
    return res.status(404).json({ message: '캐릭터 조회에 실패하였습니다.' });
  }

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
