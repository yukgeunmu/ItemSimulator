import express from 'express';
import authMiddlewate from '../middleware/auth.middleware.js';
import jwt from 'jsonwebtoken';
import bcrpyt from 'bcrypt';
import { prisma, IsValidInput, ErrorFormat } from '../utils/prisma/index.js';
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

  if (!user) ErrorFormat('존재하지 않는 계정 입니다.', 409);

  if (!(await bcrpyt.compare(password, user.password)))
    ErrorFormat('비밀번호가 일치하지 않습니다.', 401);

  const token = jwt.sign(
    {
      userId: user.userId,
    },
    'custom-secret-key',
  );

  res.cookie('authorization', `Bearer ${token}`);

  return res.status(200).json({ message: '로그인 성공' });
});

export default router;
