import { prisma } from "../database";
import { User } from "../generated/prisma/client";

export function findUserByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
}

export function createUser(
    email: string,
    username: string,
    password: string
): Promise<User> {
    return prisma.user.create({
        data: { email, username, password },
    });
}
