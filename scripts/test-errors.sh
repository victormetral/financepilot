#!/usr/bin/env bash

# ============================================================
# TESTS D'ERREUR DE FINANCEPILOT
# ============================================================
#
# Rôle :
# vérifie la validation des données, les ressources absentes,
# les doublons et les suppressions bloquées par les clés
# étrangères.
#
# Utilise :
# - scripts/lib/test-helpers.sh (mutualisé)
#
# Depuis Lot 5 : la session passe par un cookie httpOnly stocké
# dans COOKIE_JAR par curl — plus de JWT à extraire du JSON.
#
# actif_financier est réservé aux administrateurs en écriture :
# l'utilisateur de test est promu via psql, puis reconnecté pour
# obtenir un cookie contenant le rôle.
#
# Ajouter un test = une ligne expect_status.
# ============================================================

set -euo pipefail

BACKEND_URL="http://localhost:3000"
API_URL="$BACKEND_URL/api"
DATABASE_URL="postgresql://${DB_USER:-financepilot}:${DB_PASSWORD:-financepilot}@${DB_HOST:-localhost}:${DB_PORT:-5434}/${DB_NAME:-financepilot}"
RESPONSE_FILE="/tmp/financepilot-errors-$$.json"
COOKIE_JAR="/tmp/cookies-financepilot-errors-$$.txt"

TIMESTAMP=$(date +%s)
EMAIL="errors-${TIMESTAMP}@financepilot.test"
MOT_DE_PASSE="TestFinance123!"
NOM_CATEGORIE="Catégorie erreurs $TIMESTAMP"
SYMBOLE_ACTIF="ERR${TIMESTAMP}"

UTILISATEUR_ID=""
COMPTE_ID=""
CATEGORIE_ID=""
BUDGET_ID=""
ACTIF_ID=""
TRANSACTION_ID=""
OPERATION_ID=""
NOMBRE_TESTS=0

source "$(dirname "$0")/lib/test-helpers.sh"

# Vérifie qu'une requête renvoie le code attendu, en numérotant
# les tests au passage (NOMBRE_TESTS).
expect_status() {
  local libelle="$1"
  local code_attendu="$2"
  local methode="$3"
  local url="$4"
  local corps="${5-}"
  local code_recu

  NOMBRE_TESTS=$((NOMBRE_TESTS + 1))
  code_recu=$(requete_http "$methode" "$url" "$corps")
  verifier_code_http "$code_recu" "$code_attendu" "Test $NOMBRE_TESTS — $libelle"
}

# Crée une donnée de test et place son identifiant dans la
# variable nommée en premier argument (printf -v).
preparer_donnee() {
  local nom_variable="$1"
  local libelle="$2"
  local route="$3"
  local corps="$4"
  local code_http
  local identifiant

  code_http=$(requete_http POST "$API_URL/$route" "$corps")

  if [[ "$code_http" != "201" ]]; then
    echo "❌ Impossible de créer $libelle → HTTP $code_http"
    cat "$RESPONSE_FILE"
    exit 1
  fi

  identifiant=$(recuperer_identifiant "$libelle")
  printf -v "$nom_variable" '%s' "$identifiant"
  echo "✅ Donnée préparée : $libelle → id $identifiant"
}

# Ouvre une session : le cookie reçu écrase le précédent, ce qui
# permet aussi de rafraîchir le rôle après la promotion admin.
ouvrir_session() {
  local libelle="$1"

  if [[ "$(requete_http POST "$API_URL/auth/connexion" "{
    \"email\": \"$EMAIL\", \"mot_de_passe\": \"$MOT_DE_PASSE\"
  }")" != "200" ]]; then
    echo "❌ $libelle impossible"
    cat "$RESPONSE_FILE"
    exit 1
  fi

  echo "✅ $libelle"
}

# Supprime les données de test, enfants avant parents.
nettoyer() {
  local ressources=(
    "operations-investissement:$OPERATION_ID"
    "transactions:$TRANSACTION_ID"
    "budgets:$BUDGET_ID"
    "actifs-financiers:$ACTIF_ID"
    "categories:$CATEGORIE_ID"
    "comptes:$COMPTE_ID"
    "utilisateurs:$UTILISATEUR_ID"
  )

  for ressource in "${ressources[@]}"; do
    local route="${ressource%%:*}"
    local identifiant="${ressource##*:}"

    [[ -n "$identifiant" ]] &&
      requete_http DELETE "$API_URL/$route/$identifiant" >/dev/null || true
  done

  rm -f "$RESPONSE_FILE" "$COOKIE_JAR"
}

trap nettoyer EXIT

# ============================================================
# PRÉREQUIS ET PRÉPARATION
# ============================================================

for outil in curl jq psql; do
  if ! command -v "$outil" >/dev/null 2>&1; then
    echo "❌ $outil n'est pas installé"
    exit 1
  fi
done

if [[ "$(requete_http GET "$BACKEND_URL/")" != "200" ]]; then
  echo "❌ Backend inaccessible"
  cat "$RESPONSE_FILE"
  exit 1
fi

echo "✅ Backend accessible"

preparer_donnee UTILISATEUR_ID "l'utilisateur" "utilisateurs" "{
  \"nom\": \"Erreurs\", \"prenom\": \"Test\",
  \"email\": \"$EMAIL\", \"mot_de_passe\": \"$MOT_DE_PASSE\"
}"

ouvrir_session "Connexion de l'utilisateur de test"

preparer_donnee COMPTE_ID "le compte" "comptes" "{
  \"nom\": \"Compte erreurs\", \"type_compte\": \"courant\",
  \"sous_type_compte\": \"compte_courant\",
  \"solde_initial\": 1000, \"devise\": \"EUR\"
}"

preparer_donnee CATEGORIE_ID "la catégorie" "categories" "{
  \"nom\": \"$NOM_CATEGORIE\", \"type_categorie\": \"depense\"
}"

psql "$DATABASE_URL" -q -c \
  "UPDATE utilisateur SET role = 'administrateur' WHERE id = $UTILISATEUR_ID;"

ouvrir_session "Utilisateur de test promu administrateur"

preparer_donnee ACTIF_ID "l'actif financier" "actifs-financiers" "{
  \"symbole\": \"$SYMBOLE_ACTIF\", \"nom\": \"Actif erreurs\",
  \"type_actif\": \"etf\", \"devise\": \"EUR\"
}"

preparer_donnee BUDGET_ID "le budget" "budgets" "{
  \"categorie_id\": $CATEGORIE_ID, \"montant_limite\": 500,
  \"mois\": 8, \"annee\": 2026
}"

preparer_donnee TRANSACTION_ID "la transaction" "transactions" "{
  \"compte_id\": $COMPTE_ID, \"categorie_id\": $CATEGORIE_ID,
  \"libelle\": \"Transaction erreurs\", \"montant\": -50,
  \"date_transaction\": \"2026-08-02\", \"type_transaction\": \"depense\"
}"

preparer_donnee OPERATION_ID "l'opération d'investissement" "operations-investissement" "{
  \"compte_id\": $COMPTE_ID, \"actif_financier_id\": $ACTIF_ID,
  \"type_operation\": \"achat\", \"quantite\": 2,
  \"prix_unitaire\": 100, \"frais\": 1, \"date_operation\": \"2026-08-02\"
}"

# ============================================================
# UTILISATEURS
# ============================================================

expect_status "Utilisateur vide refusé" 400 POST "$API_URL/utilisateurs" '{}'
expect_status "Utilisateur inexistant refusé" 404 GET "$API_URL/utilisateurs/999999999"
expect_status "Identifiant utilisateur mal formé refusé" 400 GET "$API_URL/utilisateurs/abc"
expect_status "Email en doublon refusé" 409 POST "$API_URL/utilisateurs" "{
  \"nom\": \"Doublon\", \"prenom\": \"Test\", \"email\": \"$EMAIL\", \"mot_de_passe\": \"TestFinance456!\"
}"
expect_status "Email mal formé refusé" 400 POST "$API_URL/utilisateurs" '{
  "nom": "Email", "prenom": "Invalide", "email": "adresse-sans-arobase", "mot_de_passe": "TestFinance123!"
}'
expect_status "Mot de passe trop court refusé" 400 POST "$API_URL/utilisateurs" '{
  "nom": "Motdepasse", "prenom": "Invalide", "email": "court@financepilot.test", "mot_de_passe": "Court1!"
}'

# ============================================================
# COMPTES
# ============================================================

expect_status "Identifiant compte mal formé refusé" 400 GET "$API_URL/comptes/abc"
expect_status "Compte inexistant refusé" 404 GET "$API_URL/comptes/999999999"
expect_status "Solde initial non numérique refusé" 400 POST "$API_URL/comptes" '{
  "nom": "Compte invalide", "type_compte": "courant", "sous_type_compte": "compte_courant", "solde_initial": "cent euros", "devise": "EUR"
}'
expect_status "Sous-type de compte absent refusé" 400 POST "$API_URL/comptes" '{
  "nom": "Compte invalide", "type_compte": "courant", "solde_initial": 1000, "devise": "EUR"
}'
expect_status "Type de compte vide refusé" 400 POST "$API_URL/comptes" '{
  "nom": "Compte invalide", "type_compte": "   ", "sous_type_compte": "compte_courant"
}'

# ============================================================
# CATÉGORIES
# ============================================================

expect_status "Identifiant catégorie mal formé refusé" 400 GET "$API_URL/categories/abc"
expect_status "Catégorie inexistante refusée" 404 GET "$API_URL/categories/999999999"
expect_status "Nom de catégorie vide refusé" 400 POST "$API_URL/categories" '{
  "nom": "   ", "type_categorie": "depense"
}'
expect_status "Catégorie en doublon refusée" 409 POST "$API_URL/categories" "{
  \"nom\": \"$NOM_CATEGORIE\", \"type_categorie\": \"depense\"
}"

# ============================================================
# TRANSACTIONS
# ============================================================

expect_status "Identifiant transaction mal formé refusé" 400 GET "$API_URL/transactions/abc"
expect_status "Transaction inexistante refusée" 404 GET "$API_URL/transactions/999999999"
expect_status "Période de transaction inversée refusée" 400 GET "$API_URL/transactions?date_debut=2026-08-31&date_fin=2026-08-01"
expect_status "Limite de transactions supérieure à 100 refusée" 400 GET "$API_URL/transactions?limite=101"
expect_status "Page de transactions égale à zéro refusée" 400 GET "$API_URL/transactions?page=0"
expect_status "Type de transaction invalide refusé" 400 POST "$API_URL/transactions" "{
  \"compte_id\": $COMPTE_ID, \"categorie_id\": null, \"libelle\": \"Transaction invalide\", \"montant\": 50, \"date_transaction\": \"2026-08-02\", \"type_transaction\": \"cadeau\"
}"
expect_status "Montant de transaction non numérique refusé" 400 POST "$API_URL/transactions" "{
  \"compte_id\": $COMPTE_ID, \"libelle\": \"Montant invalide\", \"montant\": \"cinquante\", \"date_transaction\": \"2026-08-02\", \"type_transaction\": \"depense\"
}"
expect_status "Date de transaction impossible refusée" 400 POST "$API_URL/transactions" "{
  \"compte_id\": $COMPTE_ID, \"libelle\": \"Date invalide\", \"montant\": -50, \"date_transaction\": \"2026-02-30\", \"type_transaction\": \"depense\"
}"
expect_status "Identifiant de catégorie de transaction invalide refusé" 400 POST "$API_URL/transactions" "{
  \"compte_id\": $COMPTE_ID, \"categorie_id\": \"abc\", \"libelle\": \"Catégorie invalide\", \"montant\": -50, \"date_transaction\": \"2026-08-02\", \"type_transaction\": \"depense\"
}"
expect_status "Transaction liée à un compte inexistant refusée" 404 POST "$API_URL/transactions" '{
  "compte_id": 999999999, "categorie_id": null, "libelle": "Compte inexistant", "montant": 50, "date_transaction": "2026-08-02", "type_transaction": "revenu"
}'

# ============================================================
# BUDGETS
# ============================================================

expect_status "Identifiant budget mal formé refusé" 400 GET "$API_URL/budgets/abc"
expect_status "Budget inexistant refusé" 404 GET "$API_URL/budgets/999999999"
expect_status "Limite de budgets égale à zéro refusée" 400 GET "$API_URL/budgets?limite=0"
expect_status "Page de budgets négative refusée" 400 GET "$API_URL/budgets?page=-1"
expect_status "Montant limite nul refusé" 400 POST "$API_URL/budgets" "{
  \"categorie_id\": $CATEGORIE_ID, \"montant_limite\": 0, \"mois\": 9, \"annee\": 2026
}"
expect_status "Mois 13 refusé" 400 POST "$API_URL/budgets" "{
  \"categorie_id\": $CATEGORIE_ID, \"montant_limite\": 500, \"mois\": 13, \"annee\": 2026
}"
expect_status "Année hors limites refusée" 400 POST "$API_URL/budgets" "{
  \"categorie_id\": $CATEGORIE_ID, \"montant_limite\": 500, \"mois\": 9, \"annee\": 2101
}"
expect_status "Budget lié à une catégorie inexistante refusé" 404 POST "$API_URL/budgets" '{
  "categorie_id": 999999999, "montant_limite": 500, "mois": 9, "annee": 2026
}'
expect_status "Budget mensuel en doublon refusé" 409 POST "$API_URL/budgets" "{
  \"categorie_id\": $CATEGORIE_ID, \"montant_limite\": 900, \"mois\": 8, \"annee\": 2026
}"

# ============================================================
# OBJECTIFS
# ============================================================

expect_status "Identifiant objectif mal formé refusé" 400 GET "$API_URL/objectifs/abc"
expect_status "Objectif inexistant refusé" 404 GET "$API_URL/objectifs/999999999"
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

# ============================================================
# ACTIFS FINANCIERS
# ============================================================

expect_status "Identifiant actif financier mal formé refusé" 400 GET "$API_URL/actifs-financiers/abc"
expect_status "Actif financier inexistant refusé" 404 GET "$API_URL/actifs-financiers/999999999"
expect_status "Type d'actif invalide refusé" 400 POST "$API_URL/actifs-financiers" "{
  \"symbole\": \"INVALIDE$TIMESTAMP\", \"nom\": \"Actif invalide\", \"type_actif\": \"voiture\", \"devise\": \"EUR\"
}"
expect_status "Devise vide refusée" 400 POST "$API_URL/actifs-financiers" "{
  \"symbole\": \"VIDE$TIMESTAMP\", \"nom\": \"Actif invalide\", \"type_actif\": \"action\", \"devise\": \"   \"
}"
expect_status "Actif financier en doublon refusé" 409 POST "$API_URL/actifs-financiers" "{
  \"symbole\": \"$SYMBOLE_ACTIF\", \"nom\": \"Actif en doublon\", \"type_actif\": \"etf\", \"devise\": \"EUR\"
}"

# ============================================================
# OPÉRATIONS D'INVESTISSEMENT
# ============================================================

expect_status "Identifiant opération mal formé refusé" 400 GET "$API_URL/operations-investissement/abc"
expect_status "Opération d'investissement inexistante refusée" 404 GET "$API_URL/operations-investissement/999999999"
expect_status "Quantité nulle refusée" 400 POST "$API_URL/operations-investissement" "{
  \"compte_id\": $COMPTE_ID, \"actif_financier_id\": $ACTIF_ID, \"type_operation\": \"achat\", \"quantite\": 0, \"prix_unitaire\": 100, \"date_operation\": \"2026-08-02\"
}"
expect_status "Prix unitaire négatif refusé" 400 POST "$API_URL/operations-investissement" "{
  \"compte_id\": $COMPTE_ID, \"actif_financier_id\": $ACTIF_ID, \"type_operation\": \"achat\", \"quantite\": 1, \"prix_unitaire\": -1, \"date_operation\": \"2026-08-02\"
}"
expect_status "Frais négatifs refusés" 400 POST "$API_URL/operations-investissement" "{
  \"compte_id\": $COMPTE_ID, \"actif_financier_id\": $ACTIF_ID, \"type_operation\": \"achat\", \"quantite\": 1, \"prix_unitaire\": 100, \"frais\": -1, \"date_operation\": \"2026-08-02\"
}"
expect_status "Date d'opération impossible refusée" 400 POST "$API_URL/operations-investissement" "{
  \"compte_id\": $COMPTE_ID, \"actif_financier_id\": $ACTIF_ID, \"type_operation\": \"achat\", \"quantite\": 1, \"prix_unitaire\": 100, \"date_operation\": \"2026-02-30\"
}"
expect_status "Type d'opération vide refusé" 400 POST "$API_URL/operations-investissement" "{
  \"compte_id\": $COMPTE_ID, \"actif_financier_id\": $ACTIF_ID, \"type_operation\": \"   \", \"quantite\": 1, \"prix_unitaire\": 100, \"date_operation\": \"2026-08-02\"
}"
expect_status "Opération liée à un compte inexistant refusée" 404 POST "$API_URL/operations-investissement" "{
  \"compte_id\": 999999999, \"actif_financier_id\": $ACTIF_ID, \"type_operation\": \"achat\", \"quantite\": 1, \"prix_unitaire\": 100, \"date_operation\": \"2026-08-02\"
}"

# ============================================================
# SUPPRESSIONS PROTÉGÉES PAR LES CLÉS ÉTRANGÈRES
# ============================================================

expect_status "Suppression de l'utilisateur encore utilisé refusée" 409 DELETE "$API_URL/utilisateurs/$UTILISATEUR_ID"
expect_status "Suppression du compte encore utilisé refusée" 409 DELETE "$API_URL/comptes/$COMPTE_ID"
expect_status "Suppression de la catégorie encore utilisée refusée" 409 DELETE "$API_URL/categories/$CATEGORIE_ID"
expect_status "Suppression de l'actif encore utilisé refusée" 409 DELETE "$API_URL/actifs-financiers/$ACTIF_ID"

echo "✅ Les $NOMBRE_TESTS tests d'erreur ont réussi"