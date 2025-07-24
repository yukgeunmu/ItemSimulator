import express from 'express';
import authMiddlewate from '../middleware/auth.middlewate.js';
import jwt from 'jsonwebtoken';
import bcrpyt from 'bcrypt';
import { prisma, IsValidInput } from '../utils/prisma/index.js';
import { Prisma } from '@prisma/client';

const router = express.Router();

// - 아이디, 비밀번호, 비밀번호 확인, 이름을 데이터로 넘겨서 회원가입을 요청합니다.
//     - 보안을 위해 비밀번호는 평문(Plain Text)으로 저장하지 않고 해싱된 값을 저장합니다.
// - 아래 사항에 대한 **유효성 체크**를 해야 되며 유효하지 않은 경우 알맞은 HTTP 상태코드와 에러 메세지를 반환해야 합니다.
//     - **아이디**: 다른 사용자와 중복될 수 없으며 오로지 **영어 소문자 + 숫자 조합**으로 구성이 되어야 합니다.
//     - **비밀번호:** 최소 6자 이상이며, 비밀번호 확인과 일치해야 합니다.
// - 회원가입 성공 시, 비밀번호를 제외 한 사용자의 정보를 반환합니다.

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

    return res.status(200).json({message:"회원가입이 완료되었습니다."});
  } catch (err) {
    next(err);
  }
});

export default router;
