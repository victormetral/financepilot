#!/usr/bin/env bash

# Tests d'erreur de FinancePilot : validation, ressources absentes,
# doublons et suppressions bloquées par les clés étrangères.
set -euo pipefail

BACKEND_URL="http://localhost:3000"
API_URL="$BACKEND_URL/api"
TIMESTAMP=$(date +%s)
RESPONSE_FILE="/tmp/financepilot-errors-$$.json"

USER_ID=""
TOKEN=""
ACCOUNT_ID=""
CATEGORY_ID=""
BUDGET_ID=""
ASSET_ID=""
TRANSACTION_ID=""
OPERATION_ID=""
TEST_COUNT=0

request() {
  local method="$1"
  local url="$2"
  local body="${3-}"
  local curl_options=(-sS -o "$RESPONSE_FILE" -w "%{http_code}" -X "$method")

  if [[ -n "$TOKEN" ]]; then
    curl_options+=(-H "Authorization: Bearer $TOKEN")
  fi

  if [[ -n "$body" ]]; then
    curl_options+=(-H "Content-Type: application/json" -d "$body")
  fi

  curl "${curl_options[@]}" "$url"
}

expect_status() {
  local label="$1"
  local expected_status="$2"
  local method="$3"
  local url="$4"
  local body="${5-}"
  local actual_status

  TEST_COUNT=$((TEST_COUNT + 1))
  actual_status=$(request "$method" "$url" "$body")

  if [[ "$actual_status" == "$expected_status" ]]; then
    echo "✅ Test $TEST_COUNT — $label → HTTP $actual_status"
    return
  fi

  echo "❌ ÉCHEC — $label"
  echo "Attendu : HTTP $expected_status | Reçu : HTTP $actual_status"
  cat "$RESPONSE_FILE"
  exit 1
}

create_test_data() {
  local variable_name="$1"
  local label="$2"
  local url="$3"
  local body="$4"
  local status
  local id

  status=$(request POST "$url" "$body")
  if [[ "$status" != "201" ]]; then
    echo "❌ Impossible de créer $label → HTTP $status"
    cat "$RESPONSE_FILE"
    exit 1
  fi

  id=$(jq -r '.id // empty' "$RESPONSE_FILE")
  if [[ -z "$id" ]]; then
    echo "❌ La création de $label ne renvoie pas d'identifiant"
    cat "$RESPONSE_FILE"
    exit 1
  fi

  printf -v "$variable_name" '%s' "$id"
  echo "✅ Donnée préparée : $label → id $id"
}

cleanup() {
  [[ -n "$OPERATION_ID" ]] && request DELETE "$API_URL/operations-investissement/$OPERATION_ID" >/dev/null || true
  [[ -n "$TRANSACTION_ID" ]] && request DELETE "$API_URL/transactions/$TRANSACTION_ID" >/dev/null || true
  [[ -n "$BUDGET_ID" ]] && request DELETE "$API_URL/budgets/$BUDGET_ID" >/dev/null || true
  [[ -n "$ASSET_ID" ]] && request DELETE "$API_URL/actifs-financiers/$ASSET_ID" >/dev/null || true
  [[ -n "$CATEGORY_ID" ]] && request DELETE "$API_URL/categories/$CATEGORY_ID" >/dev/null || true
  [[ -n "$ACCOUNT_ID" ]] && request DELETE "$API_URL/comptes/$ACCOUNT_ID" >/dev/null || true
  [[ -n "$USER_ID" ]] && request DELETE "$API_URL/utilisateurs/$USER_ID" >/dev/null || true
  rm -f "$RESPONSE_FILE"
}

trap cleanup EXIT

for command in curl jq; do
  if ! command -v "$command" >/dev/null 2>&1; then
    echo "❌ $command n'est pas installé"
    exit 1
  fi
done

if [[ "$(request GET "$BACKEND_URL/")" != "200" ]]; then
  echo "❌ Backend inaccessible"
  cat "$RESPONSE_FILE"
  exit 1
fi

echo "✅ Backend accessible"

EMAIL="errors-${TIMESTAMP}@financepilot.test"
CATEGORY_NAME="Catégorie erreurs $TIMESTAMP"
ASSET_SYMBOL="ERR${TIMESTAMP}"

create_test_data USER_ID "l'utilisateur" "$API_URL/utilisateurs" "{
  \"nom\": \"Erreurs\",
  \"prenom\": \"Test\",
  \"email\": \"$EMAIL\",
  \"mot_de_passe\": \"TestFinance123!\"
}"

if [[ "$(request POST "$API_URL/auth/connexion" "{
  \"email\": \"$EMAIL\",
  \"mot_de_passe\": \"TestFinance123!\"
}")" != "200" ]]; then
  echo "❌ Connexion de l'utilisateur de test impossible"
  cat "$RESPONSE_FILE"
  exit 1
fi

TOKEN=$(jq -r '.token // empty' "$RESPONSE_FILE")
if [[ -z "$TOKEN" ]]; then
  echo "❌ JWT absent de la réponse de connexion"
  cat "$RESPONSE_FILE"
  exit 1
fi

create_test_data ACCOUNT_ID "le compte" "$API_URL/comptes" "{
  \"nom\": \"Compte erreurs\",
  \"type_compte\": \"courant\",
  \"sous_type_compte\": \"compte_courant\",
  \"solde_initial\": 1000,
  \"devise\": \"EUR\"
}"

create_test_data CATEGORY_ID "la catégorie" "$API_URL/categories" "{
  \"nom\": \"$CATEGORY_NAME\",
  \"type_categorie\": \"depense\"
}"

create_test_data ASSET_ID "l'actif financier" "$API_URL/actifs-financiers" "{
  \"symbole\": \"$ASSET_SYMBOL\",
  \"nom\": \"Actif erreurs\",
  \"type_actif\": \"etf\",
  \"devise\": \"EUR\"
}"

create_test_data BUDGET_ID "le budget" "$API_URL/budgets" "{
  \"categorie_id\": $CATEGORY_ID,
  \"montant_limite\": 500,
  \"mois\": 8,
  \"annee\": 2026
}"

create_test_data TRANSACTION_ID "la transaction" "$API_URL/transactions" "{
  \"compte_id\": $ACCOUNT_ID,
  \"categorie_id\": $CATEGORY_ID,
  \"libelle\": \"Transaction erreurs\",
  \"montant\": -50,
  \"date_transaction\": \"2026-08-02\",
  \"type_transaction\": \"depense\"
}"

create_test_data OPERATION_ID "l'opération d'investissement" "$API_URL/operations-investissement" "{
  \"compte_id\": $ACCOUNT_ID,
  \"actif_financier_id\": $ASSET_ID,
  \"type_operation\": \"achat\",
  \"quantite\": 2,
  \"prix_unitaire\": 100,
  \"frais\": 1,
  \"date_operation\": \"2026-08-02\"
}"

# Utilisateurs
expect_status "Utilisateur vide refusé" 400 POST "$API_URL/utilisateurs" '{}'
expect_status "Utilisateur inexistant refusé" 404 GET "$API_URL/utilisateurs/999999999"
expect_status "Email en doublon refusé" 409 POST "$API_URL/utilisateurs" "{
  \"nom\": \"Doublon\", \"prenom\": \"Test\", \"email\": \"$EMAIL\", \"mot_de_passe\": \"TestFinance456!\"
}"
expect_status "Identifiant utilisateur mal formé refusé" 400 GET "$API_URL/utilisateurs/abc"
expect_status "Email mal formé refusé" 400 POST "$API_URL/utilisateurs" '{
  "nom": "Email", "prenom": "Invalide", "email": "adresse-sans-arobase", "mot_de_passe": "TestFinance123!"
}'
expect_status "Mot de passe trop court refusé" 400 POST "$API_URL/utilisateurs" '{
  "nom": "Motdepasse", "prenom": "Invalide", "email": "motdepasse.invalide@financepilot.test", "mot_de_passe": "Court1!"
}'

# Comptes
expect_status "Solde initial non numérique refusé" 400 POST "$API_URL/comptes" '{
  "nom": "Compte invalide", "type_compte": "courant", "sous_type_compte": "compte_courant", "solde_initial": "cent euros", "devise": "EUR"
}'
# 🟨 NOUVEAU : chaque champ sauf celui testé reste valide.
expect_status "Sous-type de compte absent refusé" 400 POST "$API_URL/comptes" '{
  "nom": "Compte invalide", "type_compte": "courant", "solde_initial": 1000, "devise": "EUR"
}'
expect_status "Type de compte vide refusé" 400 POST "$API_URL/comptes" '{
  "nom": "Compte invalide", "type_compte": "   ", "sous_type_compte": "compte_courant"
}'
expect_status "Identifiant compte mal formé refusé" 400 GET "$API_URL/comptes/abc"
expect_status "Compte inexistant refusé" 404 GET "$API_URL/comptes/999999999"

# Catégories
expect_status "Nom de catégorie vide refusé" 400 POST "$API_URL/categories" '{
  "nom": "   ", "type_categorie": "depense"
}'
expect_status "Catégorie en doublon refusée" 409 POST "$API_URL/categories" "{
  \"nom\": \"$CATEGORY_NAME\", \"type_categorie\": \"depense\"
}"
expect_status "Identifiant catégorie mal formé refusé" 400 GET "$API_URL/categories/abc"
expect_status "Catégorie inexistante refusée" 404 GET "$API_URL/categories/999999999"

# Transactions
expect_status "Type de transaction invalide refusé" 400 POST "$API_URL/transactions" "{
  \"compte_id\": $ACCOUNT_ID, \"categorie_id\": null, \"libelle\": \"Transaction invalide\", \"montant\": 50, \"date_transaction\": \"2026-08-02\", \"type_transaction\": \"cadeau\"
}"
expect_status "Montant de transaction non numérique refusé" 400 POST "$API_URL/transactions" "{
  \"compte_id\": $ACCOUNT_ID, \"libelle\": \"Montant invalide\", \"montant\": \"cinquante\", \"date_transaction\": \"2026-08-02\", \"type_transaction\": \"depense\"
}"
expect_status "Date de transaction impossible refusée" 400 POST "$API_URL/transactions" "{
  \"compte_id\": $ACCOUNT_ID, \"libelle\": \"Date invalide\", \"montant\": -50, \"date_transaction\": \"2026-02-30\", \"type_transaction\": \"depense\"
}"
expect_status "Identifiant de catégorie de transaction invalide refusé" 400 POST "$API_URL/transactions" "{
  \"compte_id\": $ACCOUNT_ID, \"categorie_id\": \"abc\", \"libelle\": \"Catégorie invalide\", \"montant\": -50, \"date_transaction\": \"2026-08-02\", \"type_transaction\": \"depense\"
}"
expect_status "Transaction liée à un compte inexistant refusée" 404 POST "$API_URL/transactions" '{
  "compte_id": 999999999, "categorie_id": null, "libelle": "Compte inexistant", "montant": 50, "date_transaction": "2026-08-02", "type_transaction": "revenu"
}'
expect_status "Période de transaction inversée refusée" 400 GET "$API_URL/transactions?date_debut=2026-08-31&date_fin=2026-08-01"
expect_status "Limite de transactions supérieure à 100 refusée" 400 GET "$API_URL/transactions?limite=101"
expect_status "Page de transactions égale à zéro refusée" 400 GET "$API_URL/transactions?page=0"
expect_status "Identifiant transaction mal formé refusé" 400 GET "$API_URL/transactions/abc"
expect_status "Transaction inexistante refusée" 404 GET "$API_URL/transactions/999999999"

# Budgets
expect_status "Montant limite nul refusé" 400 POST "$API_URL/budgets" "{
  \"categorie_id\": $CATEGORY_ID, \"montant_limite\": 0, \"mois\": 9, \"annee\": 2026
}"
expect_status "Mois 13 refusé" 400 POST "$API_URL/budgets" "{
  \"categorie_id\": $CATEGORY_ID, \"montant_limite\": 500, \"mois\": 13, \"annee\": 2026
}"
expect_status "Année hors limites refusée" 400 POST "$API_URL/budgets" "{
  \"categorie_id\": $CATEGORY_ID, \"montant_limite\": 500, \"mois\": 9, \"annee\": 2101
}"
expect_status "Budget lié à une catégorie inexistante refusé" 404 POST "$API_URL/budgets" '{
  "categorie_id": 999999999, "montant_limite": 500, "mois": 9, "annee": 2026
}'
expect_status "Budget mensuel en doublon refusé" 409 POST "$API_URL/budgets" "{
  \"categorie_id\": $CATEGORY_ID, \"montant_limite\": 900, \"mois\": 8, \"annee\": 2026
}"
expect_status "Limite de budgets égale à zéro refusée" 400 GET "$API_URL/budgets?limite=0"
expect_status "Page de budgets négative refusée" 400 GET "$API_URL/budgets?page=-1"
expect_status "Identifiant budget mal formé refusé" 400 GET "$API_URL/budgets/abc"
expect_status "Budget inexistant refusé" 404 GET "$API_URL/budgets/999999999"

# Objectifs
expect_status "Montant cible nul refusé" 400 POST "$API_URL/objectifs" '{
  "nom": "Objectif invalide", "montant_cible": 0
}'
expect_status "Montant actuel négatif refusé" 400 POST "$API_URL/objectifs" '{
  "nom": "Objectif invalide", "montant_cible": 1000, "montant_actuel": -1
}'
expect_status "Date d'échéance impossible refusée" 400 POST "$API_URL/objectifs" '{
  "nom": "Objectif invalide", "montant_cible": 1000, "date_echeance": "2026-02-30"
}'
expect_status "Statut d'objectif invalide refusé" 400 POST "$API_URL/objectifs" '{
  "nom": "Objectif invalide", "montant_cible": 1000, "statut": "presque fini"
}'
expect_status "Identifiant objectif mal formé refusé" 400 GET "$API_URL/objectifs/abc"
expect_status "Objectif inexistant refusé" 404 GET "$API_URL/objectifs/999999999"

# Actifs financiers
expect_status "Type d'actif invalide refusé" 400 POST "$API_URL/actifs-financiers" "{
  \"symbole\": \"INVALIDE$TIMESTAMP\", \"nom\": \"Actif invalide\", \"type_actif\": \"voiture\", \"devise\": \"EUR\"
}"
expect_status "Devise vide refusée" 400 POST "$API_URL/actifs-financiers" "{
  \"symbole\": \"VIDE$TIMESTAMP\", \"nom\": \"Actif invalide\", \"type_actif\": \"action\", \"devise\": \"   \"
}"
expect_status "Actif financier en doublon refusé" 409 POST "$API_URL/actifs-financiers" "{
  \"symbole\": \"$ASSET_SYMBOL\", \"nom\": \"Actif en doublon\", \"type_actif\": \"etf\", \"devise\": \"EUR\"
}"
expect_status "Identifiant actif financier mal formé refusé" 400 GET "$API_URL/actifs-financiers/abc"
expect_status "Actif financier inexistant refusé" 404 GET "$API_URL/actifs-financiers/999999999"

# Opérations d'investissement
expect_status "Quantité nulle refusée" 400 POST "$API_URL/operations-investissement" "{
  \"compte_id\": $ACCOUNT_ID, \"actif_financier_id\": $ASSET_ID, \"type_operation\": \"achat\", \"quantite\": 0, \"prix_unitaire\": 100, \"date_operation\": \"2026-08-02\"
}"
expect_status "Prix unitaire négatif refusé" 400 POST "$API_URL/operations-investissement" "{
  \"compte_id\": $ACCOUNT_ID, \"actif_financier_id\": $ASSET_ID, \"type_operation\": \"achat\", \"quantite\": 1, \"prix_unitaire\": -1, \"date_operation\": \"2026-08-02\"
}"
expect_status "Frais négatifs refusés" 400 POST "$API_URL/operations-investissement" "{
  \"compte_id\": $ACCOUNT_ID, \"actif_financier_id\": $ASSET_ID, \"type_operation\": \"achat\", \"quantite\": 1, \"prix_unitaire\": 100, \"frais\": -1, \"date_operation\": \"2026-08-02\"
}"
expect_status "Date d'opération impossible refusée" 400 POST "$API_URL/operations-investissement" "{
  \"compte_id\": $ACCOUNT_ID, \"actif_financier_id\": $ASSET_ID, \"type_operation\": \"achat\", \"quantite\": 1, \"prix_unitaire\": 100, \"date_operation\": \"2026-02-30\"
}"
expect_status "Opération liée à un compte inexistant refusée" 404 POST "$API_URL/operations-investissement" "{
  \"compte_id\": 999999999, \"actif_financier_id\": $ASSET_ID, \"type_operation\": \"achat\", \"quantite\": 1, \"prix_unitaire\": 100, \"date_operation\": \"2026-08-02\"
}"
expect_status "Type d'opération vide refusé" 400 POST "$API_URL/operations-investissement" "{
  \"compte_id\": $ACCOUNT_ID, \"actif_financier_id\": $ASSET_ID, \"type_operation\": \"   \", \"quantite\": 1, \"prix_unitaire\": 100, \"date_operation\": \"2026-08-02\"
}"
expect_status "Identifiant opération mal formé refusé" 400 GET "$API_URL/operations-investissement/abc"
expect_status "Opération d'investissement inexistante refusée" 404 GET "$API_URL/operations-investissement/999999999"

# Suppressions protégées
expect_status "Suppression de l'utilisateur encore utilisé refusée" 409 DELETE "$API_URL/utilisateurs/$USER_ID"
expect_status "Suppression du compte encore utilisé refusée" 409 DELETE "$API_URL/comptes/$ACCOUNT_ID"
expect_status "Suppression de la catégorie encore utilisée refusée" 409 DELETE "$API_URL/categories/$CATEGORY_ID"
expect_status "Suppression de l'actif encore utilisé refusée" 409 DELETE "$API_URL/actifs-financiers/$ASSET_ID"

echo "✅ Les $TEST_COUNT tests d'erreur ont réussi"
