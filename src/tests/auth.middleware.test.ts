import { describe, it, expect, vi } from 'vitest'
import { authenticate } from '../middleware/auth.middleware'
import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'

describe('Auth middleware', () => {
    it('calls next() if token is valid', () => {
        const req = { headers: { authorization: 'Bearer validtoken' } } as any as Request
        const res = {} as Response
        const next = vi.fn()

        vi.spyOn(jwt, 'verify').mockReturnValue({ userId: 1 } as any)
        authenticate(req, res, next)
        expect(next).toHaveBeenCalled()
    })

    it('throws error if token is missing', () => {
        const req = { headers: {} } as any as Request
        const res = {} as Response
        const next = vi.fn()

        expect(() => authenticate(req, res, next)).toThrow()
    })
})