import swaggerUi from 'swagger-ui-express'
import YAML from 'yamljs'
import { Express } from 'express'
import path from 'path'

const swaggerDocument = YAML.load(
    path.join(__dirname, 'swagger.config.yml')
) as Record<string, any>

const authDoc = YAML.load(
    path.join(__dirname, 'auth.doc.yml')
) as Record<string, any>

const cardDoc = YAML.load(
    path.join(__dirname, 'card.doc.yml')
) as Record<string, any>

const deckDoc = YAML.load(
    path.join(__dirname, 'deck.doc.yml')
) as Record<string, any>

swaggerDocument.paths = {
    ...(swaggerDocument.paths || {}),
    ...(authDoc?.paths || {}),
    ...(cardDoc?.paths || {}),
    ...(deckDoc?.paths || {}),
}

swaggerDocument.components = {
    ...(swaggerDocument.components || {}),
    ...(authDoc?.components || {}),
    ...(cardDoc?.components || {}),
    ...(deckDoc?.components || {}),
}

export const setupSwagger = (app: Express) => {
    app.use(
        '/api-docs',
        swaggerUi.serve,
        swaggerUi.setup(swaggerDocument)
    )
}