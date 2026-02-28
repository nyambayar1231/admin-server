import { Hono } from "hono";
import { UserController } from "../controllers/userController.js";

const userRoutes = new Hono();
const userController = new UserController();

userRoutes.post("/", userController.createUser);
userRoutes.post("/login", userController.login);
userRoutes.get("/:username", userController.getUserByUsername);

export default userRoutes;
