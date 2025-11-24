import { Router } from "express"
import { requireAuth } from "../middleware/authenticate.js";
import { upload } from "../middleware/upload.js";
import { createPost, listPosts } from "../controllers/postController.js";

const postRoutes = Router();

postRoutes.post("/", requireAuth, upload.single("image"), createPost);
postRoutes.get("/", requireAuth, listPosts);

export default postRoutes;