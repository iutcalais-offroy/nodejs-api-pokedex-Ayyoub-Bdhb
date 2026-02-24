import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../env'


export interface AuthRequest extends Request {
  user?: { userId: number; email: string }
}

/**
 * Middleware d'authentification JWT.
 *
 * Vérifie la présence d'un token dans l'en-tête Authorization
 * au format "Bearer <token>".
 *
 * Si le token est valide :
 * - Les informations décodées (userId, email) sont ajoutées à req.user
 * - La requête continue vers le contrôleur suivant
 *
 * Si le token est absent, invalide ou expiré :
 * - Une réponse 401 Unauthorized est renvoyée
 *
 * @param {AuthRequest} req - Requête HTTP étendue contenant éventuellement l'utilisateur.
 * @param {Response} res - Réponse HTTP.
 * @param {NextFunction} next - Fonction permettant de passer au middleware suivant.
 *
 * @returns {Response | void}
 * Retourne une réponse 401 en cas d'erreur, sinon passe au middleware suivant.
 */
export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant.' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      userId: number
      email: string
    }

    req.user = decoded
    return next()
  } catch {
    return res.status(401).json({ error: 'Token invalide ou expiré.' })
  }
}