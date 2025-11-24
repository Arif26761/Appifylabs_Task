import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { prisma } from "../lib/prisma.js";

const signToken = (user) => jwt.sign({
    id: user.id,
    email: user.email
}, process.env.JWT_SECRET, {
    expiresIn: "7d"
});

// REGISTER CONTROLL
export const register = async (req, res) => {
    const { firstName, lastName, email, password } = req.body;
    if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({message: "Complete all fields"});
    }
    const exists = await prisma.user.findUnique({ where: {email}});
    if (exists) return res.status(409).json({ message: "Email already registered"});

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
        data: { firstName, lastName, email, password: hashedPassword },
    });

    const token = signToken(user);
    res.cookie("accessToken", token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({ user: { id: user.id, firstName, lastName, email }});
};

// LOGIN CONTROLL
export const login = async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: {email}});
    if(!user) return res.status(401).json({ message: "Invalid credentials"});

    const ok = await bcrypt.compare(password, user.password);
    if(!ok) return res.status(401).json({ message: "Invalid credentials"});

    const token = signToken(user);
    res.cookie("accessToken", token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({ user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
    }});
};

// AUTHENTICATION CONTROLL
export const me = async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { id:true, firstName:true, lastName:true, email:true },
    });
    res.json({ user });
};

// LOGOUT CONTROLL
export const logout = async (_, res) => {
    res.clearCookie("accessToken");
    res.json({ message: "Logged out" });
};
