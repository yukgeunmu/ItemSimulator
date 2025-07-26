import express from "express";
import cookieParser from "cookie-parser";
import UsersRouter from "./route/user.router.js";
import ItemRouter from "./route/item.router.js";
import BuyRouter from "./route/buy.router.js";
import InventoryRouter from "./route/inventory.router.js"
import EquipmentRouter from "./route/equipment.router.js"
import SellRouter from "./route/sell.router.js"

const app = express();
const PORT = 3018;


app.use(express.json());
app.use(cookieParser());


app.use("/api", [UsersRouter, ItemRouter, BuyRouter, InventoryRouter, EquipmentRouter, SellRouter]);

app.listen(PORT, () => {
  console.log(PORT, "포트로 서버가 열렸어요!");
});
