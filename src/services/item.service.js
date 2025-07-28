import errorMiddleware from '../middleware/error.middleware.js';
import { prisma } from '../utils/prisma/index.js';
import { Prisma } from '@prisma/client';
import { HttpError } from '../utils/prisma/HttpError.js';

class ItemService {
  // 아이템 구매
  buyItems = async (character, boughtItem) => {
    await prisma.$transaction(
      async (tx) => {
        let totalPrice = 0;

        for (let i = 0; i < boughtItem.length; i++) {
          // 구매 할 아이템을 아이템 목록에서 찾음
          let item = await tx.items.findFirst({
            where: { itemId: boughtItem[i].itemId },
          });

          // 아이템 목록에 구매할 아이템이 없으면 실패 출력
          if (!item) throw new HttpError('아이템 조회에 실패 하였습니다.', 404);

          // 있으면 전체 계산에 더해주기
          totalPrice += item.itemPrice * boughtItem[i].count;

          const isExist = await tx.inventoryItem.findFirst({
            where: {
              inventoryId: character.inventory.inventoryId,
              itemId: item.itemId,
            },
          });

          if (!isExist) {
            await tx.inventoryItem.create({
              data: {
                inventoryId: character.inventory.inventoryId,
                itemId: item.itemId,
                quantity: boughtItem[i].count,
              },
            });
          } else {
            await tx.inventoryItem.update({
              where: { inventoryItemId: isExist.inventoryItemId },
              data: {
                quantity: {
                  increment: boughtItem[i].count,
                },
              },
            });
          }
        }

        if (character.money < totalPrice) {
          throw new HttpError(`돈이 부족해요.(${totalPrice - character.money})`, 400);
        } else {
          const resultPrice = character.money - totalPrice;

          await tx.character.update({
            where: { characterId: character.characterId },
            data: {
              money: resultPrice,
            },
          });
        }
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      },
    );
  };

  // 아이템 판매
  sellItems = async (character, sellItem) => {
    await prisma.$transaction(
      async (tx) => {
        let totalPrice = 0;

        for (let i = 0; i < sellItem.length; i++) {
          // 판매 할 아이템을 인벤토리에서 찾음
          const itemToInven = await tx.inventoryItem.findFirst({
            where: {
              inventory: { characterId: character.characterId },
              itemId: sellItem[i].itemId,
            },
            select: {
              inventoryItemId: true,
              itemId: true,
              quantity: true,
              item: {
                select: {
                  itemName: true,
                  itemPrice: true,
                },
              },
            },
          });

          // 아이템 목록에 판매할 아이템이 없으면 실패 출력
          if (!itemToInven) {
            const nullitemName = await tx.items.findFirst({
              where: { itemId: sellItem[i].itemId },
              select: {
                itemName: true,
              },
            });

            throw new HttpError(`인벤토리에 해당 아이템이 없습니다.(${nullitemName.itemName})`, 404);
          }

          // 판매 수량이 보유 수량 보다 많으면 보유 수량 보여주기
          if (itemToInven.quantity < sellItem[i].count) {
            const count = itemToInven.quantity;
            throw new HttpError(`판매 수량이 많습니다.(보유 수량:${count})`, 404);
          }

          // 전체 판매 값에 추가
          totalPrice += itemToInven.item.itemPrice * 0.6 * sellItem[i].count;

          // 인벤토리에서 갯수만큼 빼주기
          const updatedInven = await tx.inventoryItem.update({
            where: { inventoryItemId: itemToInven.inventoryItemId },
            data: {
              quantity: itemToInven.quantity - sellItem[i].count,
            },
          });

          // 0개 이하면 삭제
          if (updatedInven.quantity <= 0) {
            await tx.inventoryItem.delete({
              where: { inventoryItemId: itemToInven.inventoryItemId },
            });
          }
        }

        // 전체 판매 가격
        const resultPrice = character.money + totalPrice;

        await tx.character.update({
          where: { characterId: character.characterId },
          data: {
            money: resultPrice,
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      },
    );
  };

  // 장비 장착
  equippedItmes = async (character, itemId) => {
    const inventoryItem = await prisma.inventoryItem.findFirst({
      where: { inventoryId: character.inventory.inventoryId, itemId: itemId },
      include: {
        item: true,
      },
    });

    if (!inventoryItem) throw new HttpError('해당 아이템이 인벤토리에 없습니다.', 404);

    const isExistEquip = await prisma.equippedItem.findFirst({
      where: {
        OR: [{ itemId }, { slot: inventoryItem.item.itemType }],
      },
    });

    if (isExistEquip) throw new HttpError(`해당 ${isExistEquip.slot} 슬롯은 장착 중 입니다.`, 409);

    // 아이템 장착 트랜잭션
    await prisma.$transaction(async (tx) => {
      // 장비 장착 테이블 추가
      const created = await tx.equippedItem.create({
        data: {
          characterId: character.characterId,
          itemId: itemId,
          slot: inventoryItem.item.itemType,
        },
      });

      // 장착 아이템 스탯 가져오기
      const equippedItem = await tx.equippedItem.findFirst({
        where: { equippedItemId: created.equippedItemId },
        select: {
          item: {
            select: {
              itemStat: true,
            },
          },
        },
      });

      // 장착 아이템 스탯 할당
      const { health: statHealth = 0, power: statPower = 0 } = equippedItem.item.itemStat;

      // 캐릭터에 장착 아이템 스탯 반영
      await tx.character.update({
        where: { characterId: character.characterId },
        data: {
          health: character.health + statHealth,
          power: character.power + statPower,
        },
      });

      // 인벤토리에서 수량 줄이기
      const upadateInventoryItem = await tx.inventoryItem.update({
        where: {
          inventoryItemId: inventoryItem.inventoryItemId,
        },
        data: {
          quantity: {
            decrement: 1,
          },
        },
      });

      // 수량 0개 이하면 아이템 삭제
      if (upadateInventoryItem.quantity <= 0) {
        await tx.inventoryItem.delete({
          where: { inventoryItemId: inventoryItem.inventoryItemId },
        });
      }
    });
  };

  // 장비 탈착
  equipmentRemove = async (character, itemId) => {
    const euippedItem = await prisma.equippedItem.findFirst({
      where: {
        AND: [{ characterId: character.characterId }, { itemId: itemId }],
      },
      include: {
        character: true,
        item: true,
      },
    });

    if (!euippedItem) throw new HttpError('장착 중인 아이템이 아닙니다.', 409);

    await prisma.$transaction(
      async (tx) => {
        await tx.equippedItem.delete({
          where: { equippedItemId: euippedItem.equippedItemId },
        });

        const { health: statHealth = 0, power: statPower = 0 } = euippedItem.item.itemStat;

        const result = await tx.character.update({
          where: { characterId: character.characterId },
          data: {
            health: character.health - statHealth,
            power: character.power - statPower,
          },
        });

        const isExitItmeToInventory = await tx.inventoryItem.findFirst({
          where: { inventoryId: character.inventory.inventoryId, itemId },
        });

        // 인벤토리에서 수량 늘리기
        if (isExitItmeToInventory) {
          await tx.inventoryItem.update({
            where: { inventoryItemId: isExitItmeToInventory.inventoryItemId },
            data: {
              quantity: {
                increment: 1,
              },
            },
          });
        } else {
          await tx.inventoryItem.create({
            data: {
              inventoryId: character.inventory.inventoryId,
              itemId,
            },
          });
        }
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      },
    );
  };
}

export default new ItemService();
