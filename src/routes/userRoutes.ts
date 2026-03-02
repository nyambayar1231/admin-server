import { Hono } from "hono";
import { UserController } from "../controllers/userController.js";
import { authMiddleware } from "../middleware/auth.js";

const userRoutes = new Hono();
const userController = new UserController();

userRoutes.post("/", userController.createUser);
userRoutes.post("/login", userController.login);
userRoutes.post("/logout", authMiddleware, userController.logout);
userRoutes.post("/refresh", userController.refresh);
userRoutes.get("/me", authMiddleware, userController.me);
userRoutes.get("/:username", userController.getUserByUsername);

export default userRoutes;
