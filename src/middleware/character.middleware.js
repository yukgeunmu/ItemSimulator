import { prisma } from '../utils/prisma/index.js';

export const characterValidationMiddleware = async (req, res, next) => {
  const { characterId } = req.params;
  const account = req.user;

  try {
    if (!characterId) {
      return res.status(400).json({ message: 'characterId가 필요합니다.' });
    }

    const character = await prisma.character.findFirst({
      where: { characterId: +characterId },
      include: {
        inventory: true,
      },
    });

    if (!character) {
      return res.status(404).json({ message: '캐릭터 조회에 실패하였습니다.' });
    }

    if (account.accountId !== character.accountId) {
      return res.status(403).json({ message: '해당 캐릭터에 대한 권한이 없습니다.' });
    }

    // 검증을 통과하면 character 정보를 req 객체에 담아 다음 미들웨어로 전달
    req.character = character;
    next();
  } catch (error) {
    next(error);
  }
};
