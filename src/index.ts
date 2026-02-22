import { createServer } from 'http'
import { env } from './env'
import express from 'express'
import cors from 'cors'

import authRoutes from './routes/auth.route'
import cardsRoute from './routes/cards.route'
import decksRoute from './routes/decks.route'


// Create Express app
export const app = express()

// Middlewares
app.use(
  cors({
    origin: true, // Autorise toutes les origines
    credentials: true,
  }),
)

app.use(express.json())

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/cards', cardsRoute) // route publique pour consulter le catalogue
app.use('/api/decks', decksRoute)


// Serve static files (Socket.io test client)
app.use(express.static('public'))

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'TCG Backend Server is running' })
})

// Start server only if this file is run directly (not imported for tests)
if (require.main === module) {
  const httpServer = createServer(app)

  try {
    httpServer.listen(env.PORT, () => {
      console.log(`\n🚀 Server is running on http://localhost:${env.PORT}`)
      console.log(
        `🧪 Socket.io Test Client available at http://localhost:${env.PORT}`,
      )
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}
