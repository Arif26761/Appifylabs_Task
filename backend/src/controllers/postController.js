import cloudinary from "../lib/cloudinary.js"
import { prisma } from "../lib/prisma.js";


// CREATE POST CONTROLL
export const createPost = async (req, res) => {
    const { content, isPrivate } = req.body;

    let imageUrl = null;
    if (req.file) {
        const b64 = Buffer.from(req.file.buffer).toString("base64");
        const dataUri = `data:${req.file.mimetype};base64,${b64}`;
        const uploadRes = await cloudinary.uploader.upload(dataUri, {
            folder: "appifylab_posts",
        });
        imageUrl = uploadRes.secure_url;
    }
    const post = await prisma.post.create({
        data: { 
            authorId: req.user.id, 
            content, 
            imageUrl, 
            isPrivate: isPrivate === "true"
        }, 
        include: {
            author: { select: { firstName:true, lastName:true }},
        },
    });
    res.json({ post });
};

// POST LIST CONTROLL
export const listPosts = async (req, res) => {
  try {
    const userId = req.user?.id ?? null;

    // 1) Fetch posts + nested comments + replies (no likes include)
    const posts = await prisma.post.findMany({
      where: {
        OR: [
          { isPrivate: false },
          ...(userId ? [{ authorId: userId }] : []),
        ],
      },
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
        comments: {
          include: {
            author: { select: { id: true, firstName: true, lastName: true } },
            replies: {
              include: {
                author: { select: { id: true, firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    });

    // 2) Collect all IDs to fetch likes for (posts, comments, replies)
    const postIds = posts.map(p => p.id);
    const commentIds = [];
    const replyIds = [];
    posts.forEach(p => {
      (p.comments || []).forEach(c => {
        commentIds.push(c.id);
        (c.replies || []).forEach(r => replyIds.push(r.id));
      });
    });
    const allIds = [...postIds, ...commentIds, ...replyIds];

    // If no ids, just return posts with empty likes arrays
    if (allIds.length === 0) {
      const normalizedEmpty = posts.map(p => ({
        ...p,
        likes: [],
        comments: (p.comments || []).map(c => ({ ...c, likes: [], replies: c.replies || [] })),
      }));
      return res.json({ posts: normalizedEmpty });
    }

    // 3) Fetch likes for all targets in one query
    const likes = await prisma.like.findMany({
      where: { targetId: { in: allIds } },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    });

    // 4) Group likes by targetId
    const likesMap = likes.reduce((acc, like) => {
      if (!acc[like.targetId]) acc[like.targetId] = [];
      acc[like.targetId].push({
        id: like.id,
        user: like.user,
        createdAt: like.createdAt,
        targetType: like.targetType,
      });
      return acc;
    }, {});

    // 5) Attach likes to posts, comments, replies and sort comments/replies
    const normalized = posts.map((p) => {
      const pLikes = likesMap[p.id] || [];

      const sortedComments = (p.comments || [])
        .slice()
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        .map((c) => {
          const cLikes = likesMap[c.id] || [];
          const sortedReplies = (c.replies || [])
            .slice()
            .sort((ra, rb) => new Date(ra.createdAt) - new Date(rb.createdAt))
            .map((r) => {
              return { ...r, likes: likesMap[r.id] || [] };
            });

          return { ...c, likes: cLikes, replies: sortedReplies };
        });

      return { ...p, likes: pLikes, comments: sortedComments };
    });

    return res.json({ posts: normalized });

  } catch (err) {
    console.error("List posts error:", err);
    return res.status(500).json({
      message: "Failed to list posts",
      error: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
};
