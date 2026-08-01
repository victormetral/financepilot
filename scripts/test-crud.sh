#!/usr/bin/env bash

# ============================================================
# TEST CRUD COMPLET DE FINANCEPILOT
# ============================================================
#
# Ce script teste les 8 ressources principales du backend :
#
# 1. utilisateurs
# 2. comptes
# 3. catégories
# 4. transactions
# 5. budgets
# 6. objectifs
# 7. actifs financiers
# 8. opérations d’investissement
#
# Pour chaque ressource, le script vérifie :
#
# CREATE  → création
# READ    → lecture
# UPDATE  → modification
# DELETE  → suppression
#
# Prérequis :
# - le backend doit fonctionner sur localhost:3000 ;
# - PostgreSQL doit être démarré ;
# - jq doit être installé.
#
# Le script crée ses propres données puis les supprime.
# ============================================================

set -e

API_URL="http://localhost:3000/api"

# Identifiant unique utilisé pour éviter les doublons
TIMESTAMP=$(date +%s)

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
# Vérification du code HTTP
# ------------------------------------------------------------

verifier_code_http() {
  code_recu="$1"
  code_attendu="$2"
  nom_test="$3"

  if [ "$code_recu" != "$code_attendu" ]; then
    echo "❌ ÉCHEC : $nom_test"
    echo "Code attendu : $code_attendu"
    echo "Code reçu    : $code_recu"
    exit 1
  fi

  echo "✅ $nom_test → HTTP $code_recu"
}

# ------------------------------------------------------------
# Requête HTTP
#
# La réponse JSON est placée dans /tmp/reponse-financepilot.json.
# Le code HTTP est renvoyé par la fonction.
# ------------------------------------------------------------

requete_http() {
  methode="$1"
  url="$2"
  donnees="${3:-}"

  if [ -n "$donnees" ]; then
    curl -s \
      -o /tmp/reponse-financepilot.json \
      -w "%{http_code}" \
      -X "$methode" \
      -H "Content-Type: application/json" \
      -d "$donnees" \
      "$url"
  else
    curl -s \
      -o /tmp/reponse-financepilot.json \
      -w "%{http_code}" \
      -X "$methode" \
      "$url"
  fi
}

# ------------------------------------------------------------
# Vérification des prérequis
# ------------------------------------------------------------

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

CODE_HTTP=$(requete_http "GET" "$API_URL/utilisateurs")

verifier_code_http \
  "$CODE_HTTP" \
  "200" \
  "Backend accessible"

# ============================================================
# 1. UTILISATEUR
# ============================================================

afficher_etape "1. CRUD UTILISATEUR"

EMAIL_TEST="crud-${TIMESTAMP}@financepilot.test"

CODE_HTTP=$(requete_http \
  "POST" \
  "$API_URL/utilisateurs" \
  "{
    \"nom\": \"CRUD\",
    \"prenom\": \"Test\",
    \"email\": \"$EMAIL_TEST\",
    \"mot_de_passe\": \"TestFinance123!\"
  }")

verifier_code_http \
  "$CODE_HTTP" \
  "201" \
  "Création utilisateur"

UTILISATEUR_ID=$(jq -r '.id' /tmp/reponse-financepilot.json)

echo "Utilisateur créé avec l’identifiant : $UTILISATEUR_ID"

CODE_HTTP=$(requete_http \
  "GET" \
  "$API_URL/utilisateurs/$UTILISATEUR_ID")

verifier_code_http \
  "$CODE_HTTP" \
  "200" \
  "Lecture utilisateur"

CODE_HTTP=$(requete_http \
  "PUT" \
  "$API_URL/utilisateurs/$UTILISATEUR_ID" \
  "{
    \"nom\": \"CRUD modifié\",
    \"prenom\": \"Test\",
    \"email\": \"$EMAIL_TEST\",
    \"mot_de_passe\": \"TestFinance456!\"
  }")

verifier_code_http \
  "$CODE_HTTP" \
  "200" \
  "Modification utilisateur"

# ============================================================
# 2. COMPTE
# ============================================================

afficher_etape "2. CRUD COMPTE"

CODE_HTTP=$(requete_http \
  "POST" \
  "$API_URL/comptes" \
  "{
    \"utilisateur_id\": $UTILISATEUR_ID,
    \"nom\": \"Compte CRUD\",
    \"type_compte\": \"courant\",
    \"solde_initial\": 1000,
    \"devise\": \"EUR\"
  }")

verifier_code_http \
  "$CODE_HTTP" \
  "201" \
  "Création compte"

COMPTE_ID=$(jq -r '.id' /tmp/reponse-financepilot.json)

echo "Compte créé avec l’identifiant : $COMPTE_ID"

CODE_HTTP=$(requete_http \
  "GET" \
  "$API_URL/comptes/$COMPTE_ID")

verifier_code_http \
  "$CODE_HTTP" \
  "200" \
  "Lecture compte"

CODE_HTTP=$(requete_http \
  "PUT" \
  "$API_URL/comptes/$COMPTE_ID" \
  "{
    \"nom\": \"Compte CRUD modifié\",
    \"type_compte\": \"courant\",
    \"solde_initial\": 1500,
    \"devise\": \"EUR\"
  }")

verifier_code_http \
  "$CODE_HTTP" \
  "200" \
  "Modification compte"

# ============================================================
# 3. CATÉGORIE
# ============================================================

afficher_etape "3. CRUD CATÉGORIE"

CODE_HTTP=$(requete_http \
  "POST" \
  "$API_URL/categories" \
  "{
    \"utilisateur_id\": $UTILISATEUR_ID,
    \"nom\": \"Catégorie CRUD $TIMESTAMP\",
    \"type_categorie\": \"depense\"
  }")

verifier_code_http \
  "$CODE_HTTP" \
  "201" \
  "Création catégorie"

CATEGORIE_ID=$(jq -r '.id' /tmp/reponse-financepilot.json)

echo "Catégorie créée avec l’identifiant : $CATEGORIE_ID"

CODE_HTTP=$(requete_http \
  "GET" \
  "$API_URL/categories/$CATEGORIE_ID")

verifier_code_http \
  "$CODE_HTTP" \
  "200" \
  "Lecture catégorie"

CODE_HTTP=$(requete_http \
  "PUT" \
  "$API_URL/categories/$CATEGORIE_ID" \
  "{
    \"nom\": \"Catégorie CRUD modifiée $TIMESTAMP\",
    \"type_categorie\": \"depense\"
  }")

verifier_code_http \
  "$CODE_HTTP" \
  "200" \
  "Modification catégorie"

# ============================================================
# 4. TRANSACTION
# ============================================================

afficher_etape "4. CRUD TRANSACTION"

DATE_TEST=$(date "+%Y-%m-%d")

CODE_HTTP=$(requete_http \
  "POST" \
  "$API_URL/transactions" \
  "{
    \"compte_id\": $COMPTE_ID,
    \"categorie_id\": $CATEGORIE_ID,
    \"libelle\": \"Transaction CRUD\",
    \"montant\": 42.50,
    \"date_transaction\": \"$DATE_TEST\",
    \"type_transaction\": \"depense\"
  }")

verifier_code_http \
  "$CODE_HTTP" \
  "201" \
  "Création transaction"

TRANSACTION_ID=$(jq -r '.id' /tmp/reponse-financepilot.json)

echo "Transaction créée avec l’identifiant : $TRANSACTION_ID"

CODE_HTTP=$(requete_http \
  "GET" \
  "$API_URL/transactions/$TRANSACTION_ID")

verifier_code_http \
  "$CODE_HTTP" \
  "200" \
  "Lecture transaction"

CODE_HTTP=$(requete_http \
  "PUT" \
  "$API_URL/transactions/$TRANSACTION_ID" \
  "{
    \"compte_id\": $COMPTE_ID,
    \"categorie_id\": $CATEGORIE_ID,
    \"libelle\": \"Transaction CRUD modifiée\",
    \"montant\": 50,
    \"date_transaction\": \"$DATE_TEST\",
    \"type_transaction\": \"depense\"
  }")

verifier_code_http \
  "$CODE_HTTP" \
  "200" \
  "Modification transaction"

# ============================================================
# 5. BUDGET
# ============================================================

afficher_etape "5. CRUD BUDGET"

MOIS_TEST=$(date "+%-m")
ANNEE_TEST=$(date "+%Y")

CODE_HTTP=$(requete_http \
  "POST" \
  "$API_URL/budgets" \
  "{
    \"utilisateur_id\": $UTILISATEUR_ID,
    \"categorie_id\": $CATEGORIE_ID,
    \"montant_limite\": 500,
    \"mois\": $MOIS_TEST,
    \"annee\": $ANNEE_TEST
  }")

verifier_code_http \
  "$CODE_HTTP" \
  "201" \
  "Création budget"

BUDGET_ID=$(jq -r '.id' /tmp/reponse-financepilot.json)

echo "Budget créé avec l’identifiant : $BUDGET_ID"

CODE_HTTP=$(requete_http \
  "GET" \
  "$API_URL/budgets/$BUDGET_ID")

verifier_code_http \
  "$CODE_HTTP" \
  "200" \
  "Lecture budget"

CODE_HTTP=$(requete_http \
  "PUT" \
  "$API_URL/budgets/$BUDGET_ID" \
  "{
    \"utilisateur_id\": $UTILISATEUR_ID,
    \"categorie_id\": $CATEGORIE_ID,
    \"montant_limite\": 650,
    \"mois\": $MOIS_TEST,
    \"annee\": $ANNEE_TEST
  }")

verifier_code_http \
  "$CODE_HTTP" \
  "200" \
  "Modification budget"

# ============================================================
# 6. OBJECTIF
# ============================================================

afficher_etape "6. CRUD OBJECTIF"

CODE_HTTP=$(requete_http \
  "POST" \
  "$API_URL/objectifs" \
  "{
    \"utilisateur_id\": $UTILISATEUR_ID,
    \"nom\": \"Objectif CRUD\",
    \"montant_cible\": 10000,
    \"montant_actuel\": 1000,
    \"date_echeance\": \"2030-12-31\",
    \"statut\": \"en cours\"
  }")

verifier_code_http \
  "$CODE_HTTP" \
  "201" \
  "Création objectif"

OBJECTIF_ID=$(jq -r '.id' /tmp/reponse-financepilot.json)

echo "Objectif créé avec l’identifiant : $OBJECTIF_ID"

CODE_HTTP=$(requete_http \
  "GET" \
  "$API_URL/objectifs/$OBJECTIF_ID")

verifier_code_http \
  "$CODE_HTTP" \
  "200" \
  "Lecture objectif"

CODE_HTTP=$(requete_http \
  "PUT" \
  "$API_URL/objectifs/$OBJECTIF_ID" \
  "{
    \"utilisateur_id\": $UTILISATEUR_ID,
    \"nom\": \"Objectif CRUD modifié\",
    \"montant_cible\": 12000,
    \"montant_actuel\": 1500,
    \"date_echeance\": \"2030-12-31\",
    \"statut\": \"en cours\"
  }")

verifier_code_http \
  "$CODE_HTTP" \
  "200" \
  "Modification objectif"

# ============================================================
# 7. ACTIF FINANCIER
# ============================================================

afficher_etape "7. CRUD ACTIF FINANCIER"

SYMBOLE_TEST="TST${TIMESTAMP}"

CODE_HTTP=$(requete_http \
  "POST" \
  "$API_URL/actifs-financiers" \
  "{
    \"symbole\": \"$SYMBOLE_TEST\",
    \"nom\": \"Actif CRUD\",
    \"type_actif\": \"action\",
    \"devise\": \"EUR\"
  }")

verifier_code_http \
  "$CODE_HTTP" \
  "201" \
  "Création actif financier"

ACTIF_ID=$(jq -r '.id' /tmp/reponse-financepilot.json)

echo "Actif créé avec l’identifiant : $ACTIF_ID"

CODE_HTTP=$(requete_http \
  "GET" \
  "$API_URL/actifs-financiers/$ACTIF_ID")

verifier_code_http \
  "$CODE_HTTP" \
  "200" \
  "Lecture actif financier"

CODE_HTTP=$(requete_http \
  "PUT" \
  "$API_URL/actifs-financiers/$ACTIF_ID" \
  "{
    \"symbole\": \"$SYMBOLE_TEST\",
    \"nom\": \"Actif CRUD modifié\",
    \"type_actif\": \"action\",
    \"devise\": \"EUR\"
  }")

verifier_code_http \
  "$CODE_HTTP" \
  "200" \
  "Modification actif financier"

# ============================================================
# 8. OPÉRATION D’INVESTISSEMENT
# ============================================================

afficher_etape "8. CRUD OPÉRATION D’INVESTISSEMENT"

CODE_HTTP=$(requete_http \
  "POST" \
  "$API_URL/operations-investissement" \
  "{
    \"compte_id\": $COMPTE_ID,
    \"actif_financier_id\": $ACTIF_ID,
    \"type_operation\": \"achat\",
    \"quantite\": 2,
    \"prix_unitaire\": 100,
    \"frais\": 1.50,
    \"date_operation\": \"$DATE_TEST\"
  }")

verifier_code_http \
  "$CODE_HTTP" \
  "201" \
  "Création opération d’investissement"

OPERATION_ID=$(jq -r '.id' /tmp/reponse-financepilot.json)

echo "Opération créée avec l’identifiant : $OPERATION_ID"

CODE_HTTP=$(requete_http \
  "GET" \
  "$API_URL/operations-investissement/$OPERATION_ID")

verifier_code_http \
  "$CODE_HTTP" \
  "200" \
  "Lecture opération d’investissement"

CODE_HTTP=$(requete_http \
  "PUT" \
  "$API_URL/operations-investissement/$OPERATION_ID" \
  "{
    \"compte_id\": $COMPTE_ID,
    \"actif_financier_id\": $ACTIF_ID,
    \"type_operation\": \"achat\",
    \"quantite\": 3,
    \"prix_unitaire\": 110,
    \"frais\": 2,
    \"date_operation\": \"$DATE_TEST\"
  }")

verifier_code_http \
  "$CODE_HTTP" \
  "200" \
  "Modification opération d’investissement"

# ============================================================
# SUPPRESSION
#
# L’ordre est important :
# on supprime d’abord les ressources dépendantes,
# puis les ressources dont elles dépendent.
# ============================================================

afficher_etape "SUPPRESSION DES DONNÉES DE TEST"

CODE_HTTP=$(requete_http \
  "DELETE" \
  "$API_URL/operations-investissement/$OPERATION_ID")

verifier_code_http \
  "$CODE_HTTP" \
  "200" \
  "Suppression opération d’investissement"

CODE_HTTP=$(requete_http \
  "DELETE" \
  "$API_URL/actifs-financiers/$ACTIF_ID")

verifier_code_http \
  "$CODE_HTTP" \
  "200" \
  "Suppression actif financier"

CODE_HTTP=$(requete_http \
  "DELETE" \
  "$API_URL/objectifs/$OBJECTIF_ID")

verifier_code_http \
  "$CODE_HTTP" \
  "200" \
  "Suppression objectif"

CODE_HTTP=$(requete_http \
  "DELETE" \
  "$API_URL/budgets/$BUDGET_ID")

verifier_code_http \
  "$CODE_HTTP" \
  "200" \
  "Suppression budget"

CODE_HTTP=$(requete_http \
  "DELETE" \
  "$API_URL/transactions/$TRANSACTION_ID")

verifier_code_http \
  "$CODE_HTTP" \
  "200" \
  "Suppression transaction"

CODE_HTTP=$(requete_http \
  "DELETE" \
  "$API_URL/categories/$CATEGORIE_ID")

verifier_code_http \
  "$CODE_HTTP" \
  "200" \
  "Suppression catégorie"

CODE_HTTP=$(requete_http \
  "DELETE" \
  "$API_URL/comptes/$COMPTE_ID")

verifier_code_http \
  "$CODE_HTTP" \
  "200" \
  "Suppression compte"

CODE_HTTP=$(requete_http \
  "DELETE" \
  "$API_URL/utilisateurs/$UTILISATEUR_ID")

verifier_code_http \
  "$CODE_HTTP" \
  "200" \
  "Suppression utilisateur"

rm -f /tmp/reponse-financepilot.json

afficher_etape "✅ LES 8 CRUD FONCTIONNENT"