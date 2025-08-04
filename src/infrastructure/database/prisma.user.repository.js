import { prisma } from '../utils/index.js';
import { UserRepository } from '../../domain/repositories/user.repository.js';
import { User } from '../../domain/entities/account.entity.js';

const accountToEntity = (prismaAccount) => {
  if (!prismaAccount) return null;
  return new User({
    accountId: prismaAccount.accountId,
    userId: prismaAccount.userId,
    password: prismaAccount.password,
    name: prismaAccount.name,
    createAt: prismaAccount.createAt,
    updateAt: prismaAccount.updateAt,
    refreshToken: prismaAccount.refreshToken,
  });
};

export class PrismaUserRepository extends UserRepository {
  findById = async (userId) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    return user ? new User(user) : null;
  };

  findByEmail = async (email) => {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    return user ? new User(user) : null;
  };

  createUser = async (userEntity) => {
    const newUser = await prisma.user.create({
      data: {
        email: userEntity.email,
        password: userEntity.password,
        name: userEntity.name,
      },
    });
    return new User(newUser);
  };

  update = async (accountEntity) => {
    const updateeAccount = await prisma.account.update({
      where:{accountId: accountEntity.accountId},
      data:{
        refreshToken: accountEntity.refreshToken,
      }
    });

    return accountToEntity(updateeAccount);
    
  }
}
