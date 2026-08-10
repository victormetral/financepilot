#!/usr/bin/env bash

# ============================================================
# TEST DES AUTORISATIONS DU CRUD UTILISATEURS
# ============================================================
#
# Rôle :
# vérifie que :
# - un utilisateur ne voit que son propre profil ;
# - il ne peut pas consulter un autre utilisateur ;
# - il ne peut pas modifier un autre utilisateur ;
# - il ne peut pas supprimer un autre utilisateur ;
# - chaque utilisateur peut toujours accéder à son profil.
#
# Utilise :
# - scripts/lib/test-helpers.sh (afficher_etape, requete_http,
#   verifier_code_http — mutualisé)
# ============================================================

set -e

API_URL="http://localhost:3000/api"
RESPONSE_FILE="/tmp/reponse-autorisation-utilisateurs.json"
TOKEN=""

TIMESTAMP=$(date +%s)
MOT_DE_PASSE="TestFinance123!"

# Fonctions communes mutualisées.
source "$(dirname "$0")/lib/test-helpers.sh"

# ============================================================
# 1. VÉRIFICATION DES PRÉREQUIS
# ============================================================

afficher_etape "1. VÉRIFICATION DES PRÉREQUIS"

if ! command -v curl >/dev/null 2>&1; then
  echo "❌ curl n'est pas installé."
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "❌ jq n'est pas installé."
  exit 1
fi

CODE_HTTP=$(requete_http "GET" "http://localhost:3000/")
verifier_code_http "$CODE_HTTP" "200" "Backend accessible"

# ============================================================
# 2. CRÉATION ET CONNEXION DU PREMIER UTILISATEUR
# ============================================================

afficher_etape "2. CRÉATION DU PREMIER UTILISATEUR"

EMAIL_UTILISATEUR_1="profil-1-${TIMESTAMP}@financepilot.test"

CODE_HTTP=$(requete_http "POST" "$API_URL/utilisateurs" "{
  \"nom\": \"Propriétaire\",
  \"prenom\": \"Test\",
  \"email\": \"$EMAIL_UTILISATEUR_1\",
  \"mot_de_passe\": \"$MOT_DE_PASSE\"
}")
verifier_code_http "$CODE_HTTP" "201" "Création du premier utilisateur"

UTILISATEUR_1_ID=$(jq -r '.id' "$RESPONSE_FILE")

CODE_HTTP=$(requete_http "POST" "$API_URL/auth/connexion" "{
  \"email\": \"$EMAIL_UTILISATEUR_1\",
  \"mot_de_passe\": \"$MOT_DE_PASSE\"
}")
verifier_code_http "$CODE_HTTP" "200" "Connexion du premier utilisateur"

TOKEN_UTILISATEUR_1=$(jq -r '.token' "$RESPONSE_FILE")

# ============================================================
# 3. CRÉATION ET CONNEXION DU SECOND UTILISATEUR
# ============================================================

afficher_etape "3. CRÉATION DU SECOND UTILISATEUR"

TOKEN=""
EMAIL_UTILISATEUR_2="profil-2-${TIMESTAMP}@financepilot.test"

CODE_HTTP=$(requete_http "POST" "$API_URL/utilisateurs" "{
  \"nom\": \"Intrus\",
  \"prenom\": \"Test\",
  \"email\": \"$EMAIL_UTILISATEUR_2\",
  \"mot_de_passe\": \"$MOT_DE_PASSE\"
}")
verifier_code_http "$CODE_HTTP" "201" "Création du second utilisateur"

UTILISATEUR_2_ID=$(jq -r '.id' "$RESPONSE_FILE")

CODE_HTTP=$(requete_http "POST" "$API_URL/auth/connexion" "{
  \"email\": \"$EMAIL_UTILISATEUR_2\",
  \"mot_de_passe\": \"$MOT_DE_PASSE\"
}")
verifier_code_http "$CODE_HTTP" "200" "Connexion du second utilisateur"

TOKEN_UTILISATEUR_2=$(jq -r '.token' "$RESPONSE_FILE")

# ============================================================
# 4. VÉRIFICATION DE LA LISTE PRIVÉE
# ============================================================

afficher_etape "4. LISTE PRIVÉE DU SECOND UTILISATEUR"

TOKEN="$TOKEN_UTILISATEUR_2"

CODE_HTTP=$(requete_http "GET" "$API_URL/utilisateurs")
verifier_code_http "$CODE_HTTP" "200" "Liste des utilisateurs accessible"

if ! jq -e --argjson id "$UTILISATEUR_2_ID" \
  'length == 1 and .[0].id == $id' \
  "$RESPONSE_FILE" >/dev/null; then
  echo "❌ Le second utilisateur ne devrait voir que son profil."
  cat "$RESPONSE_FILE"
  exit 1
fi

echo "✅ Le second utilisateur voit uniquement son profil"

# ============================================================
# 5. TENTATIVES CONTRE LE PREMIER UTILISATEUR
# ============================================================

afficher_etape "5. TENTATIVES D'ACCÈS AU PROFIL ÉTRANGER"

CODE_HTTP=$(requete_http "GET" "$API_URL/utilisateurs/$UTILISATEUR_1_ID")
verifier_code_http "$CODE_HTTP" "404" "Consultation du profil étranger refusée"

CODE_HTTP=$(requete_http "PUT" "$API_URL/utilisateurs/$UTILISATEUR_1_ID" "{
  \"nom\": \"Profil piraté\",
  \"prenom\": \"Test\",
  \"email\": \"pirate-${TIMESTAMP}@financepilot.test\",
  \"mot_de_passe\": \"$MOT_DE_PASSE\"
}")
verifier_code_http "$CODE_HTTP" "404" "Modification du profil étranger refusée"

CODE_HTTP=$(requete_http "DELETE" "$API_URL/utilisateurs/$UTILISATEUR_1_ID")
verifier_code_http "$CODE_HTTP" "404" "Suppression du profil étranger refusée"

# ============================================================
# 6. VÉRIFICATION AVEC LE PROPRIÉTAIRE
# ============================================================

afficher_etape "6. VÉRIFICATION AVEC LE PROPRIÉTAIRE"

TOKEN="$TOKEN_UTILISATEUR_1"

CODE_HTTP=$(requete_http "GET" "$API_URL/utilisateurs/$UTILISATEUR_1_ID")
verifier_code_http "$CODE_HTTP" "200" "Le propriétaire peut consulter son profil"

NOM_UTILISATEUR=$(jq -r '.nom' "$RESPONSE_FILE")

if [ "$NOM_UTILISATEUR" != "Propriétaire" ]; then
  echo "❌ La tentative étrangère a modifié le profil."
  exit 1
fi

echo "✅ Le profil n'a pas été modifié par le second utilisateur"

# ============================================================
# 7. SUPPRESSION DES DONNÉES DE TEST
# ============================================================

afficher_etape "7. SUPPRESSION DES DONNÉES DE TEST"

TOKEN="$TOKEN_UTILISATEUR_2"

CODE_HTTP=$(requete_http "DELETE" "$API_URL/utilisateurs/$UTILISATEUR_2_ID")
verifier_code_http "$CODE_HTTP" "200" "Le second utilisateur supprime son profil"

TOKEN="$TOKEN_UTILISATEUR_1"

CODE_HTTP=$(requete_http "DELETE" "$API_URL/utilisateurs/$UTILISATEUR_1_ID")
verifier_code_http "$CODE_HTTP" "200" "Le premier utilisateur supprime son profil"

TOKEN=""

rm -f "$RESPONSE_FILE"

afficher_etape "✅ AUTORISATIONS DES UTILISATEURS VALIDÉES"