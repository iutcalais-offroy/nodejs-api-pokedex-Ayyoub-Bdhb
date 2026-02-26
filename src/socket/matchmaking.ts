import { createServer } from 'http'
import { Server, Socket } from 'socket.io'
import jwt from 'jsonwebtoken'
import { env } from '../env'
import { findDeckById } from '../repository/deck.repository'
import { findUserById } from '../repository/auth.repository'
import { Card, PokemonType } from '../generated/prisma/client'

type StatutSalle = 'waiting' | 'full'

interface Salle {
  id: number
  hote: {
    userId: number
    pseudo: string
    socketId: string
  }
  invite?: {
    userId: number
    pseudo: string
    socketId: string
  }
  idDeck: number
  statut: StatutSalle
}

interface CarteActive {
  id: number
  name: string
  hp: number
  attack: number
  type: PokemonType
  pokedexNumber: number
  pvCourants: number
}

interface Partie {
  id: number
  hote: { userId: number; pseudo: string; socketId: string }
  invite: { userId: number; pseudo: string; socketId: string }
  deckHote: Card[]
  deckInvite: Card[]
  mainHote: Card[]
  mainInvite: Card[]
  activeHote?: CarteActive | null
  activeInvite?: CarteActive | null
  scoreHote: number
  scoreInvite: number
  idSocketJoueurCourant: string
}

const parties = new Map<number, Partie>()
const salles = new Map<number, Salle>()
let prochainIdSalle = 1

function verifierJeton(token: string) {
  try {
    return jwt.verify(token, env.JWT_SECRET) as {
      userId: number
      email: string
    }
  } catch {
    return null
  }
}

export function configurerMatchmaking(
  httpServer: ReturnType<typeof createServer>,
) {
  const io = new Server(httpServer, {
    cors: {
      origin: true,
      credentials: true,
    },
  })

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token

    if (!token) {
      return next(new Error('Token missing'))
    }

    const decoded = verifierJeton(token)

    if (!decoded) {
      return next(new Error('Invalid token'))
    }

    socket.data.userId = decoded.userId
    socket.data.email = decoded.email

    next()
  })

  io.on('connection', async (socket: Socket) => {
    const utilisateur = {
      userId: socket.data.userId as number,
      email: socket.data.email as string,
    }

    const enregistrementUtilisateur = await findUserById(
      utilisateur.userId,
    )
    const pseudo =
      enregistrementUtilisateur?.username || 'inconnu'

    socket.emit(
      'roomsListUpdated',
      Array.from(salles.values())
        .filter((r) => r.statut === 'waiting')
        .map((salle) => ({
          id: salle.id,
          hote: {
            userId: salle.hote.userId,
            pseudo: salle.hote.pseudo,
          },
          idDeck: salle.idDeck,
          statut: salle.statut,
        })),
    )

    socket.on('createRoom', async ({ deckId }, cb?: any) => {
      try {
        const deck = await findDeckById(deckId)

        if (!deck)
          return cb?.({ error: 'Deck introuvable' })

        if (deck.userId !== utilisateur.userId)
          return cb?.({
            error: "Le deck n'appartient pas à l'utilisateur",
          })

        if ((deck.deckCards?.length ?? 0) !== 10)
          return cb?.({
            error: 'Le deck doit contenir 10 cartes',
          })

        const roomId = prochainIdSalle++

        const salle: Salle = {
          id: roomId,
          hote: {
            userId: utilisateur.userId,
            pseudo,
            socketId: socket.id,
          },
          idDeck: deckId,
          statut: 'waiting',
        }

        salles.set(roomId, salle)
        socket.join(String(roomId))

        io.emit('roomsListUpdated',
          Array.from(salles.values())
            .filter((r) => r.statut === 'waiting')
        )

        cb?.({ ok: true })
      } catch {
        cb?.({ error: 'Erreur serveur' })
      }
    })

    socket.on('disconnect', () => {
      for (const [id, salle] of salles.entries()) {
        if (salle.hote.socketId === socket.id) {
          salles.delete(id)
        }
      }

      for (const [id, partie] of parties.entries()) {
        if (
          partie.hote.socketId === socket.id ||
          partie.invite.socketId === socket.id
        ) {
          const autreSocketId =
            partie.hote.socketId === socket.id
              ? partie.invite.socketId
              : partie.hote.socketId

          const socketAutre =
            io.sockets.sockets.get(autreSocketId)

          socketAutre?.emit('gameEnded', {
            reason: 'opponent_disconnected',
          })

          parties.delete(id)
        }
      }

      io.emit(
        'roomsListUpdated',
        Array.from(salles.values()).filter(
          (r) => r.statut === 'waiting',
        ),
      )
    })
  })
}

export default configurerMatchmaking