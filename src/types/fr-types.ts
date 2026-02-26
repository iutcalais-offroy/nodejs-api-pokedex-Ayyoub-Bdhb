declare global {
	type Inconnu = unknown
}

export {}

declare global {
	/** Objet JSON générique avec valeurs inconnues */
	type JsonObjet = Record<string, Inconnu>

	/** Type minimal attendu pour les documents Swagger utilisés dans le serveur */
	type SwaggerDoc = JsonObjet & {
		paths?: Record<string, Inconnu>
		components?: Record<string, Inconnu>
	}
}
