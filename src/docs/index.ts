import swaggerUi from 'swagger-ui-express'
import YAML from 'yamljs'
import { Express } from 'express'
import path from 'path'

interface SwaggerDoc {
    paths?: Record<string, unknown>
    components?: Record<string, unknown>
    [key: string]: unknown
}

const loadYaml = (filePath: string): SwaggerDoc => {
    return YAML.load(filePath) as SwaggerDoc
}

const swaggerDocument = loadYaml(
    path.join(__dirname, 'swagger.config.yml')
)

const authDoc = loadYaml(
    path.join(__dirname, 'auth.doc.yml')
)

const cardDoc = loadYaml(
    path.join(__dirname, 'card.doc.yml')
)

const deckDoc = loadYaml(
    path.join(__dirname, 'deck.doc.yml')
)

swaggerDocument.paths = {
    ...(swaggerDocument.paths ?? {}),
    ...(authDoc.paths ?? {}),
    ...(cardDoc.paths ?? {}),
    ...(deckDoc.paths ?? {}),
}

swaggerDocument.components = {
    ...(swaggerDocument.components ?? {}),
    ...(authDoc.components ?? {}),
    ...(cardDoc.components ?? {}),
    ...(deckDoc.components ?? {}),
}

export const setupSwagger = (app: Express) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))
}