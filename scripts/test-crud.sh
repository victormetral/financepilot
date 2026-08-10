#!/usr/bin/env bash

# ============================================================
# FINANCEPILOT - COMPLETE CRUD API TEST
# ============================================================
#
# Role:
# - creates one isolated user and the data it needs;
# - tests Create, Read and Update for the 8 API resources;
# - deletes the test data in dependency order at the end.
#
# The script is intentionally linear: each resource uses the identifiers
# created by the previous resources. New CRUD blocks can follow the same model.
#
# 🟨 NOUVEAU :
# actif_financier est désormais un référentiel réservé aux
# administrateurs en écriture (POST/PUT/DELETE). L'utilisateur
# de test créé ici est donc promu administrateur juste avant
# la section 7, puis reconnecté pour obtenir un JWT à jour.
# ============================================================

set -Eeuo pipefail

API_URL="http://localhost:3000/api"
DATABASE_URL="postgresql://financepilot:financepilot@localhost:5434/financepilot"
RESPONSE_FILE="/tmp/reponse-financepilot.json"
TOKEN=""
TIMESTAMP=$(date +%s)
DATE_TEST=$(date "+%Y-%m-%d")
MOIS_TEST=$(date "+%-m")
ANNEE_TEST=$(date "+%Y")
EMAIL_TEST="crud-${TIMESTAMP}@financepilot.test"
MOT_DE_PASSE_INITIAL="TestFinance123!"
MOT_DE_PASSE_MODIFIE="TestFinance456!"

nettoyer_fichier_reponse() {
  rm -f "$RESPONSE_FILE"
}

trap nettoyer_fichier_reponse EXIT

# ============================================================
# FONCTIONS COMMUNES
# ============================================================

# Affiche un titre homogène pour chaque étape du test.
afficher_etape() {
  echo
  echo "=================================================="
  echo "$1"
  echo "=================================================="
}

# Arrête le script si le code HTTP est différent de celui attendu.
verifier_code_http() {
  local code_recu="$1"
  local code_attendu="$2"
  local nom_test="$3"

  if [ "$code_recu" != "$code_attendu" ]; then
    echo "❌ ÉCHEC : $nom_test"
    echo "Code attendu : $code_attendu"
    echo "Code reçu    : $code_recu"
    echo
    echo "Réponse reçue :"
    cat "$RESPONSE_FILE"
    exit 1
  fi

  echo "✅ $nom_test → HTTP $code_recu"
} 

# Envoie une requête API, sauvegarde sa réponse JSON et renvoie son code HTTP.
# Le JWT est ajouté automatiquement dès que TOKEN contient une valeur.
requete_http() {
  local methode="$1"
  local url="$2"
  local donnees="${3:-}"
  local options_curl=(-sS -o "$RESPONSE_FILE" -w "%{http_code}" -X "$methode")

  if [ -n "$donnees" ]; then
    options_curl+=(-H "Content-Type: application/json" -d "$donnees")
  fi

  if [ -n "$TOKEN" ]; then
    options_curl+=(-H "Authorization: Bearer $TOKEN")
  fi

  curl "${options_curl[@]}" "$url"
}

# Extrait l'identifiant de la dernière réponse JSON et vérifie sa présence.
recuperer_identifiant() {
  local nom_ressource="$1"
  local identifiant

  identifiant=$(jq -r '.id // empty' "$RESPONSE_FILE")

  if [ -z "$identifiant" ]; then
    echo "❌ L'identifiant de $nom_ressource est absent de la réponse."
    cat "$RESPONSE_FILE"
    exit 1
  fi

  printf '%s' "$identifiant"
}

# Supprime une ressource à partir de sa route et de son identifiant.
# Cette fonction évite de répéter le même bloc DELETE pour chaque future ressource.
supprimer_ressource() {
  local route="$1"
  local identifiant="$2"
  local nom_test="$3"
  local code_http

  code_http=$(requete_http "DELETE" "$API_URL/$route/$identifiant")
  verifier_code_http "$code_http" "200" "$nom_test"
}

# ============================================================
# PREREQUIS
# ============================================================

afficher_etape "VÉRIFICATION DES PRÉREQUIS"

if ! command -v curl >/dev/null 2>&1; then
  echo "❌ curl n’est pas installé."
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "❌ jq n’est pas installé."
  echo "Installation avec Homebrew : brew install jq"
  exit 1
fi

CODE_HTTP=$(requete_http "GET" "http://localhost:3000/")
verifier_code_http "$CODE_HTTP" "200" "Backend accessible"

# ============================================================
# 1. USER CRUD
# ============================================================

afficher_etape "1. CRUD UTILISATEUR"

CODE_HTTP=$(requete_http "POST" "$API_URL/utilisateurs" "{
  \"nom\": \"CRUD\",
  \"prenom\": \"Test\",
  \"email\": \"$EMAIL_TEST\",
  \"mot_de_passe\": \"$MOT_DE_PASSE_INITIAL\"
}")
verifier_code_http "$CODE_HTTP" "201" "Création utilisateur"

UTILISATEUR_ID=$(recuperer_identifiant "l'utilisateur")
echo "Utilisateur créé avec l’identifiant : $UTILISATEUR_ID"

# ============================================================
# AUTHENTICATION FOR PROTECTED ROUTES
# ============================================================

afficher_etape "AUTHENTIFICATION POUR LES ROUTES PROTÉGÉES"

CODE_HTTP=$(requete_http "POST" "$API_URL/auth/connexion" "{
  \"email\": \"$EMAIL_TEST\",
  \"mot_de_passe\": \"$MOT_DE_PASSE_INITIAL\"
}")
verifier_code_http "$CODE_HTTP" "200" "Connexion utilisateur"

TOKEN=$(jq -r '.token // empty' "$RESPONSE_FILE")

if [ -z "$TOKEN" ]; then
  echo "❌ Le JWT est absent de la réponse de connexion."
  cat "$RESPONSE_FILE"
  exit 1
fi

echo "✅ JWT récupéré"

CODE_HTTP=$(requete_http "GET" "$API_URL/utilisateurs/$UTILISATEUR_ID")
verifier_code_http "$CODE_HTTP" "200" "Lecture utilisateur"

CODE_HTTP=$(requete_http "PUT" "$API_URL/utilisateurs/$UTILISATEUR_ID" "{
  \"nom\": \"CRUD modifié\",
  \"prenom\": \"Test\",
  \"email\": \"$EMAIL_TEST\",
  \"mot_de_passe\": \"$MOT_DE_PASSE_MODIFIE\"
}")
verifier_code_http "$CODE_HTTP" "200" "Modification utilisateur"

# ============================================================
# 2. ACCOUNT CRUD
# ============================================================
# 🟨 CORRIGÉ
# type_compte and sous_type_compte must always be coherent.

afficher_etape "2. CRUD COMPTE"

CODE_HTTP=$(requete_http "POST" "$API_URL/comptes" "{
  \"utilisateur_id\": $UTILISATEUR_ID,
  \"nom\": \"Compte CRUD\",
  \"type_compte\": \"courant\",
  \"sous_type_compte\": \"compte_courant\",
  \"solde_initial\": 1000,
  \"devise\": \"EUR\"
}")
verifier_code_http "$CODE_HTTP" "201" "Création compte"

COMPTE_ID=$(recuperer_identifiant "le compte")
echo "Compte créé avec l’identifiant : $COMPTE_ID"

CODE_HTTP=$(requete_http "GET" "$API_URL/comptes/$COMPTE_ID")
verifier_code_http "$CODE_HTTP" "200" "Lecture compte"

CODE_HTTP=$(requete_http "PUT" "$API_URL/comptes/$COMPTE_ID" "{
  \"nom\": \"Compte CRUD modifié\",
  \"type_compte\": \"courant\",
  \"sous_type_compte\": \"compte_courant\",
  \"solde_initial\": 1500,
  \"devise\": \"EUR\"
}")
verifier_code_http "$CODE_HTTP" "200" "Modification compte"

# ============================================================
# 3. CATEGORY CRUD
# ============================================================

afficher_etape "3. CRUD CATÉGORIE"

CODE_HTTP=$(requete_http "POST" "$API_URL/categories" "{
  \"utilisateur_id\": $UTILISATEUR_ID,
  \"nom\": \"Catégorie CRUD $TIMESTAMP\",
  \"type_categorie\": \"depense\"
}")
verifier_code_http "$CODE_HTTP" "201" "Création catégorie"

CATEGORIE_ID=$(recuperer_identifiant "la catégorie")
echo "Catégorie créée avec l’identifiant : $CATEGORIE_ID"

CODE_HTTP=$(requete_http "GET" "$API_URL/categories/$CATEGORIE_ID")
verifier_code_http "$CODE_HTTP" "200" "Lecture catégorie"

CODE_HTTP=$(requete_http "PUT" "$API_URL/categories/$CATEGORIE_ID" "{
  \"nom\": \"Catégorie CRUD modifiée $TIMESTAMP\",
  \"type_categorie\": \"depense\"
}")
verifier_code_http "$CODE_HTTP" "200" "Modification catégorie"

# ============================================================
# 4. TRANSACTION CRUD
# ============================================================

afficher_etape "4. CRUD TRANSACTION"

CODE_HTTP=$(requete_http "POST" "$API_URL/transactions" "{
  \"compte_id\": $COMPTE_ID,
  \"categorie_id\": $CATEGORIE_ID,
  \"libelle\": \"Transaction CRUD\",
  \"montant\": 42.50,
  \"date_transaction\": \"$DATE_TEST\",
  \"type_transaction\": \"depense\"
}")
verifier_code_http "$CODE_HTTP" "201" "Création transaction"

TRANSACTION_ID=$(recuperer_identifiant "la transaction")
echo "Transaction créée avec l’identifiant : $TRANSACTION_ID"

CODE_HTTP=$(requete_http "GET" "$API_URL/transactions/$TRANSACTION_ID")
verifier_code_http "$CODE_HTTP" "200" "Lecture transaction"

CODE_HTTP=$(requete_http "PUT" "$API_URL/transactions/$TRANSACTION_ID" "{
  \"compte_id\": $COMPTE_ID,
  \"categorie_id\": $CATEGORIE_ID,
  \"libelle\": \"Transaction CRUD modifiée\",
  \"montant\": 50,
  \"date_transaction\": \"$DATE_TEST\",
  \"type_transaction\": \"depense\"
}")
verifier_code_http "$CODE_HTTP" "200" "Modification transaction"

# ============================================================
# 5. BUDGET CRUD
# ============================================================

afficher_etape "5. CRUD BUDGET"

CODE_HTTP=$(requete_http "POST" "$API_URL/budgets" "{
  \"utilisateur_id\": $UTILISATEUR_ID,
  \"categorie_id\": $CATEGORIE_ID,
  \"montant_limite\": 500,
  \"mois\": $MOIS_TEST,
  \"annee\": $ANNEE_TEST
}")
verifier_code_http "$CODE_HTTP" "201" "Création budget"

BUDGET_ID=$(recuperer_identifiant "le budget")
echo "Budget créé avec l’identifiant : $BUDGET_ID"

CODE_HTTP=$(requete_http "GET" "$API_URL/budgets/$BUDGET_ID")
verifier_code_http "$CODE_HTTP" "200" "Lecture budget"

CODE_HTTP=$(requete_http "PUT" "$API_URL/budgets/$BUDGET_ID" "{
  \"utilisateur_id\": $UTILISATEUR_ID,
  \"categorie_id\": $CATEGORIE_ID,
  \"montant_limite\": 650,
  \"mois\": $MOIS_TEST,
  \"annee\": $ANNEE_TEST
}")
verifier_code_http "$CODE_HTTP" "200" "Modification budget"

# ============================================================
# 6. GOAL CRUD
# ============================================================

afficher_etape "6. CRUD OBJECTIF"

CODE_HTTP=$(requete_http "POST" "$API_URL/objectifs" "{
  \"utilisateur_id\": $UTILISATEUR_ID,
  \"nom\": \"Objectif CRUD\",
  \"montant_cible\": 10000,
  \"montant_actuel\": 1000,
  \"date_echeance\": \"2030-12-31\",
  \"statut\": \"en cours\"
}")
verifier_code_http "$CODE_HTTP" "201" "Création objectif"

OBJECTIF_ID=$(recuperer_identifiant "l'objectif")
echo "Objectif créé avec l’identifiant : $OBJECTIF_ID"

CODE_HTTP=$(requete_http "GET" "$API_URL/objectifs/$OBJECTIF_ID")
verifier_code_http "$CODE_HTTP" "200" "Lecture objectif"

CODE_HTTP=$(requete_http "PUT" "$API_URL/objectifs/$OBJECTIF_ID" "{
  \"utilisateur_id\": $UTILISATEUR_ID,
  \"nom\": \"Objectif CRUD modifié\",
  \"montant_cible\": 12000,
  \"montant_actuel\": 1500,
  \"date_echeance\": \"2030-12-31\",
  \"statut\": \"en cours\"
}")
verifier_code_http "$CODE_HTTP" "200" "Modification objectif"

# ============================================================
# 7. FINANCIAL ASSET CRUD
# ============================================================
# 🟨 NOUVEAU
# actif_financier est réservé aux administrateurs en écriture.
# On promeut l'utilisateur de test via psql, puis on se
# reconnecte pour obtenir un JWT contenant le nouveau role.

afficher_etape "7. CRUD ACTIF FINANCIER"

psql "$DATABASE_URL" -q -c \
  "UPDATE utilisateur SET role = 'administrateur' WHERE id = $UTILISATEUR_ID;"

CODE_HTTP=$(requete_http "POST" "$API_URL/auth/connexion" "{
  \"email\": \"$EMAIL_TEST\",
  \"mot_de_passe\": \"$MOT_DE_PASSE_MODIFIE\"
}")
verifier_code_http "$CODE_HTTP" "200" "Reconnexion en tant qu’administrateur"

TOKEN=$(jq -r '.token // empty' "$RESPONSE_FILE")
echo "✅ JWT administrateur récupéré"

SYMBOLE_TEST="TST${TIMESTAMP}"

CODE_HTTP=$(requete_http "POST" "$API_URL/actifs-financiers" "{
  \"symbole\": \"$SYMBOLE_TEST\",
  \"nom\": \"Actif CRUD\",
  \"type_actif\": \"action\",
  \"devise\": \"EUR\"
}")
verifier_code_http "$CODE_HTTP" "201" "Création actif financier"

ACTIF_ID=$(recuperer_identifiant "l'actif financier")
echo "Actif créé avec l’identifiant : $ACTIF_ID"

CODE_HTTP=$(requete_http "GET" "$API_URL/actifs-financiers/$ACTIF_ID")
verifier_code_http "$CODE_HTTP" "200" "Lecture actif financier"

CODE_HTTP=$(requete_http "PUT" "$API_URL/actifs-financiers/$ACTIF_ID" "{
  \"symbole\": \"$SYMBOLE_TEST\",
  \"nom\": \"Actif CRUD modifié\",
  \"type_actif\": \"action\",
  \"devise\": \"EUR\"
}")
verifier_code_http "$CODE_HTTP" "200" "Modification actif financier"

# ============================================================
# 8. INVESTMENT OPERATION CRUD
# ============================================================

afficher_etape "8. CRUD OPÉRATION D’INVESTISSEMENT"

CODE_HTTP=$(requete_http "POST" "$API_URL/operations-investissement" "{
  \"compte_id\": $COMPTE_ID,
  \"actif_financier_id\": $ACTIF_ID,
  \"type_operation\": \"achat\",
  \"quantite\": 2,
  \"prix_unitaire\": 100,
  \"frais\": 1.50,
  \"date_operation\": \"$DATE_TEST\"
}")
verifier_code_http "$CODE_HTTP" "201" "Création opération d’investissement"

OPERATION_ID=$(recuperer_identifiant "l'opération d'investissement")
echo "Opération créée avec l’identifiant : $OPERATION_ID"

CODE_HTTP=$(requete_http "GET" "$API_URL/operations-investissement/$OPERATION_ID")
verifier_code_http "$CODE_HTTP" "200" "Lecture opération d’investissement"

CODE_HTTP=$(requete_http "PUT" "$API_URL/operations-investissement/$OPERATION_ID" "{
  \"compte_id\": $COMPTE_ID,
  \"actif_financier_id\": $ACTIF_ID,
  \"type_operation\": \"achat\",
  \"quantite\": 3,
  \"prix_unitaire\": 110,
  \"frais\": 2,
  \"date_operation\": \"$DATE_TEST\"
}")
verifier_code_http "$CODE_HTTP" "200" "Modification opération d’investissement"

# ============================================================
# TEST DATA CLEANUP
# ============================================================
# Delete children before their parents to respect PostgreSQL foreign keys.

afficher_etape "SUPPRESSION DES DONNÉES DE TEST"

supprimer_ressource "operations-investissement" "$OPERATION_ID" "Suppression opération d’investissement"
supprimer_ressource "actifs-financiers" "$ACTIF_ID" "Suppression actif financier"
supprimer_ressource "objectifs" "$OBJECTIF_ID" "Suppression objectif"
supprimer_ressource "budgets" "$BUDGET_ID" "Suppression budget"
supprimer_ressource "transactions" "$TRANSACTION_ID" "Suppression transaction"
supprimer_ressource "categories" "$CATEGORIE_ID" "Suppression catégorie"
supprimer_ressource "comptes" "$COMPTE_ID" "Suppression compte"
supprimer_ressource "utilisateurs" "$UTILISATEUR_ID" "Suppression utilisateur"

TOKEN=""
afficher_etape "✅ LES 8 CRUD FONCTIONNENT"