#!/usr/bin/env bash

# ============================================================
# TEST DES AUTORISATIONS DU CRUD TRANSACTIONS
# ============================================================
#
# Rôle :
# vérifie que :
# - une transaction est accessible uniquement au propriétaire
#   du compte auquel elle appartient ;
# - la liste contient uniquement les transactions
#   de l'utilisateur authentifié ;
# - un utilisateur ne peut pas consulter, modifier
#   ou supprimer la transaction d'un autre utilisateur.
#
# Utilise :
# - scripts/lib/test-helpers.sh (afficher_etape, requete_http,
#   verifier_code_http — mutualisé)
# ============================================================

set -e

API_URL="http://localhost:3000/api"
RESPONSE_FILE="/tmp/reponse-autorisation-transactions.json"
TOKEN=""

TIMESTAMP=$(date +%s)
DATE_TEST=$(date "+%Y-%m-%d")
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

EMAIL_UTILISATEUR_1="transaction-1-${TIMESTAMP}@financepilot.test"

CODE_HTTP=$(requete_http "POST" "$API_URL/utilisateurs" "{
  \"nom\": \"Propriétaire\",
  \"prenom\": \"Transaction\",
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
EMAIL_UTILISATEUR_2="transaction-2-${TIMESTAMP}@financepilot.test"

CODE_HTTP=$(requete_http "POST" "$API_URL/utilisateurs" "{
  \"nom\": \"Intrus\",
  \"prenom\": \"Transaction\",
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
# 4. CRÉATION DU COMPTE DU PREMIER UTILISATEUR
# ============================================================

afficher_etape "4. CRÉATION DU COMPTE PRIVÉ"

TOKEN="$TOKEN_UTILISATEUR_1"

CODE_HTTP=$(requete_http "POST" "$API_URL/comptes" "{
  \"nom\": \"Compte transaction privé\",
  \"type_compte\": \"courant\",
  \"sous_type_compte\": \"compte_courant\",
  \"solde_initial\": 1000,
  \"devise\": \"EUR\"
}")
verifier_code_http "$CODE_HTTP" "201" "Création du compte privé"

COMPTE_ID=$(jq -r '.id' "$RESPONSE_FILE")

# ============================================================
# 5. CRÉATION DE LA CATÉGORIE DU PREMIER UTILISATEUR
# ============================================================

afficher_etape "5. CRÉATION DE LA CATÉGORIE PRIVÉE"

CODE_HTTP=$(requete_http "POST" "$API_URL/categories" "{
  \"nom\": \"Transaction privée ${TIMESTAMP}\",
  \"type_categorie\": \"depense\"
}")
verifier_code_http "$CODE_HTTP" "201" "Création de la catégorie privée"

CATEGORIE_ID=$(jq -r '.id' "$RESPONSE_FILE")

# ============================================================
# 6. CRÉATION DE LA TRANSACTION
# ============================================================

afficher_etape "6. CRÉATION DE LA TRANSACTION PRIVÉE"

CODE_HTTP=$(requete_http "POST" "$API_URL/transactions" "{
  \"compte_id\": $COMPTE_ID,
  \"categorie_id\": $CATEGORIE_ID,
  \"libelle\": \"Transaction secrète\",
  \"montant\": 42.50,
  \"date_transaction\": \"$DATE_TEST\",
  \"type_transaction\": \"depense\"
}")
verifier_code_http "$CODE_HTTP" "201" "Création de la transaction privée"

TRANSACTION_ID=$(jq -r '.id' "$RESPONSE_FILE")

echo "Transaction créée avec l'identifiant : $TRANSACTION_ID"

# ============================================================
# 7. VÉRIFICATION DE LA LISTE PRIVÉE
# ============================================================

afficher_etape "7. LISTE PRIVÉE DU SECOND UTILISATEUR"

TOKEN="$TOKEN_UTILISATEUR_2"

CODE_HTTP=$(requete_http "GET" "$API_URL/transactions")
verifier_code_http "$CODE_HTTP" "200" "Liste des transactions accessible"

# La réponse de cette route contient :
# { "transactions": [], "pagination": {} }
if ! jq -e \
  --argjson transactionId "$TRANSACTION_ID" \
  '[.transactions[] | select(.id == $transactionId)] | length == 0' \
  "$RESPONSE_FILE" >/dev/null; then
  echo "❌ Le second utilisateur voit la transaction du premier."
  cat "$RESPONSE_FILE"
  exit 1
fi

echo "✅ La transaction privée est absente de la liste de l'intrus"

# ============================================================
# 8. TENTATIVES CONTRE LA TRANSACTION ÉTRANGÈRE
# ============================================================

afficher_etape "8. TENTATIVES CONTRE LA TRANSACTION ÉTRANGÈRE"

CODE_HTTP=$(requete_http "GET" "$API_URL/transactions/$TRANSACTION_ID")
verifier_code_http "$CODE_HTTP" "404" "Consultation de la transaction étrangère refusée"

CODE_HTTP=$(requete_http "PUT" "$API_URL/transactions/$TRANSACTION_ID" "{
  \"compte_id\": $COMPTE_ID,
  \"categorie_id\": $CATEGORIE_ID,
  \"libelle\": \"Transaction piratée\",
  \"montant\": 0,
  \"date_transaction\": \"$DATE_TEST\",
  \"type_transaction\": \"depense\"
}")
verifier_code_http "$CODE_HTTP" "404" "Modification de la transaction étrangère refusée"

CODE_HTTP=$(requete_http "DELETE" "$API_URL/transactions/$TRANSACTION_ID")
verifier_code_http "$CODE_HTTP" "404" "Suppression de la transaction étrangère refusée"

# ============================================================
# 9. VÉRIFICATION AVEC LE PROPRIÉTAIRE
# ============================================================

afficher_etape "9. VÉRIFICATION AVEC LE PROPRIÉTAIRE"

TOKEN="$TOKEN_UTILISATEUR_1"

CODE_HTTP=$(requete_http "GET" "$API_URL/transactions/$TRANSACTION_ID")
verifier_code_http "$CODE_HTTP" "200" "Le propriétaire peut consulter sa transaction"

LIBELLE_TRANSACTION=$(jq -r '.libelle' "$RESPONSE_FILE")

if [ "$LIBELLE_TRANSACTION" != "Transaction secrète" ]; then
  echo "❌ La tentative étrangère a modifié la transaction."
  cat "$RESPONSE_FILE"
  exit 1
fi

echo "✅ La transaction n'a pas été modifiée par l'intrus"

# ============================================================
# 10. SUPPRESSION DES DONNÉES DE TEST
# ============================================================

afficher_etape "10. SUPPRESSION DES DONNÉES DE TEST"

CODE_HTTP=$(requete_http "DELETE" "$API_URL/transactions/$TRANSACTION_ID")
verifier_code_http "$CODE_HTTP" "200" "Suppression de la transaction par son propriétaire"

CODE_HTTP=$(requete_http "DELETE" "$API_URL/categories/$CATEGORIE_ID")
verifier_code_http "$CODE_HTTP" "200" "Suppression de la catégorie"

CODE_HTTP=$(requete_http "DELETE" "$API_URL/comptes/$COMPTE_ID")
verifier_code_http "$CODE_HTTP" "200" "Suppression du compte"

TOKEN="$TOKEN_UTILISATEUR_2"

CODE_HTTP=$(requete_http "DELETE" "$API_URL/utilisateurs/$UTILISATEUR_2_ID")
verifier_code_http "$CODE_HTTP" "200" "Suppression du second utilisateur"

TOKEN="$TOKEN_UTILISATEUR_1"

CODE_HTTP=$(requete_http "DELETE" "$API_URL/utilisateurs/$UTILISATEUR_1_ID")
verifier_code_http "$CODE_HTTP" "200" "Suppression du premier utilisateur"

TOKEN=""

rm -f "$RESPONSE_FILE"

afficher_etape "✅ AUTORISATIONS DES TRANSACTIONS VALIDÉES"