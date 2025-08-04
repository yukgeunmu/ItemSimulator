import { prisma } from '../utils/index';
import { CharacterRepository } from '../../domain/repositories/charater.repository';
import { Character } from '../../domain/entities/character.entity';
import { Prisma } from '@prisma/client';

const characterToEntity = (prismaCharacter) => {
  return new Character(prismaCharacter);
};

export class PrismaCharacterRepository extends CharacterRepository {
  // 캐릭터 조회
  findById = async (characterId) => {
    const character = await prisma.character.findUnique({
      where: { characterId },
      select: {
        characterId: true,
        charactername: true,
        health: true,
        power: true,
        money: true,
      },
    });

    return characterToEntity(character);
  };

  // 해당 계정 캐릭터 조회
  findAllByAccountId = async (accountId) => {
    const characterToAccount = await prisma.character.findMany({
      where: { accountId },
      select: {
        characterId: true,
        charactername: true,
        health: true,
        power: true,
        money: true,
      },
    });

    return characterToAccount.map(characterToEntity);
  };

  // 캐릭터 생성
  create = async (accountId, characterEntity) => {
    const createCharacter = await prisma.$transaction(
      async (tx) => {
        const character = await tx.character.create({
          data: {
            charactername: characterEntity.charactername,
            health: characterEntity.characterEntity.health,
            power: characterEntity.power,
            money: 100000,
            profileImage: '',
            account: {
              connect: {
                accountId: accountId,
              },
            },
          },
        });

        await tx.inventory.create({
          data: {
            characterId: character.characterId,
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      },
    );
    return characterToEntity(createCharacter);
  };

  // 캐릭터 삭제
  delete = async (characterId) => {
    const character = await prisma.character.delete({
      where: { characterId },
    });

    return characterToEntity(character);
  };
}
