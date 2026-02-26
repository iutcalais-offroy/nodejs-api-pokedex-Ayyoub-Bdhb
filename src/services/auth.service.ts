import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { env } from '../env'
import {
  createUser,
  findUserByEmail,
  findUserByUsername,
} from '../repository/auth.repository'
import { HttpError } from '../errors/HttpError'

interface SignUpPayload {
  email: string
  username: string
  password: string
}

interface SignInPayload {
  email: string
  password: string
}

/**
 * Inscrit un nouvel utilisateur.
 *
 * Vérifie la présence des données obligatoires,
 * contrôle de l'email et du nom d'utilisateur,
 * chiffre le mot de passe, crée l'utilisateur en base,
 * puis génère un token JWT valide 7 jours.
 *
 * @param {SignUpPayload} payload - Données d'inscription (email, username, password).
 * @returns {Promise<{ token: string; user: Omit<Inconnu, 'password'> }>}
 * Retourne un token JWT et l'utilisateur créé sans son mot de passe.
 *
 * @throws {HttpError} 400 - Si des données sont manquantes.
 * @throws {HttpError} 409 - Si l'email ou le nom d'utilisateur est déjà utilisé.
 */
export const signUp = async (payload: SignUpPayload) => {
  const { email, username, password } = payload

  if (!email || !username || !password) {
    throw new HttpError(400, 'Les données sont manquantes.')
  }

  const emailExists = await findUserByEmail(email)
  if (emailExists) {
    throw new HttpError(409, "L'email est déjà utilisé.")
  }

  const usernameExists = await findUserByUsername(username)
  if (usernameExists) {
    throw new HttpError(409, "Le nom d'utilisateur est déjà utilisé.")
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await createUser(email, username, hashedPassword)

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    env.JWT_SECRET,
    { expiresIn: '7d' },
  )

  const { password: _, ...userWithoutPassword } = user

  return {
    token,
    user: userWithoutPassword,
  }
}

/**
 * Authentifie un utilisateur existant.
 *
 * Vérifie les identifiants fournis,
 * compare le mot de passe chiffré,
 * puis génère un token JWT si l'authentification est valide.
 *
 * @param {SignInPayload} payload - Données de connexion (email, password).
 * @returns {Promise<{ token: string; user: Omit<Inconnu, 'password'> }>}
 * Retourne un token JWT et l'utilisateur authentifié sans son mot de passe.
 *
 * @throws {HttpError} 400 - Si des données sont manquantes.
 * @throws {HttpError} 401 - Si les identifiants sont invalides.
 */
export const signIn = async (payload: SignInPayload) => {
  const { email, password } = payload

  if (!email || !password) {
    throw new HttpError(400, 'Les données sont manquantes.')
  }

  const user = await findUserByEmail(email)
  if (!user) {
    throw new HttpError(401, 'Identifiants invalides.')
  }

  const isValid = await bcrypt.compare(password, user.password)
  if (!isValid) {
    throw new HttpError(401, 'Identifiants invalides.')
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    env.JWT_SECRET,
    { expiresIn: '7d' },
  )

  const { password: _, ...userWithoutPassword } = user

  return {
    token,
    user: userWithoutPassword,
  }
}