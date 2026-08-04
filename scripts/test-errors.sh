#!/usr/bin/env bash

# ============================================================
# TESTS D'ERREUR COMPLETS DE FINANCEPILOT
# ============================================================
#
# Rôle : vérifier les erreurs renvoyées par les 8 ressources :
# - validateurs : HTTP 400 Bad Request ;
# - ressources inexistantes : HTTP 404 Not Found ;
# - doublons et clés étrangères : HTTP 409 Conflict.
#
# Le script crée ses propres données de test et les supprime,
# même s'il s'arrête avant la fin.
#
# Prérequis :
# - PostgreSQL et le backend sont démarrés ;
# - l'API écoute sur http://localhost:3000 ;
# - curl et jq sont installés.
# ============================================================

# 🟨 CORRIGÉ : -e arrête le script en cas d'erreur,
# -u refuse une variable inexistante et pipefail détecte
# une erreur située dans n'importe quelle partie d'un pipe.
set -euo pipefail

API_URL="http://localhost:3000/api"
TIMESTAMP=$(date +%s)

# $$ représente l'identifiant du processus Bash actuel.
# Chaque exécution utilise donc son propre fichier temporaire.
FICHIER_REPONSE="/tmp/reponse-errors-financepilot-$$.json"

# Identifiants des données temporaires.
# Ils restent vides tant que les ressources ne sont pas créées.
UTILISATEUR_ID=""
COMPTE_ID=""
CATEGORIE_ID=""
BUDGET_ID=""
ACTIF_ID=""
TRANSACTION_ID=""
OPERATION_ID=""

NOMBRE_TESTS=0


# ------------------------------------------------------------
# OUTILS COMMUNS
# ------------------------------------------------------------

# 🟨 CORRIGÉ : centralise curl pour ne plus répéter
# toutes ses options dans chacun des tests.
requete_http() {
  local methode="$1"
  local url="$2"
  local donnees="${3-}"

  if [ -n "$donnees" ]; then
    curl \
      -sS \
      -o "$FICHIER_REPONSE" \
      -w "%{http_code}" \
      -X "$methode" \
      -H "Content-Type: application/json" \
      -d "$donnees" \
      "$url"
  else
    curl \
      -sS \
      -o "$FICHIER_REPONSE" \
      -w "%{http_code}" \
      -X "$methode" \
      "$url"
  fi
}

# Exécute un test et compare le code reçu au code attendu.
tester_erreur() {
  local nom_test="$1"
  local code_attendu="$2"
  local methode="$3"
  local url="$4"
  local donnees="${5-}"
  local code_recu

  NOMBRE_TESTS=$((NOMBRE_TESTS + 1))

  echo ""
  echo "=== TEST $NOMBRE_TESTS : $nom_test ==="

  code_recu=$(
    requete_http \
      "$methode" \
      "$url" \
      "$donnees"
  )

  if [ "$code_recu" = "$code_attendu" ]; then
    echo "✅ $nom_test → HTTP $code_recu"
    return
  fi

  echo "❌ ÉCHEC : $nom_test"
  echo "❌ Code attendu : $code_attendu"
  echo "❌ Code reçu : $code_recu"
  echo "Réponse du backend :"
  cat "$FICHIER_REPONSE"
  echo ""
  exit 1
}

# Crée une donnée nécessaire aux tests suivants et mémorise son id.
# Le premier paramètre est le nom de la variable à remplir.
creer_donnee_test() {
  local nom_variable_id="$1"
  local nom_ressource="$2"
  local url="$3"
  local donnees="$4"
  local code_recu
  local id_recu

  code_recu=$(
    requete_http \
      "POST" \
      "$url" \
      "$donnees"
  )

  if [ "$code_recu" != "201" ]; then
    echo "❌ Impossible de créer la donnée de test : $nom_ressource"
    echo "❌ Code attendu : 201"
    echo "❌ Code reçu : $code_recu"
    cat "$FICHIER_REPONSE"
    echo ""
    exit 1
  fi

  id_recu=$(jq -r '.id' "$FICHIER_REPONSE")

  if [ -z "$id_recu" ] || [ "$id_recu" = "null" ]; then
    echo "❌ La création de $nom_ressource n'a renvoyé aucun id"
    cat "$FICHIER_REPONSE"
    echo ""
    exit 1
  fi

  printf -v "$nom_variable_id" '%s' "$id_recu"
  echo "✅ Donnée préparée : $nom_ressource → id $id_recu"
}

# Supprime toutes les données temporaires dans l'ordre inverse
# des clés étrangères : enfants d'abord, parents ensuite.
nettoyer_donnees_test() {
  if [ -n "$OPERATION_ID" ]; then
    curl -sS -o /dev/null -X DELETE \
      "$API_URL/operations-investissement/$OPERATION_ID" || true
  fi

  if [ -n "$TRANSACTION_ID" ]; then
    curl -sS -o /dev/null -X DELETE \
      "$API_URL/transactions/$TRANSACTION_ID" || true
  fi

  if [ -n "$BUDGET_ID" ]; then
    curl -sS -o /dev/null -X DELETE \
      "$API_URL/budgets/$BUDGET_ID" || true
  fi

  if [ -n "$ACTIF_ID" ]; then
    curl -sS -o /dev/null -X DELETE \
      "$API_URL/actifs-financiers/$ACTIF_ID" || true
  fi

  if [ -n "$CATEGORIE_ID" ]; then
    curl -sS -o /dev/null -X DELETE \
      "$API_URL/categories/$CATEGORIE_ID" || true
  fi

  if [ -n "$COMPTE_ID" ]; then
    curl -sS -o /dev/null -X DELETE \
      "$API_URL/comptes/$COMPTE_ID" || true
  fi

  if [ -n "$UTILISATEUR_ID" ]; then
    curl -sS -o /dev/null -X DELETE \
      "$API_URL/utilisateurs/$UTILISATEUR_ID" || true
  fi

  rm -f "$FICHIER_REPONSE"
}

# EXIT déclenche ce nettoyage lors d'une réussite ou d'une erreur.
trap nettoyer_donnees_test EXIT


# ------------------------------------------------------------
# VÉRIFICATION DES PRÉREQUIS
# ------------------------------------------------------------

echo "=== VÉRIFICATION DES PRÉREQUIS ==="

if ! command -v curl >/dev/null 2>&1; then
  echo "❌ curl n'est pas installé"
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "❌ jq n'est pas installé"
  echo "Installation sur macOS : brew install jq"
  exit 1
fi

CODE_HTTP=$(requete_http "GET" "$API_URL/utilisateurs")

if [ "$CODE_HTTP" != "200" ]; then
  echo "❌ Backend inaccessible"
  echo "❌ Code attendu : 200"
  echo "❌ Code reçu : $CODE_HTTP"
  cat "$FICHIER_REPONSE"
  echo ""
  exit 1
fi

echo "✅ Backend accessible → HTTP $CODE_HTTP"


# ------------------------------------------------------------
# DONNÉES TEMPORAIRES UTILISÉES PAR LES TESTS
# ------------------------------------------------------------

echo ""
echo "=== PRÉPARATION DES DONNÉES TEMPORAIRES ==="

EMAIL_TEST="errors-${TIMESTAMP}@financepilot.test"
CATEGORIE_TEST="Catégorie erreurs $TIMESTAMP"
SYMBOLE_TEST="ERR${TIMESTAMP}"

creer_donnee_test \
  "UTILISATEUR_ID" \
  "utilisateur" \
  "$API_URL/utilisateurs" \
  "{
    \"nom\": \"Erreurs\",
    \"prenom\": \"Test\",
    \"email\": \"$EMAIL_TEST\",
    \"mot_de_passe\": \"TestFinance123!\"
  }"

creer_donnee_test \
  "COMPTE_ID" \
  "compte" \
  "$API_URL/comptes" \
  "{
    \"utilisateur_id\": $UTILISATEUR_ID,
    \"nom\": \"Compte erreurs\",
    \"type_compte\": \"courant\",
    \"solde_initial\": 1000,
    \"devise\": \"EUR\"
  }"

creer_donnee_test \
  "CATEGORIE_ID" \
  "catégorie" \
  "$API_URL/categories" \
  "{
    \"utilisateur_id\": $UTILISATEUR_ID,
    \"nom\": \"$CATEGORIE_TEST\",
    \"type_categorie\": \"depense\"
  }"

creer_donnee_test \
  "ACTIF_ID" \
  "actif financier" \
  "$API_URL/actifs-financiers" \
  "{
    \"symbole\": \"$SYMBOLE_TEST\",
    \"nom\": \"Actif erreurs\",
    \"type_actif\": \"etf\",
    \"devise\": \"EUR\"
  }"

creer_donnee_test \
  "BUDGET_ID" \
  "budget" \
  "$API_URL/budgets" \
  "{
    \"utilisateur_id\": $UTILISATEUR_ID,
    \"categorie_id\": $CATEGORIE_ID,
    \"montant_limite\": 500,
    \"mois\": 8,
    \"annee\": 2026
  }"

creer_donnee_test \
  "TRANSACTION_ID" \
  "transaction" \
  "$API_URL/transactions" \
  "{
    \"compte_id\": $COMPTE_ID,
    \"categorie_id\": $CATEGORIE_ID,
    \"libelle\": \"Transaction erreurs\",
    \"montant\": -50,
    \"date_transaction\": \"2026-08-02\",
    \"type_transaction\": \"depense\"
  }"

creer_donnee_test \
  "OPERATION_ID" \
  "opération d'investissement" \
  "$API_URL/operations-investissement" \
  "{
    \"compte_id\": $COMPTE_ID,
    \"actif_financier_id\": $ACTIF_ID,
    \"type_operation\": \"achat\",
    \"quantite\": 2,
    \"prix_unitaire\": 100,
    \"frais\": 1,
    \"date_operation\": \"2026-08-02\"
  }"


# ============================================================
# 1. UTILISATEURS
# ============================================================

tester_erreur \
  "Utilisateur vide refusé" \
  "400" \
  "POST" \
  "$API_URL/utilisateurs" \
  '{}'

tester_erreur \
  "Utilisateur inexistant refusé" \
  "404" \
  "GET" \
  "$API_URL/utilisateurs/999999999"

tester_erreur \
  "Email en doublon refusé" \
  "409" \
  "POST" \
  "$API_URL/utilisateurs" \
  "{
    \"nom\": \"Doublon\",
    \"prenom\": \"Test\",
    \"email\": \"$EMAIL_TEST\",
    \"mot_de_passe\": \"TestFinance456!\"
  }"

tester_erreur \
  "Identifiant utilisateur mal formé refusé" \
  "400" \
  "GET" \
  "$API_URL/utilisateurs/abc"

tester_erreur \
  "Email mal formé refusé" \
  "400" \
  "POST" \
  "$API_URL/utilisateurs" \
  '{
    "nom": "Email",
    "prenom": "Invalide",
    "email": "adresse-sans-arobase",
    "mot_de_passe": "TestFinance123!"
  }'

tester_erreur \
  "Mot de passe trop court refusé" \
  "400" \
  "POST" \
  "$API_URL/utilisateurs" \
  '{
    "nom": "Motdepasse",
    "prenom": "Invalide",
    "email": "motdepasse.invalide@financepilot.test",
    "mot_de_passe": "Court1!"
  }'


# ============================================================
# 2. COMPTES
# ============================================================

tester_erreur \
  "Compte lié à un utilisateur inexistant refusé" \
  "409" \
  "POST" \
  "$API_URL/comptes" \
  '{
    "utilisateur_id": 999999999,
    "nom": "Compte impossible",
    "type_compte": "courant",
    "solde_initial": 100,
    "devise": "EUR"
  }'

tester_erreur \
  "Solde initial non numérique refusé" \
  "400" \
  "POST" \
  "$API_URL/comptes" \
  "{
    \"utilisateur_id\": $UTILISATEUR_ID,
    \"nom\": \"Compte invalide\",
    \"type_compte\": \"courant\",
    \"solde_initial\": \"cent euros\",
    \"devise\": \"EUR\"
  }"

tester_erreur \
  "Type de compte vide refusé" \
  "400" \
  "POST" \
  "$API_URL/comptes" \
  "{
    \"utilisateur_id\": $UTILISATEUR_ID,
    \"nom\": \"Compte invalide\",
    \"type_compte\": \"   \"
  }"

tester_erreur \
  "Identifiant compte mal formé refusé" \
  "400" \
  "GET" \
  "$API_URL/comptes/abc"

tester_erreur \
  "Compte inexistant refusé" \
  "404" \
  "GET" \
  "$API_URL/comptes/999999999"


# ============================================================
# 3. CATÉGORIES
# ============================================================

tester_erreur \
  "Nom de catégorie vide refusé" \
  "400" \
  "POST" \
  "$API_URL/categories" \
  "{
    \"utilisateur_id\": $UTILISATEUR_ID,
    \"nom\": \"   \",
    \"type_categorie\": \"depense\"
  }"

tester_erreur \
  "Catégorie liée à un utilisateur inexistant refusée" \
  "409" \
  "POST" \
  "$API_URL/categories" \
  '{
    "utilisateur_id": 999999999,
    "nom": "Catégorie impossible",
    "type_categorie": "depense"
  }'

tester_erreur \
  "Catégorie en doublon refusée" \
  "409" \
  "POST" \
  "$API_URL/categories" \
  "{
    \"utilisateur_id\": $UTILISATEUR_ID,
    \"nom\": \"$CATEGORIE_TEST\",
    \"type_categorie\": \"depense\"
  }"

tester_erreur \
  "Identifiant catégorie mal formé refusé" \
  "400" \
  "GET" \
  "$API_URL/categories/abc"

tester_erreur \
  "Catégorie inexistante refusée" \
  "404" \
  "GET" \
  "$API_URL/categories/999999999"


# ============================================================
# 4. TRANSACTIONS
# ============================================================

tester_erreur \
  "Type de transaction invalide refusé" \
  "400" \
  "POST" \
  "$API_URL/transactions" \
  "{
    \"compte_id\": $COMPTE_ID,
    \"categorie_id\": null,
    \"libelle\": \"Transaction invalide\",
    \"montant\": 50,
    \"date_transaction\": \"2026-08-02\",
    \"type_transaction\": \"cadeau\"
  }"

# 🟨 NOUVEAU : tous les tests suivants étaient encore à ajouter.
tester_erreur \
  "Montant de transaction non numérique refusé" \
  "400" \
  "POST" \
  "$API_URL/transactions" \
  "{
    \"compte_id\": $COMPTE_ID,
    \"libelle\": \"Montant invalide\",
    \"montant\": \"cinquante\",
    \"date_transaction\": \"2026-08-02\",
    \"type_transaction\": \"depense\"
  }"

tester_erreur \
  "Date de transaction impossible refusée" \
  "400" \
  "POST" \
  "$API_URL/transactions" \
  "{
    \"compte_id\": $COMPTE_ID,
    \"libelle\": \"Date invalide\",
    \"montant\": -50,
    \"date_transaction\": \"2026-02-30\",
    \"type_transaction\": \"depense\"
  }"

tester_erreur \
  "Identifiant de catégorie de transaction invalide refusé" \
  "400" \
  "POST" \
  "$API_URL/transactions" \
  "{
    \"compte_id\": $COMPTE_ID,
    \"categorie_id\": \"abc\",
    \"libelle\": \"Catégorie invalide\",
    \"montant\": -50,
    \"date_transaction\": \"2026-08-02\",
    \"type_transaction\": \"depense\"
  }"

tester_erreur \
  "Transaction liée à un compte inexistant refusée" \
  "409" \
  "POST" \
  "$API_URL/transactions" \
  '{
    "compte_id": 999999999,
    "categorie_id": null,
    "libelle": "Compte inexistant",
    "montant": 50,
    "date_transaction": "2026-08-02",
    "type_transaction": "revenu"
  }'

tester_erreur \
  "Période de transaction inversée refusée" \
  "400" \
  "GET" \
  "$API_URL/transactions?date_debut=2026-08-31&date_fin=2026-08-01"

tester_erreur \
  "Limite de transactions supérieure à 100 refusée" \
  "400" \
  "GET" \
  "$API_URL/transactions?limite=101"

tester_erreur \
  "Page de transactions égale à zéro refusée" \
  "400" \
  "GET" \
  "$API_URL/transactions?page=0"

tester_erreur \
  "Identifiant transaction mal formé refusé" \
  "400" \
  "GET" \
  "$API_URL/transactions/abc"

tester_erreur \
  "Transaction inexistante refusée" \
  "404" \
  "GET" \
  "$API_URL/transactions/999999999"


# ============================================================
# 5. BUDGETS
# ============================================================

tester_erreur \
  "Montant limite nul refusé" \
  "400" \
  "POST" \
  "$API_URL/budgets" \
  "{
    \"utilisateur_id\": $UTILISATEUR_ID,
    \"categorie_id\": $CATEGORIE_ID,
    \"montant_limite\": 0,
    \"mois\": 9,
    \"annee\": 2026
  }"

tester_erreur \
  "Mois 13 refusé" \
  "400" \
  "POST" \
  "$API_URL/budgets" \
  "{
    \"utilisateur_id\": $UTILISATEUR_ID,
    \"categorie_id\": $CATEGORIE_ID,
    \"montant_limite\": 500,
    \"mois\": 13,
    \"annee\": 2026
  }"

tester_erreur \
  "Année hors limites refusée" \
  "400" \
  "POST" \
  "$API_URL/budgets" \
  "{
    \"utilisateur_id\": $UTILISATEUR_ID,
    \"categorie_id\": $CATEGORIE_ID,
    \"montant_limite\": 500,
    \"mois\": 9,
    \"annee\": 2101
  }"

tester_erreur \
  "Budget lié à une catégorie inexistante refusé" \
  "409" \
  "POST" \
  "$API_URL/budgets" \
  "{
    \"utilisateur_id\": $UTILISATEUR_ID,
    \"categorie_id\": 999999999,
    \"montant_limite\": 500,
    \"mois\": 9,
    \"annee\": 2026
  }"

tester_erreur \
  "Budget mensuel en doublon refusé" \
  "409" \
  "POST" \
  "$API_URL/budgets" \
  "{
    \"utilisateur_id\": $UTILISATEUR_ID,
    \"categorie_id\": $CATEGORIE_ID,
    \"montant_limite\": 900,
    \"mois\": 8,
    \"annee\": 2026
  }"

tester_erreur \
  "Limite de budgets égale à zéro refusée" \
  "400" \
  "GET" \
  "$API_URL/budgets?limite=0"

tester_erreur \
  "Page de budgets négative refusée" \
  "400" \
  "GET" \
  "$API_URL/budgets?page=-1"

tester_erreur \
  "Identifiant budget mal formé refusé" \
  "400" \
  "GET" \
  "$API_URL/budgets/abc"

tester_erreur \
  "Budget inexistant refusé" \
  "404" \
  "GET" \
  "$API_URL/budgets/999999999"


# ============================================================
# 6. OBJECTIFS
# ============================================================

tester_erreur \
  "Montant cible nul refusé" \
  "400" \
  "POST" \
  "$API_URL/objectifs" \
  "{
    \"utilisateur_id\": $UTILISATEUR_ID,
    \"nom\": \"Objectif invalide\",
    \"montant_cible\": 0
  }"

tester_erreur \
  "Montant actuel négatif refusé" \
  "400" \
  "POST" \
  "$API_URL/objectifs" \
  "{
    \"utilisateur_id\": $UTILISATEUR_ID,
    \"nom\": \"Objectif invalide\",
    \"montant_cible\": 1000,
    \"montant_actuel\": -1
  }"

tester_erreur \
  "Date d'échéance impossible refusée" \
  "400" \
  "POST" \
  "$API_URL/objectifs" \
  "{
    \"utilisateur_id\": $UTILISATEUR_ID,
    \"nom\": \"Objectif invalide\",
    \"montant_cible\": 1000,
    \"date_echeance\": \"2026-02-30\"
  }"

tester_erreur \
  "Statut d'objectif invalide refusé" \
  "400" \
  "POST" \
  "$API_URL/objectifs" \
  "{
    \"utilisateur_id\": $UTILISATEUR_ID,
    \"nom\": \"Objectif invalide\",
    \"montant_cible\": 1000,
    \"statut\": \"presque fini\"
  }"

tester_erreur \
  "Objectif lié à un utilisateur inexistant refusé" \
  "409" \
  "POST" \
  "$API_URL/objectifs" \
  '{
    "utilisateur_id": 999999999,
    "nom": "Objectif impossible",
    "montant_cible": 1000
  }'

tester_erreur \
  "Identifiant objectif mal formé refusé" \
  "400" \
  "GET" \
  "$API_URL/objectifs/abc"

tester_erreur \
  "Objectif inexistant refusé" \
  "404" \
  "GET" \
  "$API_URL/objectifs/999999999"


# ============================================================
# 7. ACTIFS FINANCIERS
# ============================================================

tester_erreur \
  "Type d'actif invalide refusé" \
  "400" \
  "POST" \
  "$API_URL/actifs-financiers" \
  "{
    \"symbole\": \"INVALIDE$TIMESTAMP\",
    \"nom\": \"Actif invalide\",
    \"type_actif\": \"voiture\",
    \"devise\": \"EUR\"
  }"

tester_erreur \
  "Devise vide refusée" \
  "400" \
  "POST" \
  "$API_URL/actifs-financiers" \
  "{
    \"symbole\": \"VIDE$TIMESTAMP\",
    \"nom\": \"Actif invalide\",
    \"type_actif\": \"action\",
    \"devise\": \"   \"
  }"

tester_erreur \
  "Actif financier en doublon refusé" \
  "409" \
  "POST" \
  "$API_URL/actifs-financiers" \
  "{
    \"symbole\": \"$SYMBOLE_TEST\",
    \"nom\": \"Actif en doublon\",
    \"type_actif\": \"etf\",
    \"devise\": \"EUR\"
  }"

tester_erreur \
  "Identifiant actif financier mal formé refusé" \
  "400" \
  "GET" \
  "$API_URL/actifs-financiers/abc"

tester_erreur \
  "Actif financier inexistant refusé" \
  "404" \
  "GET" \
  "$API_URL/actifs-financiers/999999999"


# ============================================================
# 8. OPÉRATIONS D'INVESTISSEMENT
# ============================================================

tester_erreur \
  "Quantité nulle refusée" \
  "400" \
  "POST" \
  "$API_URL/operations-investissement" \
  "{
    \"compte_id\": $COMPTE_ID,
    \"actif_financier_id\": $ACTIF_ID,
    \"type_operation\": \"achat\",
    \"quantite\": 0,
    \"prix_unitaire\": 100,
    \"date_operation\": \"2026-08-02\"
  }"

tester_erreur \
  "Prix unitaire négatif refusé" \
  "400" \
  "POST" \
  "$API_URL/operations-investissement" \
  "{
    \"compte_id\": $COMPTE_ID,
    \"actif_financier_id\": $ACTIF_ID,
    \"type_operation\": \"achat\",
    \"quantite\": 1,
    \"prix_unitaire\": -1,
    \"date_operation\": \"2026-08-02\"
  }"

tester_erreur \
  "Frais négatifs refusés" \
  "400" \
  "POST" \
  "$API_URL/operations-investissement" \
  "{
    \"compte_id\": $COMPTE_ID,
    \"actif_financier_id\": $ACTIF_ID,
    \"type_operation\": \"achat\",
    \"quantite\": 1,
    \"prix_unitaire\": 100,
    \"frais\": -1,
    \"date_operation\": \"2026-08-02\"
  }"

tester_erreur \
  "Date d'opération impossible refusée" \
  "400" \
  "POST" \
  "$API_URL/operations-investissement" \
  "{
    \"compte_id\": $COMPTE_ID,
    \"actif_financier_id\": $ACTIF_ID,
    \"type_operation\": \"achat\",
    \"quantite\": 1,
    \"prix_unitaire\": 100,
    \"date_operation\": \"2026-02-30\"
  }"

tester_erreur \
  "Opération liée à un compte inexistant refusée" \
  "409" \
  "POST" \
  "$API_URL/operations-investissement" \
  "{
    \"compte_id\": 999999999,
    \"actif_financier_id\": $ACTIF_ID,
    \"type_operation\": \"achat\",
    \"quantite\": 1,
    \"prix_unitaire\": 100,
    \"date_operation\": \"2026-08-02\"
  }"

tester_erreur \
  "Type d'opération vide refusé" \
  "400" \
  "POST" \
  "$API_URL/operations-investissement" \
  "{
    \"compte_id\": $COMPTE_ID,
    \"actif_financier_id\": $ACTIF_ID,
    \"type_operation\": \"   \",
    \"quantite\": 1,
    \"prix_unitaire\": 100,
    \"date_operation\": \"2026-08-02\"
  }"

tester_erreur \
  "Identifiant opération mal formé refusé" \
  "400" \
  "GET" \
  "$API_URL/operations-investissement/abc"

tester_erreur \
  "Opération d'investissement inexistante refusée" \
  "404" \
  "GET" \
  "$API_URL/operations-investissement/999999999"


# ============================================================
# 9. SUPPRESSIONS PROTÉGÉES PAR LES CLÉS ÉTRANGÈRES
# ============================================================

tester_erreur \
  "Suppression de l'utilisateur encore utilisé refusée" \
  "409" \
  "DELETE" \
  "$API_URL/utilisateurs/$UTILISATEUR_ID"

tester_erreur \
  "Suppression du compte encore utilisé refusée" \
  "409" \
  "DELETE" \
  "$API_URL/comptes/$COMPTE_ID"

tester_erreur \
  "Suppression de la catégorie encore utilisée refusée" \
  "409" \
  "DELETE" \
  "$API_URL/categories/$CATEGORIE_ID"

tester_erreur \
  "Suppression de l'actif encore utilisé refusée" \
  "409" \
  "DELETE" \
  "$API_URL/actifs-financiers/$ACTIF_ID"


# ------------------------------------------------------------
# FIN
# ------------------------------------------------------------

# Nettoyage volontaire avant le message final.
nettoyer_donnees_test

# Évite un deuxième nettoyage automatique après la réussite.
trap - EXIT

echo ""
echo "✅ Les $NOMBRE_TESTS tests d'erreur ont réussi"
test-errors.sh