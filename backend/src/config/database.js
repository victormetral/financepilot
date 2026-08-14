/*
  CONNEXION À POSTGRESQL

  Crée le pool de connexions partagé par tous les services.

  Utilisé par :
  - tous les fichiers de backend/src/services/
*/

import pg from "pg"
import "dotenv/config"

const { Pool, types } = pg

/*
  LECTURE DES COLONNES DE TYPE DATE

  Par défaut, le driver transforme une colonne DATE en objet
  Date JavaScript, positionné à minuit dans le fuseau du
  serveur. Converti en JSON, il devient une date UTC :
  minuit à Paris en été s'écrit 22h00 la veille, et le jour
  affiché recule d'un cran.

  1082 est l'identifiant PostgreSQL du type DATE. On demande
  ici de renvoyer la valeur telle qu'elle est stockée, sous
  forme de texte "AAAA-MM-JJ".

  Une colonne DATE ne porte pas d'heure : lui en inventer une
  ne peut produire que des erreurs de fuseau. Le texte brut
  est à la fois plus juste et plus simple à afficher.

  Non concernées : les colonnes TIMESTAMP (date_creation),
  qui désignent un instant précis et gardent leur conversion
  habituelle.
*/
types.setTypeParser(1082, (valeur) => valeur)

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
})