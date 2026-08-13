#!/usr/bin/env bash

# ============================================================
# FINANCEPILOT - TEST CRUD COMPLET DE L'API
# ============================================================
#
# Rôle :
# - crée un utilisateur isolé et les données dont il a besoin ;
# - teste Create, Read et Update pour les 8 ressources ;
# - supprime les données de test dans l'ordre des dépendances.
#
# Utilise :
# - scripts/lib/test-helpers.sh (mutualisé)
#
# Depuis Lot 5 : la session passe par un cookie httpOnly stocké
# dans COOKIE_JAR par curl — plus de JWT à extraire du JSON.
#
# actif_financier est réservé aux administrateurs en écriture :
# l'utilisateur de test est promu via psql avant la section 7,
# puis reconnecté pour obtenir un cookie contenant le rôle.
#
# Ajouter une ressource = un appel à tester_cycle_crud + une
# ligne dans la section de suppression.
# ============================================================

set -Eeuo pipefail

API_URL="http://localhost:3000/api"
DATABASE_URL="postgresql://${DB_USER:-financepilot}:${DB_PASSWORD:-financepilot}@${DB_HOST:-localhost}:${DB_PORT:-5434}/${DB_NAME:-financepilot}"
RESPONSE_FILE="/tmp/reponse-financepilot.json"
COOKIE_JAR="/tmp/cookies-financepilot-crud.txt"

TIMESTAMP=$(date +%s)
DATE_TEST=$(date "+%Y-%m-%d")
MOIS_TEST=$(date "+%-m")
ANNEE_TEST=$(date "+%Y")
EMAIL_TEST="crud-${TIMESTAMP}@financepilot.test"
SYMBOLE_TEST="TST${TIMESTAMP}"
MOT_DE_PASSE_INITIAL="TestFinance123!"
MOT_DE_PASSE_MODIFIE="TestFinance456!"

source "$(dirname "$0")/lib/test-helpers.sh"

nettoyer() {
  rm -f "$RESPONSE_FILE" "$COOKIE_JAR"
}

trap nettoyer EXIT

# Enchaîne POST, GET et PUT sur une ressource, et place
# l'identifiant créé dans la variable globale DERNIER_ID.
# Une variable globale évite d'utiliser $(...) qui capturerait
# aussi les messages ✅ affichés par les fonctions mutualisées.
tester_cycle_crud() {
  local route="$1"
  local libelle="$2"
  local corps_creation="$3"
  local corps_modification="$4"
  local code_http

  code_http=$(requete_http "POST" "$API_URL/$route" "$corps_creation")
  verifier_code_http "$code_http" "201" "Création $libelle"

  DERNIER_ID=$(recuperer_identifiant "$libelle")
  echo "Identifiant créé : $DERNIER_ID"

  code_http=$(requete_http "GET" "$API_URL/$route/$DERNIER_ID")
  verifier_code_http "$code_http" "200" "Lecture $libelle"

  code_http=$(requete_http "PUT" "$API_URL/$route/$DERNIER_ID" "$corps_modification")
  verifier_code_http "$code_http" "200" "Modification $libelle"
}

supprimer_ressource() {
  local route="$1"
  local identifiant="$2"
  local libelle="$3"
  local code_http

  code_http=$(requete_http "DELETE" "$API_URL/$route/$identifiant")
  verifier_code_http "$code_http" "200" "Suppression $libelle"
}

# ============================================================
# PRÉREQUIS
# ============================================================

afficher_etape "VÉRIFICATION DES PRÉREQUIS"

for outil in curl jq psql; do
  if ! command -v "$outil" >/dev/null 2>&1; then
    echo "❌ $outil n'est pas installé."
    exit 1
  fi
done

CODE_HTTP=$(requete_http "GET" "http://localhost:3000/")
verifier_code_http "$CODE_HTTP" "200" "Backend accessible"

# ============================================================
# 1. UTILISATEUR ET SESSION
# ============================================================

afficher_etape "1. CRUD UTILISATEUR"

CODE_HTTP=$(requete_http "POST" "$API_URL/utilisateurs" "{
  \"nom\": \"CRUD\", \"prenom\": \"Test\",
  \"email\": \"$EMAIL_TEST\", \"mot_de_passe\": \"$MOT_DE_PASSE_INITIAL\"
}")
verifier_code_http "$CODE_HTTP" "201" "Création utilisateur"

UTILISATEUR_ID=$(recuperer_identifiant "l'utilisateur")
echo "Utilisateur créé avec l'identifiant : $UTILISATEUR_ID"

CODE_HTTP=$(requete_http "POST" "$API_URL/auth/connexion" "{
  \"email\": \"$EMAIL_TEST\", \"mot_de_passe\": \"$MOT_DE_PASSE_INITIAL\"
}")
verifier_code_http "$CODE_HTTP" "200" "Connexion utilisateur"

CODE_HTTP=$(requete_http "GET" "$API_URL/utilisateurs/$UTILISATEUR_ID")
verifier_code_http "$CODE_HTTP" "200" "Lecture utilisateur"

CODE_HTTP=$(requete_http "PUT" "$API_URL/utilisateurs/$UTILISATEUR_ID" "{
  \"nom\": \"CRUD modifié\", \"prenom\": \"Test\",
  \"email\": \"$EMAIL_TEST\", \"mot_de_passe\": \"$MOT_DE_PASSE_MODIFIE\"
}")
verifier_code_http "$CODE_HTTP" "200" "Modification utilisateur"

# ============================================================
# 2 à 6. RESSOURCES DE L'UTILISATEUR
# ============================================================

afficher_etape "2. CRUD COMPTE"
tester_cycle_crud "comptes" "compte" "{
  \"nom\": \"Compte CRUD\", \"type_compte\": \"courant\",
  \"sous_type_compte\": \"compte_courant\",
  \"solde_initial\": 1000, \"devise\": \"EUR\"
}" "{
  \"nom\": \"Compte CRUD modifié\", \"type_compte\": \"courant\",
  \"sous_type_compte\": \"compte_courant\",
  \"solde_initial\": 1500, \"devise\": \"EUR\"
}"
COMPTE_ID="$DERNIER_ID"

afficher_etape "3. CRUD CATÉGORIE"
tester_cycle_crud "categories" "catégorie" "{
  \"nom\": \"Catégorie CRUD $TIMESTAMP\", \"type_categorie\": \"depense\"
}" "{
  \"nom\": \"Catégorie CRUD modifiée $TIMESTAMP\", \"type_categorie\": \"depense\"
}"
CATEGORIE_ID="$DERNIER_ID"

afficher_etape "4. CRUD TRANSACTION"
tester_cycle_crud "transactions" "transaction" "{
  \"compte_id\": $COMPTE_ID, \"categorie_id\": $CATEGORIE_ID,
  \"libelle\": \"Transaction CRUD\", \"montant\": 42.50,
  \"date_transaction\": \"$DATE_TEST\", \"type_transaction\": \"depense\"
}" "{
  \"compte_id\": $COMPTE_ID, \"categorie_id\": $CATEGORIE_ID,
  \"libelle\": \"Transaction CRUD modifiée\", \"montant\": 50,
  \"date_transaction\": \"$DATE_TEST\", \"type_transaction\": \"depense\"
}"
TRANSACTION_ID="$DERNIER_ID"

afficher_etape "5. CRUD BUDGET"
tester_cycle_crud "budgets" "budget" "{
  \"categorie_id\": $CATEGORIE_ID, \"montant_limite\": 500,
  \"mois\": $MOIS_TEST, \"annee\": $ANNEE_TEST
}" "{
  \"categorie_id\": $CATEGORIE_ID, \"montant_limite\": 650,
  \"mois\": $MOIS_TEST, \"annee\": $ANNEE_TEST
}"
BUDGET_ID="$DERNIER_ID"

afficher_etape "6. CRUD OBJECTIF"
tester_cycle_crud "objectifs" "objectif" "{
  \"nom\": \"Objectif CRUD\", \"montant_cible\": 10000,
  \"montant_actuel\": 1000, \"date_echeance\": \"2030-12-31\",
  \"statut\": \"en cours\"
}" "{
  \"nom\": \"Objectif CRUD modifié\", \"montant_cible\": 12000,
  \"montant_actuel\": 1500, \"date_echeance\": \"2030-12-31\",
  \"statut\": \"en cours\"
}"
OBJECTIF_ID="$DERNIER_ID"

# ============================================================
# 7 et 8. RESSOURCES NÉCESSITANT LE RÔLE ADMINISTRATEUR
# ============================================================

afficher_etape "7. CRUD ACTIF FINANCIER"

# Le rôle est porté par le cookie : une reconnexion est
# nécessaire pour que le nouveau rôle soit pris en compte.
psql "$DATABASE_URL" -q -c \
  "UPDATE utilisateur SET role = 'administrateur' WHERE id = $UTILISATEUR_ID;"

CODE_HTTP=$(requete_http "POST" "$API_URL/auth/connexion" "{
  \"email\": \"$EMAIL_TEST\", \"mot_de_passe\": \"$MOT_DE_PASSE_MODIFIE\"
}")
verifier_code_http "$CODE_HTTP" "200" "Reconnexion en administrateur"

tester_cycle_crud "actifs-financiers" "actif financier" "{
  \"symbole\": \"$SYMBOLE_TEST\", \"nom\": \"Actif CRUD\",
  \"type_actif\": \"action\", \"devise\": \"EUR\"
}" "{
  \"symbole\": \"$SYMBOLE_TEST\", \"nom\": \"Actif CRUD modifié\",
  \"type_actif\": \"action\", \"devise\": \"EUR\"
}"
ACTIF_ID="$DERNIER_ID"

afficher_etape "8. CRUD OPÉRATION D'INVESTISSEMENT"
tester_cycle_crud "operations-investissement" "opération d'investissement" "{
  \"compte_id\": $COMPTE_ID, \"actif_financier_id\": $ACTIF_ID,
  \"type_operation\": \"achat\", \"quantite\": 2,
  \"prix_unitaire\": 100, \"frais\": 1.50, \"date_operation\": \"$DATE_TEST\"
}" "{
  \"compte_id\": $COMPTE_ID, \"actif_financier_id\": $ACTIF_ID,
  \"type_operation\": \"achat\", \"quantite\": 3,
  \"prix_unitaire\": 110, \"frais\": 2, \"date_operation\": \"$DATE_TEST\"
}"
OPERATION_ID="$DERNIER_ID"

# ============================================================
# SUPPRESSION DES DONNÉES DE TEST
# ============================================================
# Les enfants sont supprimés avant leurs parents pour respecter
# les clés étrangères PostgreSQL.

afficher_etape "SUPPRESSION DES DONNÉES DE TEST"

supprimer_ressource "operations-investissement" "$OPERATION_ID" "opération d'investissement"
supprimer_ressource "actifs-financiers" "$ACTIF_ID" "actif financier"
supprimer_ressource "objectifs" "$OBJECTIF_ID" "objectif"
supprimer_ressource "budgets" "$BUDGET_ID" "budget"
supprimer_ressource "transactions" "$TRANSACTION_ID" "transaction"
supprimer_ressource "categories" "$CATEGORIE_ID" "catégorie"
supprimer_ressource "comptes" "$COMPTE_ID" "compte"
supprimer_ressource "utilisateurs" "$UTILISATEUR_ID" "utilisateur"

afficher_etape "✅ LES 8 CRUD FONCTIONNENT"