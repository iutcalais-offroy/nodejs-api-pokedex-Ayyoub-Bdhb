import { createServer } from 'http'
import { Server, Socket } from 'socket.io'
import jwt from 'jsonwebtoken'
import { env } from '../env'
import { findDeckById } from '../repository/deck.repository'
import { findUserById } from '../repository/auth.repository'
import { calculerDegats } from '../utils/rules.util'
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

function obtenirEtatPartiePourJoueur(partie: Partie, idSocketObservateur: string) {
  const estHote = partie.hote.socketId === idSocketObservateur

  const vous = {
    userId: estHote ? partie.hote.userId : partie.invite.userId,
    pseudo: estHote ? partie.hote.pseudo : partie.invite.pseudo,
    main: estHote ? partie.mainHote : partie.mainInvite,
    active: estHote ? partie.activeHote : partie.activeInvite,
    nombreDeck: estHote ? partie.deckHote.length : partie.deckInvite.length,
    score: estHote ? partie.scoreHote : partie.scoreInvite,
  }

  const adversaire = {
    userId: estHote ? partie.invite.userId : partie.hote.userId,
    pseudo: estHote ? partie.invite.pseudo : partie.hote.pseudo,
    nombreMainAdverse: estHote ? partie.mainInvite.length : partie.mainHote.length,
    active: estHote ? partie.activeInvite : partie.activeHote,
    score: estHote ? partie.scoreInvite : partie.scoreHote,
  }

  return {
    roomId: partie.id,
    idSocketJoueurCourant: partie.idSocketJoueurCourant,
    vous,
    adversaire,
  }
}

const salles = new Map<number, Salle>()
let prochainIdSalle = 1

function construireSallePublique(salle: Salle) {
  return {
    id: salle.id,
    hote: { userId: salle.hote.userId, pseudo: salle.hote.pseudo },
    idDeck: salle.idDeck,
    statut: salle.statut,
  }
}

function obtenirSallesEnAttente() {
  return Array.from(salles.values()).filter((r) => r.statut === 'waiting').map(construireSallePublique)
}

function verifierJeton(token?: string) {
  if (!token) return null
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: number; email: string }
    return decoded
  } catch {
    return null
  }
}

export function configurerMatchmaking(httpServer: ReturnType<typeof createServer>) {
  const io = new Server(httpServer, {
    cors: {
      origin: true,
      credentials: true,
    },
  })

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token
    const decoded = verifierJeton(String(token))
    if (!decoded) return next(new Error('Authentication error'))
    socket.data.user = decoded
    next()
  })

  io.on('connection', async (socket: Socket) => {
    const utilisateur = socket.data.user as { userId: number; email: string }
    const enregistrementUtilisateur = await findUserById(utilisateur.userId)
    const pseudo = enregistrementUtilisateur?.username || 'inconnu'

    socket.emit('roomsListUpdated', obtenirSallesEnAttente())

    socket.on('getRooms', () => {
      socket.emit('roomsListUpdated', obtenirSallesEnAttente())
    })

    socket.on('createRoom', async (payload: { deckId: number }, cb?: (res: Inconnu) => void) => {
      try {
        const { deckId } = payload
        const deck = await findDeckById(deckId)
        if (!deck) return cb ? cb({ error: 'Deck introuvable' }) : socket.emit('error', { error: 'Deck introuvable' })
        if (deck.userId !== utilisateur.userId) return cb ? cb({ error: "Le deck n'appartient pas à l'utilisateur" }) : socket.emit('error', { error: "Le deck n'appartient pas à l'utilisateur" })
        const cardCount = deck.deckCards?.length ?? 0
        if (cardCount !== 10) return cb ? cb({ error: 'Le deck doit contenir 10 cartes' }) : socket.emit('error', { error: 'Le deck doit contenir 10 cartes' })

        const roomId = prochainIdSalle++
        const salle: Salle = {
          id: roomId,
          hote: { userId: utilisateur.userId, pseudo, socketId: socket.id },
          idDeck: deckId,
          statut: 'waiting',
        }
        salles.set(roomId, salle)
        socket.join(String(roomId))

        socket.emit('roomCreated', construireSallePublique(salle))

        io.emit('roomsListUpdated', obtenirSallesEnAttente())

        if (cb) cb({ ok: true, room: construireSallePublique(salle) })
      } catch (error) {
        if (cb) cb({ error: 'Erreur serveur' })
        else socket.emit('error', { error: 'Erreur serveur' })
      }
    })

    socket.on('joinRoom', async (payload: { roomId: number; deckId: number }, cb?: (res: Inconnu) => void) => {
      try {
        const { roomId, deckId } = payload
        const salle = salles.get(roomId)
        if (!salle) return cb ? cb({ error: 'Room introuvable' }) : socket.emit('error', { error: 'Room introuvable' })
        if (salle.statut !== 'waiting') return cb ? cb({ error: 'Room déjà complète' }) : socket.emit('error', { error: 'Room déjà complète' })

        const deck = await findDeckById(deckId)
        if (!deck) return cb ? cb({ error: 'Deck introuvable' }) : socket.emit('error', { error: 'Deck introuvable' })
        if (deck.userId !== utilisateur.userId) return cb ? cb({ error: "Le deck n'appartient pas à l'utilisateur" }) : socket.emit('error', { error: "Le deck n'appartient pas à l'utilisateur" })
        const cardCount = deck.deckCards?.length ?? 0
        if (cardCount !== 10) return cb ? cb({ error: 'Le deck doit contenir 10 cartes' }) : socket.emit('error', { error: 'Le deck doit contenir 10 cartes' })

        socket.join(String(roomId))
        salle.invite = { userId: utilisateur.userId, pseudo, socketId: socket.id }
        salle.statut = 'full'
        salles.set(roomId, salle)

        const deckHote = await findDeckById(salle.idDeck)
        const deckInvite = await findDeckById(deckId)

        const cartesHote = deckHote!.deckCards!.map((dc: { card: Card }) => dc.card)
        const cartesInvite = deckInvite!.deckCards!.map((dc: { card: Card }) => dc.card)

        const mainHote: Card[] = cartesHote.slice(0, 5)
        const mainInvite: Card[] = cartesInvite.slice(0, 5)
        const deckRestantHote: Card[] = cartesHote.slice(5)
        const deckRestantInvite: Card[] = cartesInvite.slice(5)

        const partie: Partie = {
          id: roomId,
          hote: { ...salle.hote },
          invite: { ...salle.invite! },
          deckHote: deckRestantHote,
          deckInvite: deckRestantInvite,
          mainHote,
          mainInvite,
          activeHote: null,
          activeInvite: null,
          scoreHote: 0,
          scoreInvite: 0,
          idSocketJoueurCourant: salle.hote.socketId, 
        }

        parties.set(roomId, partie)

        const socketHote = io.sockets.sockets.get(partie.hote.socketId)
        const socketInvite = io.sockets.sockets.get(partie.invite.socketId)

        socketHote?.emit('gameStarted', obtenirEtatPartiePourJoueur(partie, partie.hote.socketId))
        socketInvite?.emit('gameStarted', obtenirEtatPartiePourJoueur(partie, partie.invite.socketId))

        const socketInitial = io.sockets.sockets.get(partie.idSocketJoueurCourant)
        socketInitial?.emit('yourTurn', { roomId: partie.id })

        salles.delete(roomId)
        io.emit('roomsListUpdated', obtenirSallesEnAttente())

        if (cb) cb({ ok: true })
      } catch (error) {
        if (cb) cb({ error: 'Erreur serveur' })
        else socket.emit('error', { error: 'Erreur serveur' })
      }
    })

    socket.on('drawCards', (payload: { roomId: number }, cb?: (res: Inconnu) => void) => {
      try {
        const { roomId } = payload
        const partie = parties.get(roomId)
        if (!partie) return cb ? cb({ error: 'Session introuvable' }) : socket.emit('error', { error: 'Session introuvable' })
        if (partie.idSocketJoueurCourant !== socket.id) return cb ? cb({ error: "Ce n'est pas votre tour" }) : socket.emit('error', { error: "Ce n'est pas votre tour" })

        const estHote = partie.hote.socketId === socket.id
        const main = estHote ? partie.mainHote : partie.mainInvite
        const deck = estHote ? partie.deckHote : partie.deckInvite

        while (main.length < 5 && deck.length > 0) {
          main.push(deck.shift()!)
        }

        // mise à jour de la partie
        if (estHote) {
          partie.mainHote = main
          partie.deckHote = deck
        } else {
          partie.mainInvite = main
          partie.deckInvite = deck
        }

        const socketHote = io.sockets.sockets.get(partie.hote.socketId)
        const socketInvite = io.sockets.sockets.get(partie.invite.socketId)
        socketHote?.emit('gameStateUpdated', obtenirEtatPartiePourJoueur(partie, partie.hote.socketId))
        socketInvite?.emit('gameStateUpdated', obtenirEtatPartiePourJoueur(partie, partie.invite.socketId))

        if (cb) cb({ ok: true })
      } catch (error) {
        if (cb) cb({ error: 'Erreur serveur' })
      }
    })

    socket.on('playCard', (payload: { roomId: number; cardIndex: number }, cb?: (res: Inconnu) => void) => {
      try {
        const { roomId, cardIndex } = payload
        const partie = parties.get(roomId)
        if (!partie) return cb ? cb({ error: 'Session introuvable' }) : socket.emit('error', { error: 'Session introuvable' })
        if (partie.idSocketJoueurCourant !== socket.id) return cb ? cb({ error: "Ce n'est pas votre tour" }) : socket.emit('error', { error: "Ce n'est pas votre tour" })

        const estHote = partie.hote.socketId === socket.id
        const main = estHote ? partie.mainHote : partie.mainInvite

        if (cardIndex < 0 || cardIndex >= main.length) return cb ? cb({ error: 'Index de carte invalide' }) : socket.emit('error', { error: 'Index de carte invalide' })
        if (estHote ? partie.activeHote : partie.activeInvite) return cb ? cb({ error: 'Vous avez déjà une carte active' }) : socket.emit('error', { error: 'Vous avez déjà une carte active' })

        const card = main.splice(cardIndex, 1)[0]
        const activeCard: CarteActive = { ...card, pvCourants: card.hp }

        if (estHote) partie.activeHote = activeCard
        else partie.activeInvite = activeCard

        if (estHote) partie.mainHote = main
        else partie.mainInvite = main

        const socketHote = io.sockets.sockets.get(partie.hote.socketId)
        const socketInvite = io.sockets.sockets.get(partie.invite.socketId)
        socketHote?.emit('gameStateUpdated', obtenirEtatPartiePourJoueur(partie, partie.hote.socketId))
        socketInvite?.emit('gameStateUpdated', obtenirEtatPartiePourJoueur(partie, partie.invite.socketId))

        if (cb) cb({ ok: true })
      } catch (error) {
        if (cb) cb({ error: 'Erreur serveur' })
      }
    })

    socket.on('attack', (payload: { roomId: number }, cb?: (res: Inconnu) => void) => {
      try {
        const { roomId } = payload
        const partie = parties.get(roomId)
        if (!partie) return cb ? cb({ error: 'Session introuvable' }) : socket.emit('error', { error: 'Session introuvable' })
        if (partie.idSocketJoueurCourant !== socket.id) return cb ? cb({ error: "Ce n'est pas votre tour" }) : socket.emit('error', { error: "Ce n'est pas votre tour" })

        const estHote = partie.hote.socketId === socket.id
        const attaquantActif = estHote ? partie.activeHote : partie.activeInvite
        const defenseurActif = estHote ? partie.activeInvite : partie.activeHote

        if (!attaquantActif) return cb ? cb({ error: "Vous n'avez pas de carte active" }) : socket.emit('error', { error: "Vous n'avez pas de carte active" })
        if (!defenseurActif) return cb ? cb({ error: "L'adversaire n'a pas de carte active" }) : socket.emit('error', { error: "L'adversaire n'a pas de carte active" })

        const degats = calculerDegats(attaquantActif.attack, attaquantActif.type, defenseurActif.type)
        defenseurActif.pvCourants -= degats

        let gagnant: 'hote' | 'invite' | null = null
        if (defenseurActif.pvCourants <= 0) {
          if (estHote) {
            partie.activeInvite = null
            partie.scoreHote += 1
            if (partie.scoreHote >= 3) gagnant = 'hote'
          } else {
            partie.activeHote = null
            partie.scoreInvite += 1
            if (partie.scoreInvite >= 3) gagnant = 'invite'
          }
        }

        partie.idSocketJoueurCourant = estHote ? partie.invite.socketId : partie.hote.socketId

        const socketHote = io.sockets.sockets.get(partie.hote.socketId)
        const socketInvite = io.sockets.sockets.get(partie.invite.socketId)

        if (gagnant) {
          socketHote?.emit('gameEnded', { winner: gagnant === 'hote' ? partie.hote.userId : partie.invite.userId })
          socketInvite?.emit('gameEnded', { winner: gagnant === 'hote' ? partie.hote.userId : partie.invite.userId })
          parties.delete(roomId)
        } else {
          socketHote?.emit('gameStateUpdated', obtenirEtatPartiePourJoueur(partie, partie.hote.socketId))
          socketInvite?.emit('gameStateUpdated', obtenirEtatPartiePourJoueur(partie, partie.invite.socketId))
          const socketCourant = io.sockets.sockets.get(partie.idSocketJoueurCourant)
          socketCourant?.emit('yourTurn', { roomId: partie.id })
        }

        if (cb) cb({ ok: true, degats })
      } catch (error) {
        if (cb) cb({ error: 'Erreur serveur' })
      }
    })

    socket.on('endTurn', (payload: { roomId: number }, cb?: (res: Inconnu) => void) => {
      try {
        const { roomId } = payload
        const partie = parties.get(roomId)
        if (!partie) return cb ? cb({ error: 'Session introuvable' }) : socket.emit('error', { error: 'Session introuvable' })
        if (partie.idSocketJoueurCourant !== socket.id) return cb ? cb({ error: "Ce n'est pas votre tour" }) : socket.emit('error', { error: "Ce n'est pas votre tour" })

        // changer de joueur
        partie.idSocketJoueurCourant = partie.hote.socketId === socket.id ? partie.invite.socketId : partie.hote.socketId

        const socketHote = io.sockets.sockets.get(partie.hote.socketId)
        const socketInvite = io.sockets.sockets.get(partie.invite.socketId)
        socketHote?.emit('gameStateUpdated', obtenirEtatPartiePourJoueur(partie, partie.hote.socketId))
        socketInvite?.emit('gameStateUpdated', obtenirEtatPartiePourJoueur(partie, partie.invite.socketId))
        // notifier le joueur dont c'est maintenant le tour
        const socketCourant = io.sockets.sockets.get(partie.idSocketJoueurCourant)
        socketCourant?.emit('yourTurn', { roomId: partie.id })

        if (cb) cb({ ok: true })
      } catch (error) {
        if (cb) cb({ error: 'Erreur serveur' })
      }
    })

    socket.on('disconnect', () => {
      // supprimer les salles en attente hébergées par ce socket
      for (const [id, salle] of salles.entries()) {
        if (salle.hote.socketId === socket.id) {
          salles.delete(id)
        }
      }

      // si le socket était dans une partie active, la terminer et prévenir l'adversaire
      for (const [id, partie] of parties.entries()) {
        if (partie.hote.socketId === socket.id || partie.invite.socketId === socket.id) {
          const autreSocketId = partie.hote.socketId === socket.id ? partie.invite.socketId : partie.hote.socketId
          const socketAutre = io.sockets.sockets.get(autreSocketId)
          socketAutre?.emit('gameEnded', { reason: 'opponent_disconnected' })
          parties.delete(id)
        }
      }

      io.emit('roomsListUpdated', obtenirSallesEnAttente())
    })
  })
}

export default configurerMatchmaking
