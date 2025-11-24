import { Router } from "express"
import { requireAuth } from "../middleware/authenticate.js";
import { login, logout, me, register } from "../controllers/authController.js";

const authRoutes = Router();

authRoutes.post("/register", register);
authRoutes.post("/login", login);
authRoutes.get('/me', requireAuth, me);
authRoutes.post("/logout", logout);

export default authRoutes;