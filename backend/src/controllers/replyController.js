import { prisma } from "../lib/prisma.js";


// REPLY CONTROLL
export const createReply = async (req, res) => {
    const { commentId, content } = req.body;
    const reply = await prisma.reply.create({
        data: { commentId, content, authorId: req.user.id },
        include: { 
            author: { select: { firstName:true, lastName:true}},
            likes: true,
        },
    });
    res.json({ reply });
};