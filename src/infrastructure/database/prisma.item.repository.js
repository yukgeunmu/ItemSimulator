import { prisma } from '../utils/index';
import { ItemRepository } from '../../domain/repositories/item.repository';
import { Item } from '../../domain/entities/item.entity.js';

//Prisma 데이터 객체를 Item 엔티티로 변환하는 헬퍼 함수
// 데이ㅓ베이스의 구조와 도메인 모델 사이의 관계를 분리하는 역할
const itemToEntity = (prismaItem) => {
  if (!prismaItem) return null;
  return new Item({
    itemId: prismaItem.itemId,
    itemName: prismaItem.itemName,
    itemStat: prismaItem.itemStat,
    itemPrice: prismaItem.itemPrice,
    isEquip: prismaItem.isEquip,
    ItemType: prismaItem.itemType,
  });
};

export class PrismaItemRepository extends ItemRepository {
  findById = async (itemId) => {
    const item = await prisma.items.findUnique({
      where: { itemId },
      select: {
        itemId: true,
        itemName: true,
        itemStat: true,
        itemPrice: true,
        itemType: true,
      },
    });

    return itemToEntity(item);
  };

  findAll = async () => {
    const items = await prisma.items.findMany({
      select: {
        itemId: true,
        itemName: true,
        itemPrice: true,
        itemType: true,
      },
    });

    return items.map(itemToEntity);
  };
}
