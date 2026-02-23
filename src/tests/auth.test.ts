import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from './vitest.setup'
import { signUp, signIn } from '../services/auth.service'
import { findUserByEmail, createUser, findUserByUsername } from '../repository/auth.repository'
import { HttpError } from '../errors/HttpError'
import bcrypt from 'bcryptjs'

vi.mock('../repository/auth.repository', () => ({
    findUserByEmail: vi.fn(),
    findUserByUsername: vi.fn(),
    createUser: vi.fn(),
}))

beforeEach(() => {
    vi.clearAllMocks()
})

describe('Auth service', () => {
    const mockUser = {
        id: 1,
        username: 'TestUser',
        email: 'test@example.com',
        password: 'hashedpassword',
        createdAt: new Date(),
        updatedAt: new Date(),
    }

    it('should signup a user successfully', async () => {
        ; (findUserByEmail as any).mockResolvedValue(null)
        ; (createUser as any).mockResolvedValue(mockUser)
        prismaMock.user.create.mockResolvedValue(mockUser)

        const result = await signUp({
            username: 'TestUser',
            email: 'test@example.com',
            password: 'password123'
        })

        expect(result).toHaveProperty('token')
        expect(result.user).toHaveProperty('id', 1)
        expect(result.user).toHaveProperty('email', 'test@example.com')
        expect(result.user).toHaveProperty('username', 'TestUser')
    })

    it('should fail if email already exists', async () => {
        ; (findUserByEmail as any).mockResolvedValue(mockUser)

        await expect(
            signUp({
                username: 'TestUser',
                email: 'test@example.com',
                password: 'password123'
            })
        ).rejects.toBeInstanceOf(HttpError)
    })

    it('should fail if username already exists', async () => {
        ; (findUserByEmail as any).mockResolvedValue(null)
        ; (findUserByUsername as any).mockResolvedValue(mockUser)

        await expect(
            signUp({ username: 'TestUser', email: 'test2@example.com', password: 'password' })
        ).rejects.toBeInstanceOf(HttpError)
    })

    it('should signin successfully', async () => {
        const stored = { ...mockUser, password: 'hashed' }
        ; (findUserByEmail as any).mockResolvedValue(stored)
        vi.spyOn(bcrypt, 'compare').mockResolvedValue(true as any)

        const result = await signIn({ email: 'test@example.com', password: 'password123' })
        expect(result).toHaveProperty('token')
        expect(result.user).toHaveProperty('email', 'test@example.com')
    })

    it('should fail signin with invalid credentials', async () => {
        ; (findUserByEmail as any).mockResolvedValue(null)

        await expect(signIn({ email: 'noone@example.com', password: 'x' })).rejects.toBeInstanceOf(HttpError)
    })
})