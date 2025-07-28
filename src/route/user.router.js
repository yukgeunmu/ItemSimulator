import express from 'express';
import authMiddlewate from '../middleware/auth.middleware.js';
import jwt from 'jsonwebtoken';
import bcrpyt from 'bcrypt';
import { prisma, IsValidInput, ErrorFormat } from '../utils/prisma/index.js';
import { Prisma } from '@prisma/client';
import dotenv from 'dotenv';

const router = express.Router();

// 회원가입 API
router.post('/sign-up', async (req, res, next) => {
  try {
    const { userId, password, passwordCheck, name } = req.body;

    const isExistUserId = await prisma.account.findFirst({
      where: { userId },
    });

    if (isExistUserId) {
      ErrorFormat('이미 존재하는 아이디 입니다.', 409);
    }

    if (!IsValidInput(userId)) {
      ErrorFormat('아디디 형식이 맞지 않습니다.', 422);
    }

    if (password.length < 6) {
      ErrorFormat('비밀번호가 6자 미만입니다.', 422);
    }

    if (password !== passwordCheck) {
      ErrorFormat('입력하신 비밀번호가 확인 비밀번호와 일치하지않습니다.', 400);
    }

    const hashedPassword = await bcrpyt.hash(password, 10);

    await prisma.$transaction(
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

  if (!user) ErrorFormat('존재하지 않는 계정 입니다.', 409);

  if (!(await bcrpyt.compare(password, user.password)))
    ErrorFormat('비밀번호가 일치하지 않습니다.', 401);

  const accessToken = jwt.sign(
    {
      userId: user.userId,
    },
    process.env.ACCESS_TOKEN_SECRET_KEY,
    { expiresIn: '10s' },
  );

  const refreshToken = jwt.sign(
    {
      userId: user.userId,
    },
    process.env.REFRESH_TOKEN_SECRET_KEY,
    { expiresIn: '7d' },
  );

  await prisma.account.update({
    where: { userId },
    data: {
      refreshToken,
    },
  });

  res.cookie('accessToken', `Bearer ${accessToken}`);
  res.cookie('refreshToken', `Bearer ${refreshToken}`);

  return res.status(200).json({ message: '로그인 성공' });
});

// 토큰 재발급
router.get('/refresh', async (req, res, next) => {
  const { refreshToken } = req.cookies;

  const [tokenType, token] = refreshToken.split(' ');

  if (tokenType !== 'Bearer') throw Error('토큰 타입이 일치하지 않습니다.');

  const decodedToken = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET_KEY);
  const userId = decodedToken.userId;

  const user = await prisma.account.findFirst({
    where: { userId },
  });

  if (!user) ErrorFormat('토큰 사용자가 없습니다.', 404);

  const newAccessToken = jwt.sign({ userId: userId }, process.env.ACCESS_TOKEN_SECRET_KEY, {
    expiresIn: '10s',
  });

  res.cookie('accessToken', `Bearer ${newAccessToken}`);

  return res.json({message:'Access 토큰을 새롭게 발급했습니다.'});

});

export default router;
