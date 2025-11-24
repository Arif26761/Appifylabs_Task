import { prisma } from "../lib/prisma.js";


// COMMENT CONTROLL
export const createComment = async (req, res) => {
    const { postId, content } = req.body;
    const comment = await prisma.comment.create({
        data: { postId, content, authorId: req.user.id },
        include: {
            author: { select: { firstName:true, lastName:true }},
            likes: true,
            replies: true,
        },
    });
    res.json({ comment });
}