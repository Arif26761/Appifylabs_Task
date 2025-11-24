import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import postRoutes from "./routes/post.js";
import commentRoutes from "./routes/comment.js";
import replyRoutes from "./routes/reply.js";
import likeRoutes from "./routes/like.js";

dotenv.config();
const app = express();

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// API ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/replies", replyRoutes);
app.use("/api/likes", likeRoutes);

app.get("/", (_, res) => res.send("API running"));

app.listen(process.env.PORT, () =>
    console.log(`Server running on port ${process.env.PORT}`)
)