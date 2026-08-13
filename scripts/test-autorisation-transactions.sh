#!/usr/bin/env bash

# ============================================================
# TEST DES AUTORISATIONS DU CRUD TRANSACTIONS
# ============================================================
#
# Rôle : vérifie qu'une transaction n'est accessible qu'au
# propriétaire du compte auquel elle appartient.
#
# Utilise : scripts/lib/test-helpers.sh (mutualisé)
# Depuis Lot 5 : un cookie jar par utilisateur.
# ============================================================

set -e

API_URL="http://localhost:3000/api"
RESPONSE_FILE="/tmp/reponse-autorisation-transactions.json"
JAR_ANONYME="/tmp/cookies-transactions-anonyme.txt"
JAR_1="/tmp/cookies-transactions-1.txt"
JAR_2="/tmp/cookies-transactions-2.txt"
COOKIE_JAR="$JAR_ANONYME"

TIMESTAMP=$(date +%s)
DATE_TEST=$(date "+%Y-%m-%d")
MOT_DE_PASSE="TestFinance123!"
EMAIL_1="transaction-1-${TIMESTAMP}@financepilot.test"
EMAIL_2="transaction-2-${TIMESTAMP}@financepilot.test"

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
  \"nom\": \"Propriétaire\", \"prenom\": \"Transaction\",
  \"email\": \"$EMAIL_1\", \"mot_de_passe\": \"$MOT_DE_PASSE\"
}")
verifier_code_http "$CODE_HTTP" "201" "Création du premier utilisateur"
UTILISATEUR_1_ID=$(recuperer_identifiant "le premier utilisateur")

CODE_HTTP=$(requete_http "POST" "$API_URL/utilisateurs" "{
  \"nom\": \"Intrus\", \"prenom\": \"Transaction\",
  \"email\": \"$EMAIL_2\", \"mot_de_passe\": \"$MOT_DE_PASSE\"
}")
verifier_code_http "$CODE_HTTP" "201" "Création du second utilisateur"
UTILISATEUR_2_ID=$(recuperer_identifiant "le second utilisateur")

ouvrir_session_pour "$JAR_1" "$EMAIL_1" "$MOT_DE_PASSE" "Connexion du premier utilisateur"
ouvrir_session_pour "$JAR_2" "$EMAIL_2" "$MOT_DE_PASSE" "Connexion du second utilisateur"

afficher_etape "3. CRÉATION DES DONNÉES PRIVÉES"

utiliser_session "$JAR_1"

CODE_HTTP=$(requete_http "POST" "$API_URL/comptes" "{
  \"nom\": \"Compte transaction privé\", \"type_compte\": \"courant\",
  \"sous_type_compte\": \"compte_courant\",
  \"solde_initial\": 1000, \"devise\": \"EUR\"
}")
verifier_code_http "$CODE_HTTP" "201" "Création du compte privé"
COMPTE_ID=$(recuperer_identifiant "le compte")

CODE_HTTP=$(requete_http "POST" "$API_URL/categories" "{
  \"nom\": \"Transaction privée ${TIMESTAMP}\", \"type_categorie\": \"depense\"
}")
verifier_code_http "$CODE_HTTP" "201" "Création de la catégorie privée"
CATEGORIE_ID=$(recuperer_identifiant "la catégorie")

CODE_HTTP=$(requete_http "POST" "$API_URL/transactions" "{
  \"compte_id\": $COMPTE_ID, \"categorie_id\": $CATEGORIE_ID,
  \"libelle\": \"Transaction secrète\", \"montant\": 42.50,
  \"date_transaction\": \"$DATE_TEST\", \"type_transaction\": \"depense\"
}")
verifier_code_http "$CODE_HTTP" "201" "Création de la transaction privée"
TRANSACTION_ID=$(recuperer_identifiant "la transaction")

afficher_etape "4. LISTE PRIVÉE DU SECOND UTILISATEUR"

utiliser_session "$JAR_2"

CODE_HTTP=$(requete_http "GET" "$API_URL/transactions")
verifier_code_http "$CODE_HTTP" "200" "Liste des transactions accessible"

# La réponse contient { "transactions": [], "pagination": {} }.
if ! jq -e --argjson transactionId "$TRANSACTION_ID" \
  '[.transactions[] | select(.id == $transactionId)] | length == 0' \
  "$RESPONSE_FILE" >/dev/null; then
  echo "❌ Le second utilisateur voit la transaction du premier."
  cat "$RESPONSE_FILE"
  exit 1
fi

echo "✅ La transaction privée est absente de la liste de l'intrus"

afficher_etape "5. TENTATIVES CONTRE LA TRANSACTION ÉTRANGÈRE"

CODE_HTTP=$(requete_http "GET" "$API_URL/transactions/$TRANSACTION_ID")
verifier_code_http "$CODE_HTTP" "404" "Consultation de la transaction étrangère refusée"

CODE_HTTP=$(requete_http "PUT" "$API_URL/transactions/$TRANSACTION_ID" "{
  \"compte_id\": $COMPTE_ID, \"categorie_id\": $CATEGORIE_ID,
  \"libelle\": \"Transaction piratée\", \"montant\": 0,
  \"date_transaction\": \"$DATE_TEST\", \"type_transaction\": \"depense\"
}")
verifier_code_http "$CODE_HTTP" "404" "Modification de la transaction étrangère refusée"

CODE_HTTP=$(requete_http "DELETE" "$API_URL/transactions/$TRANSACTION_ID")
verifier_code_http "$CODE_HTTP" "404" "Suppression de la transaction étrangère refusée"

afficher_etape "6. VÉRIFICATION AVEC LE PROPRIÉTAIRE"

utiliser_session "$JAR_1"

CODE_HTTP=$(requete_http "GET" "$API_URL/transactions/$TRANSACTION_ID")
verifier_code_http "$CODE_HTTP" "200" "Le propriétaire peut consulter sa transaction"
verifier_json '.libelle == "Transaction secrète"' "La transaction n'a pas été modifiée par l'intrus"

afficher_etape "7. SUPPRESSION DES DONNÉES DE TEST"

CODE_HTTP=$(requete_http "DELETE" "$API_URL/transactions/$TRANSACTION_ID")
verifier_code_http "$CODE_HTTP" "200" "Suppression de la transaction"

CODE_HTTP=$(requete_http "DELETE" "$API_URL/categories/$CATEGORIE_ID")
verifier_code_http "$CODE_HTTP" "200" "Suppression de la catégorie"

CODE_HTTP=$(requete_http "DELETE" "$API_URL/comptes/$COMPTE_ID")
verifier_code_http "$CODE_HTTP" "200" "Suppression du compte"

utiliser_session "$JAR_2"
CODE_HTTP=$(requete_http "DELETE" "$API_URL/utilisateurs/$UTILISATEUR_2_ID")
verifier_code_http "$CODE_HTTP" "200" "Suppression du second utilisateur"

utiliser_session "$JAR_1"
CODE_HTTP=$(requete_http "DELETE" "$API_URL/utilisateurs/$UTILISATEUR_1_ID")
verifier_code_http "$CODE_HTTP" "200" "Suppression du premier utilisateur"

afficher_etape "✅ AUTORISATIONS DES TRANSACTIONS VALIDÉES"