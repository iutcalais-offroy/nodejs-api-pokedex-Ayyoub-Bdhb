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

describe('Service d\'authentification', () => {
    const utilisateurMock = {
        id: 1,
        username: 'UtilisateurTest',
        email: 'test@example.com',
        password: 'hashedpassword',
        createdAt: new Date(),
        updatedAt: new Date(),
    }

    it("devrait inscrire un utilisateur avec succès", async () => {
        const trouveUtilisateurParEmailMock = findUserByEmail as Inconnu as ReturnType<typeof vi.fn>
        const creerUtilisateurMock = createUser as Inconnu as ReturnType<typeof vi.fn>
        trouveUtilisateurParEmailMock.mockResolvedValue(null)
        creerUtilisateurMock.mockResolvedValue(utilisateurMock)
        prismaMock.user.create.mockResolvedValue(utilisateurMock)

        const resultat = await signUp({
            username: 'UtilisateurTest',
            email: 'test@example.com',
            password: 'password123'
        })

        expect(resultat).toHaveProperty('token')
        expect(resultat.user).toHaveProperty('id', 1)
        expect(resultat.user).toHaveProperty('email', 'test@example.com')
        expect(resultat.user).toHaveProperty('username', 'UtilisateurTest')
    })

    it("échoue si l'email existe déjà", async () => {
        const trouveUtilisateurParEmailMock = findUserByEmail as Inconnu as ReturnType<typeof vi.fn>
        trouveUtilisateurParEmailMock.mockResolvedValue(utilisateurMock)

        await expect(
            signUp({
                username: 'UtilisateurTest',
                email: 'test@example.com',
                password: 'password123'
            })
        ).rejects.toBeInstanceOf(HttpError)
    })

    it("échoue si le pseudo existe déjà", async () => {
        const trouveUtilisateurParEmailMock = findUserByEmail as Inconnu as ReturnType<typeof vi.fn>
        const trouveUtilisateurParPseudoMock = findUserByUsername as Inconnu as ReturnType<typeof vi.fn>
        trouveUtilisateurParEmailMock.mockResolvedValue(null)
        trouveUtilisateurParPseudoMock.mockResolvedValue(utilisateurMock)

        await expect(
            signUp({ username: 'UtilisateurTest', email: 'test2@example.com', password: 'password' })
        ).rejects.toBeInstanceOf(HttpError)
    })

    it("devrait s'authentifier avec succès", async () => {
        const stored = { ...utilisateurMock, password: 'hashed' }
        const trouveUtilisateurParEmailMock = findUserByEmail as Inconnu as ReturnType<typeof vi.fn>
        trouveUtilisateurParEmailMock.mockResolvedValue(stored)
        const bcryptTyped = bcrypt as Inconnu as { compare: (a: string, b: string) => Promise<boolean> }
        vi.spyOn(bcryptTyped, 'compare').mockResolvedValue(true)

        const resultat = await signIn({ email: 'test@example.com', password: 'password123' })
        expect(resultat).toHaveProperty('token')
        expect(resultat.user).toHaveProperty('email', 'test@example.com')
    })

    it("échoue lors de l'authentification avec des identifiants invalides", async () => {
        const trouveUtilisateurParEmailMock = findUserByEmail as Inconnu as ReturnType<typeof vi.fn>
        trouveUtilisateurParEmailMock.mockResolvedValue(null)

        await expect(signIn({ email: 'noone@example.com', password: 'x' })).rejects.toBeInstanceOf(HttpError)
    })
})