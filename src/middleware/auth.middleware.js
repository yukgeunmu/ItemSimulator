import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma/index.js';
import dotenv from 'dotenv';
import { HttpError } from '../utils/prisma/HttpError.js';

dotenv.config();

export default async function (req, res, next) {
  try {
    const { accessToken } = req.cookies;

    if (!accessToken) throw new HttpError('토큰이 존재하지 않습니다.', 409);

    const [tokenType, token] = accessToken.split(' ');

    if (tokenType !== 'Bearer') throw new HttpError('토큰 타입이 일치하지 않습니다.', 404);

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET_KEY);
    const userId = decodedToken.userId;

    const user = await prisma.account.findFirst({
      where: { userId: userId },
    });

    if (!user) {
      res.clearCookie('authorization');
      throw new HttpError('토큰 사용자가 존재하지 않습니다.', 404);
    }

    req.user = user;
    next();
  } catch (error) {
    // res.clearCookie("authorization");

    // 토큰이 만료되었거나, 조작되었을 때, 에러 메시지를 다르게 출력합니다.
    switch (error.name) {
      case 'TokenExpiredError':
        return  next(new HttpError('토큰이 만료되었습니다.', 401)); 
      case 'JsonWebTokenError':
                return  next(new HttpError( '토큰이 조작되었습니다.', 401)); 
      default:
        return next(error);
    }
  }
}
