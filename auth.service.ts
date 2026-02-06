import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../env";
import { createUser, findUserByEmail } from "./auth.repository";

interface SignUpPayload {
    email: string;
    username: string;
    password: string;
}

interface SignInPayload {
    email: string;
    password: string;
}

export const signUp = async (payload: SignUpPayload) => {
    const { email, username, password } = payload;

    if (!email || !username || !password) {
        throw { status: 400, message: "Données manquantes." };
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
        throw { status: 409, message: "Email déjà utilisé." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await createUser(email, username, hashedPassword);

    const token = jwt.sign(
        { userId: user.id, email: user.email },
        env.JWT_SECRET,
        { expiresIn: "7d" }
    );

    const { password: _, ...userWithoutPassword } = user;
    return { token, user: userWithoutPassword };
};

export const signIn = async (payload: SignInPayload) => {
    const { email, password } = payload;

    if (!email || !password) {
        throw { status: 400, message: "les Données sont manquantes." };
    }

    const user = await findUserByEmail(email);
    if (!user) {
        throw { status: 401, message: "Les identifiants sont  invalides." };
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
        throw { status: 401, message: "Les identifiants sont invalides." };
    }

    const token = jwt.sign(
        { userId: user.id, email: user.email },
        env.JWT_SECRET,
        { expiresIn: "7d" }
    );

    const { password: _, ...userWithoutPassword } = user;
    return { token, user: userWithoutPassword };
};
