import { describe, it, expect, vi } from 'vitest'
import { authenticate } from '../middleware/auth.middleware'
import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'

describe('Middleware d\'authentification', () => {
    it('appelle next() si le jeton est valide', () => {
        const req = { headers: { authorization: 'Bearer validtoken' } } as Inconnu as Request
        const res = {} as Response
        const next = vi.fn()
        vi.spyOn(jwt as Inconnu as { verify: (...args: Inconnu[]) => Inconnu }, 'verify').mockReturnValue({ userId: 1 } as Inconnu as object)
        authenticate(req, res, next)
        expect(next).toHaveBeenCalled()
    })

    it('lance une erreur si le jeton est manquant', () => {
        const req = { headers: {} } as Inconnu as Request
        const res = {} as Response
        const next = vi.fn()

        expect(() => authenticate(req, res, next)).toThrow()
    })
})