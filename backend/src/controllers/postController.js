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
    const posts = await prisma.post.findMany({
        where: {
        OR: [
            { isPrivate: false },
            { authorId: req.user.id }, // private visible to author only
        ],
        },
        orderBy: { createdAt: "desc" }, // newer posts first
        include: {
        author: { select: { id:true, firstName: true, lastName: true } },
        likes: true,
        comments: {
            include: {
            author: { select: { firstName:true, lastName:true } },
            likes: true,
            replies: {
                include: {
                author: { select: { firstName:true, lastName:true } },
                likes: true,
                },
                orderBy: { createdAt: "asc" },
            },
            },
            orderBy: { createdAt: "asc" },
        },
        },
    });

    res.json({ posts });
};
