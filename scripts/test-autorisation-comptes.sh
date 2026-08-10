#!/usr/bin/env bash

# ============================================================
# TEST DES AUTORISATIONS DU CRUD COMPTES
# ============================================================
#
# Rôle :
# vérifie que :
# - l'identité du propriétaire vient du JWT ;
# - utilisateur_id envoyé dans le JSON est ignoré ;
# - un utilisateur ne voit pas les comptes d'un autre ;
# - il ne peut ni les consulter, ni les modifier, ni les
#   supprimer.
#
# Utilise :
# - scripts/lib/test-helpers.sh (afficher_etape, requete_http,
#   verifier_code_http — mutualisé)
# ============================================================

set -e

API_URL="http://localhost:3000/api"
RESPONSE_FILE="/tmp/reponse-autorisation-comptes.json"
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
# 2. CRÉATION DU PREMIER UTILISATEUR
# ============================================================

afficher_etape "2. CRÉATION DU PREMIER UTILISATEUR"

EMAIL_UTILISATEUR_1="autorisation-1-${TIMESTAMP}@financepilot.test"

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
# 3. CRÉATION DU SECOND UTILISATEUR
# ============================================================

afficher_etape "3. CRÉATION DU SECOND UTILISATEUR"

TOKEN=""
EMAIL_UTILISATEUR_2="autorisation-2-${TIMESTAMP}@financepilot.test"

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
# 4. CRÉATION DU COMPTE PAR LE PREMIER UTILISATEUR
# ============================================================

afficher_etape "4. CRÉATION DU COMPTE PRIVÉ"

TOKEN="$TOKEN_UTILISATEUR_1"

CODE_HTTP=$(requete_http "POST" "$API_URL/comptes" "{
  \"utilisateur_id\": $UTILISATEUR_2_ID,
  \"nom\": \"Compte privé\",
  \"type_compte\": \"courant\",
  \"sous_type_compte\": \"compte_courant\",
  \"solde_initial\": 1000,
  \"devise\": \"EUR\"
}")
verifier_code_http "$CODE_HTTP" "201" "Création du compte par le premier utilisateur"

COMPTE_ID=$(jq -r '.id' "$RESPONSE_FILE")
PROPRIETAIRE_RECU=$(jq -r '.utilisateur_id' "$RESPONSE_FILE")

if [ "$PROPRIETAIRE_RECU" != "$UTILISATEUR_1_ID" ]; then
  echo "❌ Le propriétaire ne provient pas du JWT."
  echo "Propriétaire attendu : $UTILISATEUR_1_ID"
  echo "Propriétaire reçu    : $PROPRIETAIRE_RECU"
  exit 1
fi

echo "✅ utilisateur_id envoyé dans le JSON ignoré"
echo "✅ Le propriétaire vient bien du JWT"

# ============================================================
# 5. TESTS AVEC LE SECOND UTILISATEUR
# ============================================================

afficher_etape "5. TENTATIVES D'ACCÈS DU SECOND UTILISATEUR"

TOKEN="$TOKEN_UTILISATEUR_2"

CODE_HTTP=$(requete_http "GET" "$API_URL/comptes")
verifier_code_http "$CODE_HTTP" "200" "Liste des comptes du second utilisateur"

if ! jq -e 'length == 0' "$RESPONSE_FILE" >/dev/null; then
  echo "❌ Le second utilisateur voit un compte qui ne lui appartient pas."
  cat "$RESPONSE_FILE"
  exit 1
fi

echo "✅ Le compte du premier utilisateur est absent de la liste"

CODE_HTTP=$(requete_http "GET" "$API_URL/comptes/$COMPTE_ID")
verifier_code_http "$CODE_HTTP" "404" "Consultation du compte étranger refusée"

CODE_HTTP=$(requete_http "PUT" "$API_URL/comptes/$COMPTE_ID" "{
  \"nom\": \"Compte piraté\",
  \"type_compte\": \"courant\",
  \"sous_type_compte\": \"compte_courant\",
  \"solde_initial\": 0,
  \"devise\": \"EUR\"
}")
verifier_code_http "$CODE_HTTP" "404" "Modification du compte étranger refusée"

CODE_HTTP=$(requete_http "DELETE" "$API_URL/comptes/$COMPTE_ID")
verifier_code_http "$CODE_HTTP" "404" "Suppression du compte étranger refusée"

# ============================================================
# 6. VÉRIFICATION AVEC LE PROPRIÉTAIRE
# ============================================================

afficher_etape "6. VÉRIFICATION AVEC LE PROPRIÉTAIRE"

TOKEN="$TOKEN_UTILISATEUR_1"

CODE_HTTP=$(requete_http "GET" "$API_URL/comptes/$COMPTE_ID")
verifier_code_http "$CODE_HTTP" "200" "Le propriétaire peut consulter son compte"

NOM_COMPTE=$(jq -r '.nom' "$RESPONSE_FILE")

if [ "$NOM_COMPTE" != "Compte privé" ]; then
  echo "❌ La tentative de modification étrangère a modifié le compte."
  exit 1
fi

echo "✅ Le compte n'a pas été modifié par le second utilisateur"

# ============================================================
# 7. SUPPRESSION DES DONNÉES DE TEST
# ============================================================

afficher_etape "7. SUPPRESSION DES DONNÉES DE TEST"

CODE_HTTP=$(requete_http "DELETE" "$API_URL/comptes/$COMPTE_ID")
verifier_code_http "$CODE_HTTP" "200" "Suppression du compte par son propriétaire"

TOKEN="$TOKEN_UTILISATEUR_2"

CODE_HTTP=$(requete_http "DELETE" "$API_URL/utilisateurs/$UTILISATEUR_2_ID")
verifier_code_http "$CODE_HTTP" "200" "Suppression du second utilisateur"

TOKEN="$TOKEN_UTILISATEUR_1"

CODE_HTTP=$(requete_http "DELETE" "$API_URL/utilisateurs/$UTILISATEUR_1_ID")
verifier_code_http "$CODE_HTTP" "200" "Suppression du premier utilisateur"

TOKEN=""

rm -f "$RESPONSE_FILE"

afficher_etape "✅ AUTORISATIONS DES COMPTES VALIDÉES"