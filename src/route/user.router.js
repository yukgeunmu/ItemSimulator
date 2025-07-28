import express from 'express';
import dotenv from 'dotenv';
import userService from '../services/user.service.js';

dotenv.config();

const router = express.Router();

// 회원가입 API
router.post('/sign-up', async (req, res, next) => {
  try {
    const userInfo = req.body;

    await userService.signUp(userInfo);

    return res.status(200).json({ message: '회원가입이 완료되었습니다.' });
  } catch (err) {
    next(err);
  }
});

// 로그인 API
router.post('/sign-in', async (req, res, next) => {
  const { userId, password } = req.body;

  const { accessToken, refreshToken } = await userService.signIn(userId, password);

  res.cookie('accessToken', `Bearer ${accessToken}`);
  res.cookie('refreshToken', `Bearer ${refreshToken}`);

  return res.status(200).json({ message: '로그인 성공' });
});

// 토큰 재발급
router.get('/refresh', async (req, res, next) => {
  const { refreshToken } = req.cookies;

  const newAccessToken = userService.refresh(refreshToken);

  res.cookie('accessToken', `Bearer ${newAccessToken}`);

  return res.json({ message: 'Access 토큰을 새롭게 발급했습니다.' });
});

export default router;
