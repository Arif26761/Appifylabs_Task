import { prisma } from "../lib/prisma.js";


// COMMENT CONTROLL
export const createComment = async (req, res) => {
  try {
    // Auth guard
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized - login required" });
    }

    const { postId, content } = req.body;

    // Validation
    if (!postId || typeof postId !== "string") {
      return res.status(400).json({ message: "Invalid or missing postId" });
    }
    if (!content || typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ message: "Comment content is required" });
    }

    // Confirm post exists & visibility
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true, isPrivate: true },
    });
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    if (post.isPrivate && post.authorId !== req.user.id) {
      return res.status(403).json({ message: "Cannot comment on private post" });
    }

    // Create comment - only include fields that exist on Comment model
    const comment = await prisma.comment.create({
      data: {
        postId,
        content,
        authorId: req.user.id,
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
        // Do NOT include 'likes' or other non-existent relation fields here.
        // If you need likes, fetch them separately via prisma.like.findMany(...)
        replies: {
          include: {
            author: { select: { id: true, firstName: true, lastName: true } }
          }
        }
      },
    });

    return res.status(201).json({ comment });

  } catch (err) {
    console.error("createComment error:", err);
    return res.status(500).json({
      message: "Failed to create comment",
      error: err.message,
      name: err.name,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
};