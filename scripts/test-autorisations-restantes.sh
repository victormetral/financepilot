#!/usr/bin/env bash

# ============================================================
# TEST GLOBAL DES AUTORISATIONS RESTANTES
# ============================================================
#
# Rôle : teste en une exécution budgets, objectifs, opérations
# d'investissement, et la protection du référentiel d'actifs.
#
# Deux utilisateurs : le propriétaire crée les données,
# l'intrus tente de les lire, modifier et supprimer.
#
# Utilise : scripts/lib/test-helpers.sh (mutualisé)
# Depuis Lot 5 : un cookie jar par utilisateur.
# ============================================================

set -e

API_URL="http://localhost:3000/api"
DATABASE_URL="postgresql://${DB_USER:-financepilot}:${DB_PASSWORD:-financepilot}@${DB_HOST:-localhost}:${DB_PORT:-5434}/${DB_NAME:-financepilot}"
RESPONSE_FILE="/tmp/reponse-autorisations-restantes.json"
JAR_ANONYME="/tmp/cookies-restantes-anonyme.txt"
JAR_1="/tmp/cookies-restantes-1.txt"
JAR_2="/tmp/cookies-restantes-2.txt"
COOKIE_JAR="$JAR_ANONYME"

TIMESTAMP=$(date +%s)
DATE_TEST=$(date "+%Y-%m-%d")
MOIS_TEST=$(date "+%-m")
ANNEE_TEST=$(date "+%Y")
MOT_DE_PASSE="TestFinance123!"
EMAIL_1="restantes-1-${TIMESTAMP}@financepilot.test"
EMAIL_2="restantes-2-${TIMESTAMP}@financepilot.test"

source "$(dirname "$0")/lib/test-helpers.sh"

nettoyer() {
  rm -f "$RESPONSE_FILE" "$JAR_ANONYME" "$JAR_1" "$JAR_2"
}

trap nettoyer EXIT

# Vérifie qu'un identifiant est absent d'une liste JSON.
verifier_absence_id() {
  local filtre_jq="$1"
  local id_recherche="$2"
  local nom_test="$3"

  if ! jq -e --argjson idRecherche "$id_recherche" "$filtre_jq" \
    "$RESPONSE_FILE" >/dev/null; then
    echo "❌ $nom_test"
    cat "$RESPONSE_FILE"
    exit 1
  fi

  echo "✅ $nom_test"
}

afficher_etape "1. PRÉREQUIS ET PROTECTION DE SESSION"

for outil in curl jq psql; do
  if ! command -v "$outil" >/dev/null 2>&1; then
    echo "❌ $outil n'est pas installé."
    exit 1
  fi
done

CODE_HTTP=$(requete_http "GET" "http://localhost:3000/")
verifier_code_http "$CODE_HTTP" "200" "Backend accessible"

# Le référentiel global exige quand même une session en lecture.
CODE_HTTP=$(requete_http "GET" "$API_URL/actifs-financiers")
verifier_code_http "$CODE_HTTP" "401" "Actifs financiers protégés sans session"

afficher_etape "2. CRÉATION DES DEUX UTILISATEURS"

CODE_HTTP=$(requete_http "POST" "$API_URL/utilisateurs" "{
  \"nom\": \"Propriétaire\", \"prenom\": \"Session\",
  \"email\": \"$EMAIL_1\", \"mot_de_passe\": \"$MOT_DE_PASSE\"
}")
verifier_code_http "$CODE_HTTP" "201" "Création du propriétaire"
UTILISATEUR_1_ID=$(recuperer_identifiant "le propriétaire")

CODE_HTTP=$(requete_http "POST" "$API_URL/utilisateurs" "{
  \"nom\": \"Intrus\", \"prenom\": \"Session\",
  \"email\": \"$EMAIL_2\", \"mot_de_passe\": \"$MOT_DE_PASSE\"
}")
verifier_code_http "$CODE_HTTP" "201" "Création de l'intrus"
UTILISATEUR_2_ID=$(recuperer_identifiant "l'intrus")

ouvrir_session_pour "$JAR_1" "$EMAIL_1" "$MOT_DE_PASSE" "Connexion du propriétaire"
ouvrir_session_pour "$JAR_2" "$EMAIL_2" "$MOT_DE_PASSE" "Connexion de l'intrus"

afficher_etape "3. CRÉATION DES DONNÉES PRIVÉES"

utiliser_session "$JAR_1"

CODE_HTTP=$(requete_http "POST" "$API_URL/comptes" "{
  \"nom\": \"Compte autorisation\", \"type_compte\": \"courant\",
  \"sous_type_compte\": \"compte_courant\",
  \"solde_initial\": 1000, \"devise\": \"EUR\"
}")
verifier_code_http "$CODE_HTTP" "201" "Création du compte privé"
COMPTE_ID=$(recuperer_identifiant "le compte")

CODE_HTTP=$(requete_http "POST" "$API_URL/categories" "{
  \"nom\": \"Budget privé $TIMESTAMP\", \"type_categorie\": \"depense\"
}")
verifier_code_http "$CODE_HTTP" "201" "Création de la catégorie privée"
CATEGORIE_ID=$(recuperer_identifiant "la catégorie")

# Le rôle est porté par le cookie : une reconnexion est
# nécessaire pour que la promotion soit prise en compte.
psql "$DATABASE_URL" -q -c \
  "UPDATE utilisateur SET role = 'administrateur' WHERE id = $UTILISATEUR_1_ID;"

ouvrir_session_pour "$JAR_1" "$EMAIL_1" "$MOT_DE_PASSE" "Reconnexion du propriétaire en administrateur"

CODE_HTTP=$(requete_http "POST" "$API_URL/actifs-financiers" "{
  \"symbole\": \"T$TIMESTAMP\", \"nom\": \"Actif test autorisation\",
  \"type_actif\": \"etf\", \"devise\": \"EUR\"
}")
verifier_code_http "$CODE_HTTP" "201" "Création de l'actif global"
ACTIF_ID=$(recuperer_identifiant "l'actif financier")

CODE_HTTP=$(requete_http "POST" "$API_URL/budgets" "{
  \"categorie_id\": $CATEGORIE_ID, \"montant_limite\": 500,
  \"mois\": $MOIS_TEST, \"annee\": $ANNEE_TEST
}")
verifier_code_http "$CODE_HTTP" "201" "Création du budget privé"
BUDGET_ID=$(recuperer_identifiant "le budget")

CODE_HTTP=$(requete_http "POST" "$API_URL/objectifs" "{
  \"nom\": \"Objectif secret\", \"montant_cible\": 5000,
  \"montant_actuel\": 100, \"date_echeance\": \"$DATE_TEST\",
  \"statut\": \"en cours\"
}")
verifier_code_http "$CODE_HTTP" "201" "Création de l'objectif privé"
OBJECTIF_ID=$(recuperer_identifiant "l'objectif")

CODE_HTTP=$(requete_http "POST" "$API_URL/operations-investissement" "{
  \"compte_id\": $COMPTE_ID, \"actif_financier_id\": $ACTIF_ID,
  \"type_operation\": \"achat\", \"quantite\": 2,
  \"prix_unitaire\": 100, \"frais\": 1, \"date_operation\": \"$DATE_TEST\"
}")
verifier_code_http "$CODE_HTTP" "201" "Création de l'opération privée"
OPERATION_ID=$(recuperer_identifiant "l'opération d'investissement")

afficher_etape "4. VÉRIFICATION DES LISTES PRIVÉES"

utiliser_session "$JAR_2"

CODE_HTTP=$(requete_http "GET" "$API_URL/budgets")
verifier_code_http "$CODE_HTTP" "200" "Liste des budgets de l'intrus"
verifier_absence_id \
  '[.budgets[] | select(.id == $idRecherche)] | length == 0' \
  "$BUDGET_ID" "Le budget du propriétaire est invisible"

CODE_HTTP=$(requete_http "GET" "$API_URL/objectifs")
verifier_code_http "$CODE_HTTP" "200" "Liste des objectifs de l'intrus"
verifier_absence_id \
  '[.[] | select(.id == $idRecherche)] | length == 0' \
  "$OBJECTIF_ID" "L'objectif du propriétaire est invisible"

CODE_HTTP=$(requete_http "GET" "$API_URL/operations-investissement")
verifier_code_http "$CODE_HTTP" "200" "Liste des opérations de l'intrus"
verifier_absence_id \
  '[.[] | select(.id == $idRecherche)] | length == 0' \
  "$OPERATION_ID" "L'opération du propriétaire est invisible"

afficher_etape "5. LECTURES, MODIFICATIONS ET SUPPRESSIONS REFUSÉES"

CODE_HTTP=$(requete_http "GET" "$API_URL/budgets/$BUDGET_ID")
verifier_code_http "$CODE_HTTP" "404" "Lecture du budget étranger refusée"

CODE_HTTP=$(requete_http "PUT" "$API_URL/budgets/$BUDGET_ID" "{
  \"categorie_id\": $CATEGORIE_ID, \"montant_limite\": 1,
  \"mois\": $MOIS_TEST, \"annee\": $ANNEE_TEST
}")
verifier_code_http "$CODE_HTTP" "404" "Modification du budget étranger refusée"

CODE_HTTP=$(requete_http "DELETE" "$API_URL/budgets/$BUDGET_ID")
verifier_code_http "$CODE_HTTP" "404" "Suppression du budget étranger refusée"

CODE_HTTP=$(requete_http "GET" "$API_URL/objectifs/$OBJECTIF_ID")
verifier_code_http "$CODE_HTTP" "404" "Lecture de l'objectif étranger refusée"

CODE_HTTP=$(requete_http "PUT" "$API_URL/objectifs/$OBJECTIF_ID" "{
  \"nom\": \"Objectif piraté\", \"montant_cible\": 1,
  \"montant_actuel\": 0, \"date_echeance\": \"$DATE_TEST\",
  \"statut\": \"en cours\"
}")
verifier_code_http "$CODE_HTTP" "404" "Modification de l'objectif étranger refusée"

CODE_HTTP=$(requete_http "DELETE" "$API_URL/objectifs/$OBJECTIF_ID")
verifier_code_http "$CODE_HTTP" "404" "Suppression de l'objectif étranger refusée"

CODE_HTTP=$(requete_http "GET" "$API_URL/operations-investissement/$OPERATION_ID")
verifier_code_http "$CODE_HTTP" "404" "Lecture de l'opération étrangère refusée"

CODE_HTTP=$(requete_http "PUT" "$API_URL/operations-investissement/$OPERATION_ID" "{
  \"compte_id\": $COMPTE_ID, \"actif_financier_id\": $ACTIF_ID,
  \"type_operation\": \"vente\", \"quantite\": 1,
  \"prix_unitaire\": 1, \"frais\": 0, \"date_operation\": \"$DATE_TEST\"
}")
verifier_code_http "$CODE_HTTP" "404" "Modification de l'opération étrangère refusée"

CODE_HTTP=$(requete_http "DELETE" "$API_URL/operations-investissement/$OPERATION_ID")
verifier_code_http "$CODE_HTTP" "404" "Suppression de l'opération étrangère refusée"

# L'intrus ne peut pas créer une ressource avec les relations du propriétaire.
CODE_HTTP=$(requete_http "POST" "$API_URL/budgets" "{
  \"categorie_id\": $CATEGORIE_ID, \"montant_limite\": 999,
  \"mois\": $MOIS_TEST, \"annee\": $ANNEE_TEST
}")
verifier_code_http "$CODE_HTTP" "404" "Création avec la catégorie étrangère refusée"

CODE_HTTP=$(requete_http "POST" "$API_URL/operations-investissement" "{
  \"compte_id\": $COMPTE_ID, \"actif_financier_id\": $ACTIF_ID,
  \"type_operation\": \"achat\", \"quantite\": 1,
  \"prix_unitaire\": 1, \"frais\": 0, \"date_operation\": \"$DATE_TEST\"
}")
verifier_code_http "$CODE_HTTP" "404" "Création avec le compte étranger refusée"

afficher_etape "6. INTÉGRITÉ ET NETTOYAGE"

utiliser_session "$JAR_1"

CODE_HTTP=$(requete_http "GET" "$API_URL/budgets/$BUDGET_ID")
verifier_code_http "$CODE_HTTP" "200" "Budget encore accessible au propriétaire"
verifier_json '.montant_limite == "500.00"' "Le budget n'a pas été modifié"

CODE_HTTP=$(requete_http "GET" "$API_URL/objectifs/$OBJECTIF_ID")
verifier_code_http "$CODE_HTTP" "200" "Objectif encore accessible au propriétaire"
verifier_json '.nom == "Objectif secret"' "L'objectif n'a pas été modifié"

CODE_HTTP=$(requete_http "GET" "$API_URL/operations-investissement/$OPERATION_ID")
verifier_code_http "$CODE_HTTP" "200" "Opération encore accessible au propriétaire"
verifier_json '.type_operation == "achat"' "L'opération n'a pas été modifiée"

CODE_HTTP=$(requete_http "DELETE" "$API_URL/budgets/$BUDGET_ID")
verifier_code_http "$CODE_HTTP" "200" "Suppression du budget"

CODE_HTTP=$(requete_http "DELETE" "$API_URL/objectifs/$OBJECTIF_ID")
verifier_code_http "$CODE_HTTP" "200" "Suppression de l'objectif"

CODE_HTTP=$(requete_http "DELETE" "$API_URL/operations-investissement/$OPERATION_ID")
verifier_code_http "$CODE_HTTP" "200" "Suppression de l'opération"

CODE_HTTP=$(requete_http "DELETE" "$API_URL/actifs-financiers/$ACTIF_ID")
verifier_code_http "$CODE_HTTP" "200" "Suppression de l'actif global de test"

CODE_HTTP=$(requete_http "DELETE" "$API_URL/categories/$CATEGORIE_ID")
verifier_code_http "$CODE_HTTP" "200" "Suppression de la catégorie"

CODE_HTTP=$(requete_http "DELETE" "$API_URL/comptes/$COMPTE_ID")
verifier_code_http "$CODE_HTTP" "200" "Suppression du compte"

utiliser_session "$JAR_2"
CODE_HTTP=$(requete_http "DELETE" "$API_URL/utilisateurs/$UTILISATEUR_2_ID")
verifier_code_http "$CODE_HTTP" "200" "Suppression de l'intrus"

utiliser_session "$JAR_1"
CODE_HTTP=$(requete_http "DELETE" "$API_URL/utilisateurs/$UTILISATEUR_1_ID")
verifier_code_http "$CODE_HTTP" "200" "Suppression du propriétaire"

afficher_etape "✅ TOUTES LES AUTORISATIONS SONT VALIDÉES"