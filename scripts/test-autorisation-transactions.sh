#!/usr/bin/env bash

# ============================================================
# TEST DES AUTORISATIONS DU CRUD TRANSACTIONS
# ============================================================
#
# Ce script vérifie que :
#
# - une transaction est accessible uniquement au propriétaire
#   du compte auquel elle appartient ;
# - la liste contient uniquement les transactions
#   de l’utilisateur authentifié ;
# - un utilisateur ne peut pas consulter, modifier
#   ou supprimer la transaction d’un autre utilisateur.
#
# Prérequis :
# - PostgreSQL doit être démarré ;
# - le backend doit fonctionner sur localhost:3000 ;
# - jq doit être installé.
# ============================================================

set -e

API_URL="http://localhost:3000/api"

FICHIER_REPONSE="/tmp/reponse-autorisation-transactions.json"

TOKEN=""

TIMESTAMP=$(date +%s)

DATE_TEST=$(date "+%Y-%m-%d")

MOT_DE_PASSE="TestFinance123!"

# ------------------------------------------------------------
# Affichage des étapes
# ------------------------------------------------------------

afficher_etape() {
  echo
  echo "=================================================="
  echo "$1"
  echo "=================================================="
}

# ------------------------------------------------------------
# Vérification d’un code HTTP
# ------------------------------------------------------------

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

# ------------------------------------------------------------
# Envoi d’une requête HTTP
# ------------------------------------------------------------

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

EMAIL_UTILISATEUR_1="transaction-1-${TIMESTAMP}@financepilot.test"

CODE_HTTP=$(requete_http \
  "POST" \
  "$API_URL/utilisateurs" \
  "{
    \"nom\": \"Propriétaire\",
    \"prenom\": \"Transaction\",
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

EMAIL_UTILISATEUR_2="transaction-2-${TIMESTAMP}@financepilot.test"

CODE_HTTP=$(requete_http \
  "POST" \
  "$API_URL/utilisateurs" \
  "{
    \"nom\": \"Intrus\",
    \"prenom\": \"Transaction\",
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
# 4. CRÉATION DU COMPTE DU PREMIER UTILISATEUR
# ============================================================

afficher_etape "4. CRÉATION DU COMPTE PRIVÉ"

TOKEN="$TOKEN_UTILISATEUR_1"

CODE_HTTP=$(requete_http \
  "POST" \
  "$API_URL/comptes" \
  "{
    \"nom\": \"Compte transaction privé\",
    \"type_compte\": \"courant\",
    \"solde_initial\": 1000,
    \"devise\": \"EUR\"
  }")

verifier_code_http \
  "$CODE_HTTP" \
  "201" \
  "Création du compte privé"

COMPTE_ID=$(jq -r '.id' "$FICHIER_REPONSE")

# ============================================================
# 5. CRÉATION DE LA CATÉGORIE DU PREMIER UTILISATEUR
# ============================================================

afficher_etape "5. CRÉATION DE LA CATÉGORIE PRIVÉE"

CODE_HTTP=$(requete_http \
  "POST" \
  "$API_URL/categories" \
  "{
    \"nom\": \"Transaction privée ${TIMESTAMP}\",
    \"type_categorie\": \"depense\"
  }")

verifier_code_http \
  "$CODE_HTTP" \
  "201" \
  "Création de la catégorie privée"

CATEGORIE_ID=$(jq -r '.id' "$FICHIER_REPONSE")

# ============================================================
# 6. CRÉATION DE LA TRANSACTION
# ============================================================

afficher_etape "6. CRÉATION DE LA TRANSACTION PRIVÉE"

CODE_HTTP=$(requete_http \
  "POST" \
  "$API_URL/transactions" \
  "{
    \"compte_id\": $COMPTE_ID,
    \"categorie_id\": $CATEGORIE_ID,
    \"libelle\": \"Transaction secrète\",
    \"montant\": 42.50,
    \"date_transaction\": \"$DATE_TEST\",
    \"type_transaction\": \"depense\"
  }")

verifier_code_http \
  "$CODE_HTTP" \
  "201" \
  "Création de la transaction privée"

TRANSACTION_ID=$(jq -r '.id' "$FICHIER_REPONSE")

echo "Transaction créée avec l’identifiant : $TRANSACTION_ID"

# ============================================================
# 7. VÉRIFICATION DE LA LISTE PRIVÉE
# ============================================================

afficher_etape "7. LISTE PRIVÉE DU SECOND UTILISATEUR"

TOKEN="$TOKEN_UTILISATEUR_2"

CODE_HTTP=$(requete_http \
  "GET" \
  "$API_URL/transactions")

verifier_code_http \
  "$CODE_HTTP" \
  "200" \
  "Liste des transactions accessible"

# 🟨 NOUVEAU
# La réponse de cette route contient :
# {
#   "transactions": [],
#   "pagination": {}
# }
if ! jq -e \
  --argjson transactionId "$TRANSACTION_ID" \
  '
    [.transactions[] | select(.id == $transactionId)]
    | length == 0
  ' \
  "$FICHIER_REPONSE" >/dev/null; then

  echo "❌ Le second utilisateur voit la transaction du premier."
  cat "$FICHIER_REPONSE"
  exit 1
fi

echo "✅ La transaction privée est absente de la liste de l’intrus"

# ============================================================
# 8. TENTATIVES CONTRE LA TRANSACTION ÉTRANGÈRE
# ============================================================

afficher_etape "8. TENTATIVES CONTRE LA TRANSACTION ÉTRANGÈRE"

CODE_HTTP=$(requete_http \
  "GET" \
  "$API_URL/transactions/$TRANSACTION_ID")

verifier_code_http \
  "$CODE_HTTP" \
  "404" \
  "Consultation de la transaction étrangère refusée"

CODE_HTTP=$(requete_http \
  "PUT" \
  "$API_URL/transactions/$TRANSACTION_ID" \
  "{
    \"compte_id\": $COMPTE_ID,
    \"categorie_id\": $CATEGORIE_ID,
    \"libelle\": \"Transaction piratée\",
    \"montant\": 0,
    \"date_transaction\": \"$DATE_TEST\",
    \"type_transaction\": \"depense\"
  }")

verifier_code_http \
  "$CODE_HTTP" \
  "404" \
  "Modification de la transaction étrangère refusée"

CODE_HTTP=$(requete_http \
  "DELETE" \
  "$API_URL/transactions/$TRANSACTION_ID")

verifier_code_http \
  "$CODE_HTTP" \
  "404" \
  "Suppression de la transaction étrangère refusée"

# ============================================================
# 9. VÉRIFICATION AVEC LE PROPRIÉTAIRE
# ============================================================

afficher_etape "9. VÉRIFICATION AVEC LE PROPRIÉTAIRE"

TOKEN="$TOKEN_UTILISATEUR_1"

CODE_HTTP=$(requete_http \
  "GET" \
  "$API_URL/transactions/$TRANSACTION_ID")

verifier_code_http \
  "$CODE_HTTP" \
  "200" \
  "Le propriétaire peut consulter sa transaction"

LIBELLE_TRANSACTION=$(jq -r '.libelle' "$FICHIER_REPONSE")

if [ "$LIBELLE_TRANSACTION" != "Transaction secrète" ]; then
  echo "❌ La tentative étrangère a modifié la transaction."
  cat "$FICHIER_REPONSE"
  exit 1
fi

echo "✅ La transaction n’a pas été modifiée par l’intrus"

# ============================================================
# 10. SUPPRESSION DES DONNÉES DE TEST
# ============================================================

afficher_etape "10. SUPPRESSION DES DONNÉES DE TEST"

CODE_HTTP=$(requete_http \
  "DELETE" \
  "$API_URL/transactions/$TRANSACTION_ID")

verifier_code_http \
  "$CODE_HTTP" \
  "200" \
  "Suppression de la transaction par son propriétaire"

CODE_HTTP=$(requete_http \
  "DELETE" \
  "$API_URL/categories/$CATEGORIE_ID")

verifier_code_http \
  "$CODE_HTTP" \
  "200" \
  "Suppression de la catégorie"

CODE_HTTP=$(requete_http \
  "DELETE" \
  "$API_URL/comptes/$COMPTE_ID")

verifier_code_http \
  "$CODE_HTTP" \
  "200" \
  "Suppression du compte"

TOKEN="$TOKEN_UTILISATEUR_2"

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

TOKEN=""

rm -f "$FICHIER_REPONSE"

afficher_etape "✅ AUTORISATIONS DES TRANSACTIONS VALIDÉES"