import { Router } from 'express'
import {
  signInController,
  signUpController,
} from '../controllers/auth.controller'

/**
 * Routeur dédié à l'authentification.
 *
 * Contient les endpoints permettant :
 * - l'inscription d'un utilisateur
 * - la connexion d'un utilisateur
 */
const router = Router()

/**
 * POST /sign-up
 *
 * Permet d'inscrire un nouvel utilisateur.
 *
 * @route POST /auth/sign-up
 */
router.post('/sign-up', signUpController)

/**
 * POST /sign-in
 *
 * Permet d'authentifier un utilisateur existant
 * et de générer un token JWT.
 *
 * @route POST /auth/sign-in
 */
router.post('/sign-in', signInController)

export default router