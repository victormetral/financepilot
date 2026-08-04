#!/usr/bin/env bash

# ============================================================
# TEST DES AUTORISATIONS DU CRUD CATÉGORIES
# ============================================================
#
# Ce script vérifie que :
#
# - une catégorie appartient à l’utilisateur du JWT ;
# - utilisateur_id envoyé dans le JSON est ignoré ;
# - un utilisateur ne voit que ses catégories ;
# - il ne peut pas consulter, modifier ou supprimer
#   la catégorie d’un autre utilisateur.
# ============================================================

set -e

API_URL="http://localhost:3000/api"

FICHIER_REPONSE="/tmp/reponse-autorisation-categories.json"

TOKEN=""

TIMESTAMP=$(date +%s)

MOT_DE_PASSE="TestFinance123!"

afficher_etape() {
  echo
  echo "=================================================="
  echo "$1"
  echo "=================================================="
}

verifier_code_http() {
  code_recu="$1"
  code_attendu="$2"
  nom_test="$3"

  if [ "$code_recu" != "$code_attendu" ]; then
    echo "❌ ÉCHEC : $nom_test"
    echo "Code attendu : $code_attendu"
    echo "Code reçu    : $code_recu"
    echo
    echo "Réponse reçue :"
    cat "$FICHIER_REPONSE"
    echo
    exit 1
  fi

  echo "✅ $nom_test → HTTP $code_recu"
}

requete_http() {
  methode="$1"
  url="$2"
  donnees="${3:-}"

  if [ -n "$donnees" ] && [ -n "$TOKEN" ]; then
    curl -sS \
      -o "$FICHIER_REPONSE" \
      -w "%{http_code}" \
      -X "$methode" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d "$donnees" \
      "$url"

  elif [ -n "$donnees" ]; then
    curl -sS \
      -o "$FICHIER_REPONSE" \
      -w "%{http_code}" \
      -X "$methode" \
      -H "Content-Type: application/json" \
      -d "$donnees" \
      "$url"

  elif [ -n "$TOKEN" ]; then
    curl -sS \
      -o "$FICHIER_REPONSE" \
      -w "%{http_code}" \
      -X "$methode" \
      -H "Authorization: Bearer $TOKEN" \
      "$url"

  else
    curl -sS \
      -o "$FICHIER_REPONSE" \
      -w "%{http_code}" \
      -X "$methode" \
      "$url"
  fi
}

# ============================================================
# 1. VÉRIFICATION DES PRÉREQUIS
# ============================================================

afficher_etape "1. VÉRIFICATION DES PRÉREQUIS"

if ! command -v curl >/dev/null 2>&1; then
  echo "❌ curl n’est pas installé."
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "❌ jq n’est pas installé."
  exit 1
fi

CODE_HTTP=$(requete_http \
  "GET" \
  "http://localhost:3000/")

verifier_code_http \
  "$CODE_HTTP" \
  "200" \
  "Backend accessible"

# ============================================================
# 2. CRÉATION ET CONNEXION DU PREMIER UTILISATEUR
# ============================================================

afficher_etape "2. CRÉATION DU PREMIER UTILISATEUR"

EMAIL_UTILISATEUR_1="categorie-1-${TIMESTAMP}@financepilot.test"

CODE_HTTP=$(requete_http \
  "POST" \
  "$API_URL/utilisateurs" \
  "{
    \"nom\": \"Propriétaire\",
    \"prenom\": \"Catégorie\",
    \"email\": \"$EMAIL_UTILISATEUR_1\",
    \"mot_de_passe\": \"$MOT_DE_PASSE\"
  }")

verifier_code_http \
  "$CODE_HTTP" \
  "201" \
  "Création du premier utilisateur"

UTILISATEUR_1_ID=$(jq -r '.id' "$FICHIER_REPONSE")

CODE_HTTP=$(requete_http \
  "POST" \
  "$API_URL/auth/connexion" \
  "{
    \"email\": \"$EMAIL_UTILISATEUR_1\",
    \"mot_de_passe\": \"$MOT_DE_PASSE\"
  }")

verifier_code_http \
  "$CODE_HTTP" \
  "200" \
  "Connexion du premier utilisateur"

TOKEN_UTILISATEUR_1=$(jq -r '.token' "$FICHIER_REPONSE")

# ============================================================
# 3. CRÉATION ET CONNEXION DU SECOND UTILISATEUR
# ============================================================

afficher_etape "3. CRÉATION DU SECOND UTILISATEUR"

TOKEN=""

EMAIL_UTILISATEUR_2="categorie-2-${TIMESTAMP}@financepilot.test"

CODE_HTTP=$(requete_http \
  "POST" \
  "$API_URL/utilisateurs" \
  "{
    \"nom\": \"Intrus\",
    \"prenom\": \"Catégorie\",
    \"email\": \"$EMAIL_UTILISATEUR_2\",
    \"mot_de_passe\": \"$MOT_DE_PASSE\"
  }")

verifier_code_http \
  "$CODE_HTTP" \
  "201" \
  "Création du second utilisateur"

UTILISATEUR_2_ID=$(jq -r '.id' "$FICHIER_REPONSE")

CODE_HTTP=$(requete_http \
  "POST" \
  "$API_URL/auth/connexion" \
  "{
    \"email\": \"$EMAIL_UTILISATEUR_2\",
    \"mot_de_passe\": \"$MOT_DE_PASSE\"
  }")

verifier_code_http \
  "$CODE_HTTP" \
  "200" \
  "Connexion du second utilisateur"

TOKEN_UTILISATEUR_2=$(jq -r '.token' "$FICHIER_REPONSE")

# ============================================================
# 4. CRÉATION DES CATÉGORIES
# ============================================================

afficher_etape "4. CRÉATION DES CATÉGORIES"

TOKEN="$TOKEN_UTILISATEUR_1"

CODE_HTTP=$(requete_http \
  "POST" \
  "$API_URL/categories" \
  "{
    \"utilisateur_id\": $UTILISATEUR_2_ID,
    \"nom\": \"Alimentation ${TIMESTAMP}\",
    \"type_categorie\": \"depense\"
  }")

verifier_code_http \
  "$CODE_HTTP" \
  "201" \
  "Création de la catégorie du premier utilisateur"

CATEGORIE_1_ID=$(jq -r '.id' "$FICHIER_REPONSE")

PROPRIETAIRE_CATEGORIE=$(jq -r '.utilisateur_id' "$FICHIER_REPONSE")

if [ "$PROPRIETAIRE_CATEGORIE" != "$UTILISATEUR_1_ID" ]; then
  echo "❌ utilisateur_id envoyé dans le JSON n’a pas été ignoré."
  cat "$FICHIER_REPONSE"
  exit 1
fi

echo "✅ Le propriétaire vient bien du JWT"

TOKEN="$TOKEN_UTILISATEUR_2"

CODE_HTTP=$(requete_http \
  "POST" \
  "$API_URL/categories" \
  "{
    \"nom\": \"Transport ${TIMESTAMP}\",
    \"type_categorie\": \"depense\"
  }")

verifier_code_http \
  "$CODE_HTTP" \
  "201" \
  "Création de la catégorie du second utilisateur"

CATEGORIE_2_ID=$(jq -r '.id' "$FICHIER_REPONSE")

# ============================================================
# 5. VÉRIFICATION DE LA LISTE PRIVÉE
# ============================================================

afficher_etape "5. LISTE PRIVÉE DU SECOND UTILISATEUR"

CODE_HTTP=$(requete_http \
  "GET" \
  "$API_URL/categories")

verifier_code_http \
  "$CODE_HTTP" \
  "200" \
  "Liste des catégories accessible"

if ! jq -e \
  --argjson categorieId "$CATEGORIE_2_ID" \
  --argjson utilisateurId "$UTILISATEUR_2_ID" \
  '
    length == 1 and
    .[0].id == $categorieId and
    .[0].utilisateur_id == $utilisateurId
  ' \
  "$FICHIER_REPONSE" >/dev/null; then

  echo "❌ Le second utilisateur ne devrait voir que sa catégorie."
  cat "$FICHIER_REPONSE"
  exit 1
fi

echo "✅ Le second utilisateur voit uniquement sa catégorie"

# ============================================================
# 6. TENTATIVES CONTRE LA CATÉGORIE ÉTRANGÈRE
# ============================================================

afficher_etape "6. TENTATIVES CONTRE LA CATÉGORIE ÉTRANGÈRE"

CODE_HTTP=$(requete_http \
  "GET" \
  "$API_URL/categories/$CATEGORIE_1_ID")

verifier_code_http \
  "$CODE_HTTP" \
  "404" \
  "Consultation de la catégorie étrangère refusée"

CODE_HTTP=$(requete_http \
  "PUT" \
  "$API_URL/categories/$CATEGORIE_1_ID" \
  "{
    \"nom\": \"Catégorie piratée\",
    \"type_categorie\": \"revenu\"
  }")

verifier_code_http \
  "$CODE_HTTP" \
  "404" \
  "Modification de la catégorie étrangère refusée"

CODE_HTTP=$(requete_http \
  "DELETE" \
  "$API_URL/categories/$CATEGORIE_1_ID")

verifier_code_http \
  "$CODE_HTTP" \
  "404" \
  "Suppression de la catégorie étrangère refusée"

# ============================================================
# 7. VÉRIFICATION AVEC LE PROPRIÉTAIRE
# ============================================================

afficher_etape "7. VÉRIFICATION AVEC LE PROPRIÉTAIRE"

TOKEN="$TOKEN_UTILISATEUR_1"

CODE_HTTP=$(requete_http \
  "GET" \
  "$API_URL/categories/$CATEGORIE_1_ID")

verifier_code_http \
  "$CODE_HTTP" \
  "200" \
  "Le propriétaire peut consulter sa catégorie"

NOM_CATEGORIE=$(jq -r '.nom' "$FICHIER_REPONSE")

if [ "$NOM_CATEGORIE" != "Alimentation ${TIMESTAMP}" ]; then
  echo "❌ La tentative étrangère a modifié la catégorie."
  cat "$FICHIER_REPONSE"
  exit 1
fi

echo "✅ La catégorie n’a pas été modifiée par l’intrus"

# ============================================================
# 8. SUPPRESSION DES DONNÉES DE TEST
# ============================================================

afficher_etape "8. SUPPRESSION DES DONNÉES DE TEST"

TOKEN="$TOKEN_UTILISATEUR_1"

CODE_HTTP=$(requete_http \
  "DELETE" \
  "$API_URL/categories/$CATEGORIE_1_ID")

verifier_code_http \
  "$CODE_HTTP" \
  "200" \
  "Suppression de la première catégorie"

TOKEN="$TOKEN_UTILISATEUR_2"

CODE_HTTP=$(requete_http \
  "DELETE" \
  "$API_URL/categories/$CATEGORIE_2_ID")

verifier_code_http \
  "$CODE_HTTP" \
  "200" \
  "Suppression de la seconde catégorie"

CODE_HTTP=$(requete_http \
  "DELETE" \
  "$API_URL/utilisateurs/$UTILISATEUR_2_ID")

verifier_code_http \
  "$CODE_HTTP" \
  "200" \
  "Suppression du second utilisateur"

TOKEN="$TOKEN_UTILISATEUR_1"

CODE_HTTP=$(requete_http \
  "DELETE" \
  "$API_URL/utilisateurs/$UTILISATEUR_1_ID")

verifier_code_http \
  "$CODE_HTTP" \
  "200" \
  "Suppression du premier utilisateur"

rm -f "$FICHIER_REPONSE"

afficher_etape "✅ AUTORISATIONS DES CATÉGORIES VALIDÉES"