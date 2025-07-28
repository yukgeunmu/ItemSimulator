import express from 'express';
import cookieParser from 'cookie-parser';
import UsersRouter from './route/user.router.js';
import ItemRouter from './route/item.router.js';
import TradeRouter from './route/trade.router.js';
import InventoryRouter from './route/inventory.router.js';
import EquipmentRouter from './route/equipment.router.js';
import MoneyRouter from './route/money.router.js';
import ErrorMiddleware from './middleware/error.middleware.js';
import CharaterRouter from './route/character.router.js';
import expressSession from 'express-session';
import expressMySQLSession from 'express-mysql-session';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3018;

const MySQLStore = expressMySQLSession(expressSession);

const sessionStore = new MySQLStore({
  user: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT,
  database: process.env.DATABASE_NAME,
  expiration: 1000 * 60 * 60 * 24, // 세션의 만료 기간을 1일로 설정합니다.
  createDatabaseTable: true, // 세션 테이블을 자동으로 생성합니다.
});

app.use(express.json());
app.use(
  expressSession({
    secret: process.env.SESSION_SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
    },
  }),
);
app.use(cookieParser());
app.use('/api', [
  UsersRouter,
  ItemRouter,
  TradeRouter,
  InventoryRouter,
  EquipmentRouter,
  MoneyRouter,
  CharaterRouter,
]);
app.use(ErrorMiddleware);

app.listen(PORT, () => {
  console.log(PORT, '포트로 서버가 열렸어요!');
});
