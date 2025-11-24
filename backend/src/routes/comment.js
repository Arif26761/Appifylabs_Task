import { Router } from "express"
import { requireAuth } from "../middleware/authenticate.js";
import { createComment } from "../controllers/commentController.js";

const commentRoutes = Router();

commentRoutes.post("/", requireAuth, createComment);

export default commentRoutes;