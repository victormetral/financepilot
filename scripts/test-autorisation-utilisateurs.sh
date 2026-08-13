#!/usr/bin/env bash

# ============================================================
# TEST DES AUTORISATIONS DU CRUD UTILISATEURS
# ============================================================
#
# Rôle : vérifie qu'un utilisateur ne voit que son profil et
# ne peut ni consulter, ni modifier, ni supprimer celui d'un
# autre.
#
# Utilise : scripts/lib/test-helpers.sh (mutualisé)
# Depuis Lot 5 : un cookie jar par utilisateur.
# ============================================================

set -e

API_URL="http://localhost:3000/api"
RESPONSE_FILE="/tmp/reponse-autorisation-utilisateurs.json"
JAR_ANONYME="/tmp/cookies-utilisateurs-anonyme.txt"
JAR_1="/tmp/cookies-utilisateurs-1.txt"
JAR_2="/tmp/cookies-utilisateurs-2.txt"
COOKIE_JAR="$JAR_ANONYME"

TIMESTAMP=$(date +%s)
MOT_DE_PASSE="TestFinance123!"
EMAIL_1="profil-1-${TIMESTAMP}@financepilot.test"
EMAIL_2="profil-2-${TIMESTAMP}@financepilot.test"

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

afficher_etape "3. LISTE PRIVÉE DU SECOND UTILISATEUR"

utiliser_session "$JAR_2"

CODE_HTTP=$(requete_http "GET" "$API_URL/utilisateurs")
verifier_code_http "$CODE_HTTP" "200" "Liste des utilisateurs accessible"

if ! jq -e --argjson id "$UTILISATEUR_2_ID" \
  'length == 1 and .[0].id == $id' "$RESPONSE_FILE" >/dev/null; then
  echo "❌ Le second utilisateur ne devrait voir que son profil."
  cat "$RESPONSE_FILE"
  exit 1
fi

echo "✅ Le second utilisateur voit uniquement son profil"

afficher_etape "4. TENTATIVES D'ACCÈS AU PROFIL ÉTRANGER"

CODE_HTTP=$(requete_http "GET" "$API_URL/utilisateurs/$UTILISATEUR_1_ID")
verifier_code_http "$CODE_HTTP" "404" "Consultation du profil étranger refusée"

CODE_HTTP=$(requete_http "PUT" "$API_URL/utilisateurs/$UTILISATEUR_1_ID" "{
  \"nom\": \"Profil piraté\", \"prenom\": \"Test\",
  \"email\": \"pirate-${TIMESTAMP}@financepilot.test\",
  \"mot_de_passe\": \"$MOT_DE_PASSE\"
}")
verifier_code_http "$CODE_HTTP" "404" "Modification du profil étranger refusée"

CODE_HTTP=$(requete_http "DELETE" "$API_URL/utilisateurs/$UTILISATEUR_1_ID")
verifier_code_http "$CODE_HTTP" "404" "Suppression du profil étranger refusée"

afficher_etape "5. VÉRIFICATION AVEC LE PROPRIÉTAIRE"

utiliser_session "$JAR_1"

CODE_HTTP=$(requete_http "GET" "$API_URL/utilisateurs/$UTILISATEUR_1_ID")
verifier_code_http "$CODE_HTTP" "200" "Le propriétaire peut consulter son profil"
verifier_json '.nom == "Propriétaire"' "Le profil n'a pas été modifié par l'intrus"

afficher_etape "6. SUPPRESSION DES DONNÉES DE TEST"

utiliser_session "$JAR_2"
CODE_HTTP=$(requete_http "DELETE" "$API_URL/utilisateurs/$UTILISATEUR_2_ID")
verifier_code_http "$CODE_HTTP" "200" "Le second utilisateur supprime son profil"

utiliser_session "$JAR_1"
CODE_HTTP=$(requete_http "DELETE" "$API_URL/utilisateurs/$UTILISATEUR_1_ID")
verifier_code_http "$CODE_HTTP" "200" "Le premier utilisateur supprime son profil"

afficher_etape "✅ AUTORISATIONS DES UTILISATEURS VALIDÉES"