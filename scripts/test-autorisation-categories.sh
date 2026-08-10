#!/usr/bin/env bash

# ============================================================
# TEST DES AUTORISATIONS DU CRUD CATÉGORIES
# ============================================================
#
# Rôle :
# vérifie que :
# - une catégorie appartient à l'utilisateur du JWT ;
# - utilisateur_id envoyé dans le JSON est ignoré ;
# - un utilisateur ne voit que ses catégories ;
# - il ne peut pas consulter, modifier ou supprimer
#   la catégorie d'un autre utilisateur.
#
# Utilise :
# - scripts/lib/test-helpers.sh (afficher_etape, requete_http,
#   verifier_code_http — mutualisé)
# ============================================================

set -e

API_URL="http://localhost:3000/api"
RESPONSE_FILE="/tmp/reponse-autorisation-categories.json"
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

EMAIL_UTILISATEUR_1="autorisation-cat-1-${TIMESTAMP}@financepilot.test"

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
EMAIL_UTILISATEUR_2="autorisation-cat-2-${TIMESTAMP}@financepilot.test"

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
# 4. CRÉATION DES CATÉGORIES
# ============================================================

afficher_etape "4. CRÉATION DES CATÉGORIES"

TOKEN="$TOKEN_UTILISATEUR_1"

CODE_HTTP=$(requete_http "POST" "$API_URL/categories" "{
  \"utilisateur_id\": $UTILISATEUR_2_ID,
  \"nom\": \"Alimentation ${TIMESTAMP}\",
  \"type_categorie\": \"depense\"
}")
verifier_code_http "$CODE_HTTP" "201" "Création de la catégorie du premier utilisateur"

CATEGORIE_1_ID=$(jq -r '.id' "$RESPONSE_FILE")
PROPRIETAIRE_CATEGORIE=$(jq -r '.utilisateur_id' "$RESPONSE_FILE")

if [ "$PROPRIETAIRE_CATEGORIE" != "$UTILISATEUR_1_ID" ]; then
  echo "❌ utilisateur_id envoyé dans le JSON n'a pas été ignoré."
  cat "$RESPONSE_FILE"
  exit 1
fi

echo "✅ Le propriétaire vient bien du JWT"

TOKEN="$TOKEN_UTILISATEUR_2"

CODE_HTTP=$(requete_http "POST" "$API_URL/categories" "{
  \"nom\": \"Transport ${TIMESTAMP}\",
  \"type_categorie\": \"depense\"
}")
verifier_code_http "$CODE_HTTP" "201" "Création de la catégorie du second utilisateur"

CATEGORIE_2_ID=$(jq -r '.id' "$RESPONSE_FILE")

# ============================================================
# 5. VÉRIFICATION DE LA LISTE PRIVÉE
# ============================================================

afficher_etape "5. LISTE PRIVÉE DU SECOND UTILISATEUR"

CODE_HTTP=$(requete_http "GET" "$API_URL/categories")
verifier_code_http "$CODE_HTTP" "200" "Liste des catégories accessible"

if ! jq -e \
  --argjson categorieId "$CATEGORIE_2_ID" \
  --argjson utilisateurId "$UTILISATEUR_2_ID" \
  '
    length == 1 and
    .[0].id == $categorieId and
    .[0].utilisateur_id == $utilisateurId
  ' \
  "$RESPONSE_FILE" >/dev/null; then
  echo "❌ Le second utilisateur ne devrait voir que sa catégorie."
  cat "$RESPONSE_FILE"
  exit 1
fi

echo "✅ Le second utilisateur voit uniquement sa catégorie"

# ============================================================
# 6. TENTATIVES CONTRE LA CATÉGORIE ÉTRANGÈRE
# ============================================================

afficher_etape "6. TENTATIVES CONTRE LA CATÉGORIE ÉTRANGÈRE"

CODE_HTTP=$(requete_http "GET" "$API_URL/categories/$CATEGORIE_1_ID")
verifier_code_http "$CODE_HTTP" "404" "Consultation de la catégorie étrangère refusée"

CODE_HTTP=$(requete_http "PUT" "$API_URL/categories/$CATEGORIE_1_ID" "{
  \"nom\": \"Catégorie piratée\",
  \"type_categorie\": \"revenu\"
}")
verifier_code_http "$CODE_HTTP" "404" "Modification de la catégorie étrangère refusée"

CODE_HTTP=$(requete_http "DELETE" "$API_URL/categories/$CATEGORIE_1_ID")
verifier_code_http "$CODE_HTTP" "404" "Suppression de la catégorie étrangère refusée"

# ============================================================
# 7. VÉRIFICATION AVEC LE PROPRIÉTAIRE
# ============================================================

afficher_etape "7. VÉRIFICATION AVEC LE PROPRIÉTAIRE"

TOKEN="$TOKEN_UTILISATEUR_1"

CODE_HTTP=$(requete_http "GET" "$API_URL/categories/$CATEGORIE_1_ID")
verifier_code_http "$CODE_HTTP" "200" "Le propriétaire peut consulter sa catégorie"

NOM_CATEGORIE=$(jq -r '.nom' "$RESPONSE_FILE")

if [ "$NOM_CATEGORIE" != "Alimentation ${TIMESTAMP}" ]; then
  echo "❌ La tentative étrangère a modifié la catégorie."
  cat "$RESPONSE_FILE"
  exit 1
fi

echo "✅ La catégorie n'a pas été modifiée par l'intrus"

# ============================================================
# 8. SUPPRESSION DES DONNÉES DE TEST
# ============================================================

afficher_etape "8. SUPPRESSION DES DONNÉES DE TEST"

TOKEN="$TOKEN_UTILISATEUR_1"

CODE_HTTP=$(requete_http "DELETE" "$API_URL/categories/$CATEGORIE_1_ID")
verifier_code_http "$CODE_HTTP" "200" "Suppression de la première catégorie"

TOKEN="$TOKEN_UTILISATEUR_2"

CODE_HTTP=$(requete_http "DELETE" "$API_URL/categories/$CATEGORIE_2_ID")
verifier_code_http "$CODE_HTTP" "200" "Suppression de la seconde catégorie"

CODE_HTTP=$(requete_http "DELETE" "$API_URL/utilisateurs/$UTILISATEUR_2_ID")
verifier_code_http "$CODE_HTTP" "200" "Suppression du second utilisateur"

TOKEN="$TOKEN_UTILISATEUR_1"

CODE_HTTP=$(requete_http "DELETE" "$API_URL/utilisateurs/$UTILISATEUR_1_ID")
verifier_code_http "$CODE_HTTP" "200" "Suppression du premier utilisateur"

rm -f "$RESPONSE_FILE"

afficher_etape "✅ AUTORISATIONS DES CATÉGORIES VALIDÉES"