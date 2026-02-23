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