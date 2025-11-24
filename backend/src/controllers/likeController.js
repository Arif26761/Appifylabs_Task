import { prisma } from "../lib/prisma.js";


// LIKE BUTTON CONTROLL
export const toggleLike = async (req, res) => {
    const { targetType, targetId } = req.body;
    const existing = await prisma.like.findUnique({
        where: {
            userId_targetId_targetType: {
                userId: req.user.id,
                targetId,
                targetType,
            },
        },
    });

    if(existing) {
        await prisma.like.delete({ where: { id: existing.id }});
        return res.json({ liked: false });
    }
    await prisma.like.create({
        data: { userId: req.user.id, targetId, targetType },
    });
    res.json({ liked: true });
};

// LIKES LIST CONTROLL
export const listLikes = async (req, res) => {
    const { targetType, targetId } = req.query;

    const likes = await prisma.like.findMany({
        where: { targetType, targetId },
        include: { user: { select: { id:true, firstName:true, lastName:true }}},
    });
    res.json({ likes });
};
