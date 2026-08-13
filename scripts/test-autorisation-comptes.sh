#!/usr/bin/env bash

# ============================================================
# TEST DES AUTORISATIONS DU CRUD COMPTES
# ============================================================
#
# Rôle : vérifie que l'identité du propriétaire vient de la
# session, que utilisateur_id envoyé dans le JSON est ignoré,
# et qu'un utilisateur ne peut ni voir, ni modifier, ni
# supprimer le compte d'un autre.
#
# Utilise : scripts/lib/test-helpers.sh (mutualisé)
#
# Depuis Lot 5 : chaque utilisateur a son propre cookie jar ;
# utiliser_session bascule de l'un à l'autre.
# ============================================================

set -e

API_URL="http://localhost:3000/api"
RESPONSE_FILE="/tmp/reponse-autorisation-comptes.json"
JAR_ANONYME="/tmp/cookies-comptes-anonyme.txt"
JAR_1="/tmp/cookies-comptes-1.txt"
JAR_2="/tmp/cookies-comptes-2.txt"
COOKIE_JAR="$JAR_ANONYME"

TIMESTAMP=$(date +%s)
MOT_DE_PASSE="TestFinance123!"
EMAIL_1="autorisation-1-${TIMESTAMP}@financepilot.test"
EMAIL_2="autorisation-2-${TIMESTAMP}@financepilot.test"

source "$(dirname "$0")/lib/test-helpers.sh"

nettoyer() {
  rm -f "$RESPONSE_FILE" "$JAR_ANONYME" "$JAR_1" "$JAR_2"
}

trap nettoyer EXIT

afficher_etape "1. VÉRIFICATION DES PRÉREQUIS"

for outil in curl jq; do
  if ! command -v "$outil" >/dev/null 2>&1; then
    echo "❌ $outil n'est pas installé."
    exit 1
  fi
done

CODE_HTTP=$(requete_http "GET" "http://localhost:3000/")
verifier_code_http "$CODE_HTTP" "200" "Backend accessible"

afficher_etape "2. CRÉATION DES DEUX UTILISATEURS"

CODE_HTTP=$(requete_http "POST" "$API_URL/utilisateurs" "{
  \"nom\": \"Propriétaire\", \"prenom\": \"Test\",
  \"email\": \"$EMAIL_1\", \"mot_de_passe\": \"$MOT_DE_PASSE\"
}")
verifier_code_http "$CODE_HTTP" "201" "Création du premier utilisateur"
UTILISATEUR_1_ID=$(recuperer_identifiant "le premier utilisateur")

CODE_HTTP=$(requete_http "POST" "$API_URL/utilisateurs" "{
  \"nom\": \"Intrus\", \"prenom\": \"Test\",
  \"email\": \"$EMAIL_2\", \"mot_de_passe\": \"$MOT_DE_PASSE\"
}")
verifier_code_http "$CODE_HTTP" "201" "Création du second utilisateur"
UTILISATEUR_2_ID=$(recuperer_identifiant "le second utilisateur")

ouvrir_session_pour "$JAR_1" "$EMAIL_1" "$MOT_DE_PASSE" "Connexion du premier utilisateur"
ouvrir_session_pour "$JAR_2" "$EMAIL_2" "$MOT_DE_PASSE" "Connexion du second utilisateur"

afficher_etape "3. CRÉATION DU COMPTE PRIVÉ"

utiliser_session "$JAR_1"

CODE_HTTP=$(requete_http "POST" "$API_URL/comptes" "{
  \"utilisateur_id\": $UTILISATEUR_2_ID,
  \"nom\": \"Compte privé\", \"type_compte\": \"courant\",
  \"sous_type_compte\": \"compte_courant\",
  \"solde_initial\": 1000, \"devise\": \"EUR\"
}")
verifier_code_http "$CODE_HTTP" "201" "Création du compte par le premier utilisateur"
COMPTE_ID=$(recuperer_identifiant "le compte")

if [ "$(jq -r '.utilisateur_id' "$RESPONSE_FILE")" != "$UTILISATEUR_1_ID" ]; then
  echo "❌ Le propriétaire ne provient pas de la session."
  cat "$RESPONSE_FILE"
  exit 1
fi

echo "✅ utilisateur_id envoyé dans le JSON ignoré"

afficher_etape "4. TENTATIVES D'ACCÈS DU SECOND UTILISATEUR"

utiliser_session "$JAR_2"

CODE_HTTP=$(requete_http "GET" "$API_URL/comptes")
verifier_code_http "$CODE_HTTP" "200" "Liste des comptes du second utilisateur"
verifier_json 'length == 0' "Le compte du premier utilisateur est absent de la liste"

CODE_HTTP=$(requete_http "GET" "$API_URL/comptes/$COMPTE_ID")
verifier_code_http "$CODE_HTTP" "404" "Consultation du compte étranger refusée"

CODE_HTTP=$(requete_http "PUT" "$API_URL/comptes/$COMPTE_ID" "{
  \"nom\": \"Compte piraté\", \"type_compte\": \"courant\",
  \"sous_type_compte\": \"compte_courant\",
  \"solde_initial\": 0, \"devise\": \"EUR\"
}")
verifier_code_http "$CODE_HTTP" "404" "Modification du compte étranger refusée"

CODE_HTTP=$(requete_http "DELETE" "$API_URL/comptes/$COMPTE_ID")
verifier_code_http "$CODE_HTTP" "404" "Suppression du compte étranger refusée"

afficher_etape "5. VÉRIFICATION AVEC LE PROPRIÉTAIRE"

utiliser_session "$JAR_1"

CODE_HTTP=$(requete_http "GET" "$API_URL/comptes/$COMPTE_ID")
verifier_code_http "$CODE_HTTP" "200" "Le propriétaire peut consulter son compte"
verifier_json '.nom == "Compte privé"' "Le compte n'a pas été modifié par l'intrus"

afficher_etape "6. SUPPRESSION DES DONNÉES DE TEST"

CODE_HTTP=$(requete_http "DELETE" "$API_URL/comptes/$COMPTE_ID")
verifier_code_http "$CODE_HTTP" "200" "Suppression du compte par son propriétaire"

utiliser_session "$JAR_2"
CODE_HTTP=$(requete_http "DELETE" "$API_URL/utilisateurs/$UTILISATEUR_2_ID")
verifier_code_http "$CODE_HTTP" "200" "Suppression du second utilisateur"

utiliser_session "$JAR_1"
CODE_HTTP=$(requete_http "DELETE" "$API_URL/utilisateurs/$UTILISATEUR_1_ID")
verifier_code_http "$CODE_HTTP" "200" "Suppression du premier utilisateur"

afficher_etape "✅ AUTORISATIONS DES COMPTES VALIDÉES"