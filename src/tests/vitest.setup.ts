import { mockDeep, DeepMockProxy } from 'vitest-mock-extended'
import { beforeEach, vi } from 'vitest'
import { PrismaClient } from '../generated/prisma/client'
import { prisma } from '../database'

vi.mock('../database', () => ({
  prisma: mockDeep<PrismaClient>(),
}))

export const prismaMock = prisma as Inconnu as DeepMockProxy<PrismaClient>

beforeEach(() => {
  vi.clearAllMocks()
})