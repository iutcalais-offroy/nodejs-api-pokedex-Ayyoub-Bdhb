import { Request, Response } from 'express'
import { signIn, signUp } from '../services/auth.service'
import { HttpError } from '../errors/HttpError'

/**
 * Contrôleur pour l'inscription d'un utilisateur.
 *
 * @param {Request} req - La requête HTTP contenant le corps avec email, username et password.
 * @param {Response} res - La réponse HTTP utilisée pour renvoyer le résultat.
 *
 * @returns {Promise<Response>} - Le token JWT et les informations de l'utilisateur créé.
 *
 * @throws {HttpError} - Si des données sont manquantes ou déjà utilisées.
 * @throws {500} - En cas d'erreur serveur inattendue.
 */
export async function signUpController(req: Request, res: Response) {
  try {
    const result = await signUp(req.body)
    return res.status(201).json(result)
  } catch (error) {
    console.error('sign-up error', error)

    if (error instanceof HttpError) {
      return res.status(error.status).json({ error: error.message })
    }

    return res.status(500).json({
      error: 'Erreur serveur',
    })
  }
}

/**
 * Contrôleur pour la connexion d'un utilisateur.
 *
 * @param {Request} req - La requête HTTP contenant le corps avec email et password.
 * @param {Response} res - La réponse HTTP utilisée pour renvoyer le résultat.
 *
 * @returns {Promise<Response>} - Le token JWT et les informations de l'utilisateur connecté.
 *
 * @throws {HttpError} - Si les identifiants sont invalides ou manquants.
 * @throws {500} - En cas d'erreur serveur inattendue.
 */
export async function signInController(req: Request, res: Response) {
  try {
    const result = await signIn(req.body)
    return res.status(200).json(result)
  } catch (error) {
    console.error('sign-in error', error)

    if (error instanceof HttpError) {
      return res.status(error.status).json({ error: error.message })
    }

    return res.status(500).json({
      error: 'Erreur serveur',
    })
  }
}