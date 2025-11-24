import { Router } from "express"
import { requireAuth } from "../middleware/authenticate.js";
import { listLikes, toggleLike } from "../controllers/likeController.js";

const likeRoutes = Router();

likeRoutes.post("/toggle", requireAuth, toggleLike);
likeRoutes.get("/", requireAuth, listLikes);

export default likeRoutes;