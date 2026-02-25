import { createServer } from 'http'
import { Server, Socket } from 'socket.io'
import jwt from 'jsonwebtoken'
import { env } from './env'
import { findDeckById } from './repository/deck.repository'
import { findUserById } from './repository/auth.repository'

type RoomStatus = 'waiting' | 'full'

interface Room {
  id: number
  host: {
    userId: number
    username: string
    socketId: string
  }
  guest?: {
    userId: number
    username: string
    socketId: string
  }
  deckId: number
  status: RoomStatus
}

const rooms = new Map<number, Room>()
let nextRoomId = 1

function buildPublicRoom(room: Room) {
  return {
    id: room.id,
    host: { userId: room.host.userId, username: room.host.username },
    deckId: room.deckId,
    status: room.status,
  }
}

function getWaitingRooms() {
  return Array.from(rooms.values()).filter((r) => r.status === 'waiting').map(buildPublicRoom)
}

function verifyToken(token?: string) {
  if (!token) return null
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: number; email: string }
    return decoded
  } catch {
    return null
  }
}

export function setupMatchmaking(httpServer: ReturnType<typeof createServer>) {
  const io = new Server(httpServer, {
    cors: {
      origin: true,
      credentials: true,
    },
  })

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token
    const decoded = verifyToken(String(token))
    if (!decoded) return next(new Error('Authentication error'))
    socket.data.user = decoded
    next()
  })

  io.on('connection', async (socket: Socket) => {
    const user = socket.data.user as { userId: number; email: string }
    const userRecord = await findUserById(user.userId)
    const username = userRecord?.username || 'unknown'

    socket.emit('roomsListUpdated', getWaitingRooms())

    socket.on('getRooms', () => {
      socket.emit('roomsListUpdated', getWaitingRooms())
    })

    socket.on('createRoom', async (payload: { deckId: number }, cb?: (res: any) => void) => {
      try {
        const { deckId } = payload
        const deck = await findDeckById(deckId)
        if (!deck) return cb ? cb({ error: 'Deck introuvable' }) : socket.emit('error', { error: 'Deck introuvable' })
        if (deck.userId !== user.userId) return cb ? cb({ error: "Le deck n'appartient pas à l'utilisateur" }) : socket.emit('error', { error: "Le deck n'appartient pas à l'utilisateur" })
        const cardCount = deck.deckCards?.length ?? 0
        if (cardCount !== 10) return cb ? cb({ error: 'Le deck doit contenir 10 cartes' }) : socket.emit('error', { error: 'Le deck doit contenir 10 cartes' })

        const roomId = nextRoomId++
        const room: Room = {
          id: roomId,
          host: { userId: user.userId, username, socketId: socket.id },
          deckId,
          status: 'waiting',
        }
        rooms.set(roomId, room)
        socket.join(String(roomId))

        // Emit confirmation to creator
        socket.emit('roomCreated', buildPublicRoom(room))

        // Broadcast updated rooms list to all
        io.emit('roomsListUpdated', getWaitingRooms())

        if (cb) cb({ ok: true, room: buildPublicRoom(room) })
      } catch (error) {
        if (cb) cb({ error: 'Erreur serveur' })
        else socket.emit('error', { error: 'Erreur serveur' })
      }
    })

    socket.on('joinRoom', async (payload: { roomId: number; deckId: number }, cb?: (res: any) => void) => {
      try {
        const { roomId, deckId } = payload
        const room = rooms.get(roomId)
        if (!room) return cb ? cb({ error: 'Room introuvable' }) : socket.emit('error', { error: 'Room introuvable' })
        if (room.status !== 'waiting') return cb ? cb({ error: 'Room déjà complète' }) : socket.emit('error', { error: 'Room déjà complète' })

        const deck = await findDeckById(deckId)
        if (!deck) return cb ? cb({ error: 'Deck introuvable' }) : socket.emit('error', { error: 'Deck introuvable' })
        if (deck.userId !== user.userId) return cb ? cb({ error: "Le deck n'appartient pas à l'utilisateur" }) : socket.emit('error', { error: "Le deck n'appartient pas à l'utilisateur" })
        const cardCount = deck.deckCards?.length ?? 0
        if (cardCount !== 10) return cb ? cb({ error: 'Le deck doit contenir 10 cartes' }) : socket.emit('error', { error: 'Le deck doit contenir 10 cartes' })

        socket.join(String(roomId))
        room.guest = { userId: user.userId, username, socketId: socket.id }
        room.status = 'full'
        rooms.set(roomId, room)

        const hostDeck = await findDeckById(room.deckId)
        const guestDeck = await findDeckById(deckId)

        const hostCards = hostDeck!.deckCards!.map((dc: any) => dc.card)
        const guestCards = guestDeck!.deckCards!.map((dc: any) => dc.card)

        const hostState = {
          player: { userId: room.host.userId, username: room.host.username },
          hand: hostCards.slice(0, 5),
          deckCount: hostCards.length - 5,
          opponentHandCount: guestCards.length,
        }

        const guestState = {
          player: { userId: room.guest.userId, username: room.guest.username },
          hand: guestCards.slice(0, 5),
          deckCount: guestCards.length - 5,
          opponentHandCount: hostCards.length,
        }

        // Emit gameStarted to both players with their personalized state
        const hostSocket = io.sockets.sockets.get(room.host.socketId)
        const guestSocket = io.sockets.sockets.get(room.guest.socketId)

        hostSocket?.emit('gameStarted', { yourself: hostState, opponent: { username: guestState.player.username, handCount: guestState.hand.length } })
        guestSocket?.emit('gameStarted', { yourself: guestState, opponent: { username: hostState.player.username, handCount: hostState.hand.length } })

        rooms.delete(roomId)

        io.emit('roomsListUpdated', getWaitingRooms())

        if (cb) cb({ ok: true })
      } catch (error) {
        if (cb) cb({ error: 'Erreur serveur' })
        else socket.emit('error', { error: 'Erreur serveur' })
      }
    })

    socket.on('disconnect', () => {
      for (const [id, room] of rooms.entries()) {
        if (room.host.socketId === socket.id) {
          rooms.delete(id)
        }
      }
      io.emit('roomsListUpdated', getWaitingRooms())
    })
  })
}

export default setupMatchmaking
