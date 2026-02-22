import { prisma } from '../database'

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  })
}

export function findUserByUsername(username: string) {
  return prisma.user.findUnique({
    where: { username },
  })
}

export function createUser(
  email: string,
  username: string,
  password: string,
) {
  return prisma.user.create({
    data: {
      email,
      username,
      password,
    },
  })
}