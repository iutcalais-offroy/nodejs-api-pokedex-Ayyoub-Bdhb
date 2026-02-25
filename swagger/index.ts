import swaggerUi from 'swagger-ui-express'
import { Express } from 'express'
import path from 'path'
import fs from 'fs'
import yaml from 'js-yaml'

function loadYaml(fileName: string) {
    const filePath = path.join(__dirname, fileName)
    const file = fs.readFileSync(filePath, 'utf8')
    return yaml.load(file) as any
}

const swaggerDocument = loadYaml('swagger.config.yml')
const authDoc = loadYaml('auth.doc.yml')
const cardDoc = loadYaml('card.doc.yml')
const deckDoc = loadYaml('deck.doc.yml')

swaggerDocument.paths = {
    ...swaggerDocument.paths,
    ...authDoc.paths,
    ...cardDoc.paths,
    ...deckDoc.paths,
}

swaggerDocument.components = {
    ...swaggerDocument.components,
    ...authDoc.components,
    ...cardDoc.components,
    ...deckDoc.components,
}

export const setupSwagger = (app: Express) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))
}