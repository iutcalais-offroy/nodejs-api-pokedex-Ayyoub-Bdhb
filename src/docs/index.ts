import swaggerUi from 'swagger-ui-express'
import YAML from 'yamljs'
import { Express } from 'express'
import path from 'path'

const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.config.yml')) as SwaggerDoc

const authDoc = YAML.load(path.join(__dirname, 'auth.doc.yml')) as SwaggerDoc
const cardDoc = YAML.load(path.join(__dirname, 'card.doc.yml')) as SwaggerDoc
const deckDoc = YAML.load(path.join(__dirname, 'deck.doc.yml')) as SwaggerDoc

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
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument as unknown as Record<string, unknown>))
}
