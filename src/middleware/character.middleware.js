import { prisma, ErrorFormat } from '../utils/prisma/index.js';

export default async function (req, res, next) {
  const { characterId } = req.params;
  const account = req.user;

  try {
    if (!characterId) {
      ErrorFormat('characterId가 필요합니다.', 400);
    }

    const character = await prisma.character.findFirst({
      where: { characterId: +characterId },
      include: {
        inventory: true,
      },
    });

    if (!character) {
      ErrorFormat('캐릭터 조회에 실패하였습니다.', 404);
    }

    if (account.accountId !== character.accountId) {
      ErrorFormat('해당 캐릭터에 대한 권한이 없습니다.', 403);
    }

    // 검증을 통과하면 character 정보를 req 객체에 담아 다음 미들웨어로 전달
    req.character = character;
    next();
  } catch (error) {
    next(error);
  }
}
