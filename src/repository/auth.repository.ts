import { prisma } from '../database'

/**
 * Recherche un utilisateur par son adresse email.
 *
 * @param {string} email - Email de l'utilisateur.
 * @returns {Promise<User | null>} L'utilisateur trouvé ou null si inexistant.
 */
export function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  })
}

/**
 * Recherche un utilisateur par son nom d'utilisateur.
 *
 * @param {string} username - Nom d'utilisateur.
 * @returns {Promise<User | null>} L'utilisateur trouvé ou null si inexistant.
 */
export function findUserByUsername(username: string) {
  return prisma.user.findUnique({
    where: { username },
  })
}

/**
 * Recherche un utilisateur par son identifiant.
 *
 * @param {number} id - Identifiant de l'utilisateur.
 * @returns {Promise<User | null>} L'utilisateur trouvé ou null si inexistant.
 */
export function findUserById(id: number) {
  return prisma.user.findUnique({
    where: { id },
  })
}

/**
 * Crée un nouvel utilisateur en base de données.
 *
 * @param {string} email - Email de l'utilisateur.
 * @param {string} username - Nom d'utilisateur.
 * @param {string} password - Mot de passe.
 * @returns {Promise<User>} L'utilisateur créé.
 */
export function createUser(
  email: string,
  username: string,
  password: string,
) {
  return prisma.user.create({
    data: {
      email,
      username,
      password,
    },
  })
}