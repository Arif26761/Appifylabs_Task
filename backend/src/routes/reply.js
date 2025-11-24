import { Router } from "express"
import { requireAuth } from "../middleware/authenticate.js";
import { createReply } from "../controllers/replyController.js";

const replyRoutes = Router();

replyRoutes.post("/", requireAuth, createReply)

export default replyRoutes;