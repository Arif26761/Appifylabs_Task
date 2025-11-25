import { prisma } from "../lib/prisma.js";


// REPLY CONTROLL
export const createReply = async (req, res) => {
  try {
    // Auth guard
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized - login required" });
    }

    const { commentId, content } = req.body;

    // Input validation
    if (!commentId || typeof commentId !== "string") {
      return res.status(400).json({ message: "Invalid or missing commentId" });
    }
    if (!content || typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ message: "Reply content is required" });
    }

    // Ensure the comment exists and belongs to a post (optional checks)
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, postId: true },
    });
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Create reply - include only safe fields that exist in schema
    const reply = await prisma.reply.create({
      data: {
        commentId,
        content,
        authorId: req.user.id,
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
        // do NOT include 'likes' or other fields that may not exist in schema
      },
    });

    return res.status(201).json({ reply });
  } catch (err) {
    console.error("createReply error:", err);
    return res.status(500).json({
      message: "Failed to create reply",
      error: err.message,
      name: err.name,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
};