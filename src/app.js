import express from 'express';
import cookieParser from 'cookie-parser';
import UsersRouter from './route/user.router.js';
import ItemRouter from './route/item.router.js';
import TradeRouter from './route/trade.router.js';
import InventoryRouter from './route/inventory.router.js';
import EquipmentRouter from './route/equipment.router.js';
import MoneyRouter from './route/money.router.js';
import ErrorMiddleware from './middleware/error.middleware.js';
import CharacterRouter from './route/character.router.js';

const app = express();
const PORT = 3018;

app.use(express.json());
app.use(cookieParser());
app.use('/api', [
  UsersRouter,
  ItemRouter,
  TradeRouter,
  InventoryRouter,
  EquipmentRouter,
  MoneyRouter,
  CharacterRouter,
]);
app.use(ErrorMiddleware);

app.listen(PORT, () => {
  console.log(PORT, '포트로 서버가 열렸어요!');
});
