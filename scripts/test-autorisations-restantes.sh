#!/usr/bin/env bash

# ============================================================
# TEST GLOBAL DES AUTORISATIONS JWT RESTANTES
# ============================================================
#
# Ce fichier teste en une seule exécution :
# - budgets ;
# - objectifs ;
# - opérations d'investissement ;
# - protection JWT du référentiel d'actifs financiers.
#
# Deux utilisateurs sont créés :
# - le propriétaire crée les données ;
# - l'intrus tente de les lire, modifier et supprimer.
#
# Règles vérifiées :
# - utilisateur → budget ;
# - utilisateur → objectif ;
# - utilisateur → compte → opération d'investissement ;
# - actif_financier reste global mais exige un JWT.
# ============================================================

set -e

API_URL="http://localhost:3000/api"
FICHIER_REPONSE="/tmp/reponse-autorisations-restantes.json"
TOKEN=""
TIMESTAMP=$(date +%s)
DATE_TEST=$(date "+%Y-%m-%d")
MOIS_TEST=$(date "+%-m")
ANNEE_TEST=$(date "+%Y")
MOT_DE_PASSE="TestFinance123!"

afficher_etape() {
  echo
  echo "=================================================="
  echo "$1"
  echo "=================================================="
}

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

verifier_absence_id() {
  filtre_jq="$1"
  id_recherche="$2"
  nom_test="$3"

  if ! jq -e \
    --argjson idRecherche "$id_recherche" \
    "$filtre_jq" \
    "$FICHIER_REPONSE" >/dev/null; then

    echo "❌ $nom_test"
    cat "$FICHIER_REPONSE"
    exit 1
  fi

  echo "✅ $nom_test"
}

# ============================================================
# 1. PRÉREQUIS ET PROTECTION JWT
# ============================================================

afficher_etape "1. PRÉREQUIS ET PROTECTION JWT"

if ! command -v curl >/dev/null 2>&1; then
  echo "❌ curl n'est pas installé."
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "❌ jq n'est pas installé."
  exit 1
fi

CODE_HTTP=$(requete_http \
  "GET" \
  "http://localhost:3000/")

verifier_code_http \
  "$CODE_HTTP" \
  "200" \
  "Backend accessible"

# 🟨 NOUVEAU : le référentiel global exige quand même un JWT.
CODE_HTTP=$(requete_http \
  "GET" \
  "$API_URL/actifs-financiers")

verifier_code_http \
  "$CODE_HTTP" \
  "401" \
  "Actifs financiers protégés sans JWT"

# ============================================================
# 2. DEUX UTILISATEURS ET DEUX JWT
# ============================================================

afficher_etape "2. CRÉATION DES DEUX UTILISATEURS"

EMAIL_1="autorisation-1-${TIMESTAMP}@financepilot.test"
EMAIL_2="autorisation-2-${TIMESTAMP}@financepilot.test"

CODE_HTTP=$(requete_http \
  "POST" \
  "$API_URL/utilisateurs" \
  "{
    \"nom\": \"Propriétaire\",
    \"prenom\": \"JWT\",
    \"email\": \"$EMAIL_1\",
    \"mot_de_passe\": \"$MOT_DE_PASSE\"
  }")

verifier_code_http \
  "$CODE_HTTP" \
  "201" \
  "Création du propriétaire"

UTILISATEUR_1_ID=$(jq -r '.id' "$FICHIER_REPONSE")

CODE_HTTP=$(requete_http \
  "POST" \
  "$API_URL/auth/connexion" \
  "{
    \"email\": \"$EMAIL_1\",
    \"mot_de_passe\": \"$MOT_DE_PASSE\"
  }")

verifier_code_http \
  "$CODE_HTTP" \
  "200" \
  "Connexion du propriétaire"

TOKEN_1=$(jq -r '.token' "$FICHIER_REPONSE")

TOKEN=""

CODE_HTTP=$(requete_http \
  "POST" \
  "$API_URL/utilisateurs" \
  "{
    \"nom\": \"Intrus\",
    \"prenom\": \"JWT\",
    \"email\": \"$EMAIL_2\",
    \"mot_de_passe\": \"$MOT_DE_PASSE\"
  }")

verifier_code_http \
  "$CODE_HTTP" \
  "201" \
  "Création de l'intrus"

UTILISATEUR_2_ID=$(jq -r '.id' "$FICHIER_REPONSE")

CODE_HTTP=$(requete_http \
  "POST" \
  "$API_URL/auth/connexion" \
  "{
    \"email\": \"$EMAIL_2\",
    \"mot_de_passe\": \"$MOT_DE_PASSE\"
  }")

verifier_code_http \
  "$CODE_HTTP" \
  "200" \
  "Connexion de l'intrus"

TOKEN_2=$(jq -r '.token' "$FICHIER_REPONSE")

# ============================================================
# 3. DONNÉES DU PROPRIÉTAIRE
# ============================================================

afficher_etape "3. CRÉATION DES DONNÉES PRIVÉES"

TOKEN="$TOKEN_1"

CODE_HTTP=$(requete_http \
  "POST" \
  "$API_URL/comptes" \
  "{
    \"nom\": \"Compte autorisation\",
    \"type_compte\": \"courant\",
    \"solde_initial\": 1000,
    \"devise\": \"EUR\"
  }")

verifier_code_http "$CODE_HTTP" "201" "Création du compte privé"
COMPTE_ID=$(jq -r '.id' "$FICHIER_REPONSE")

CODE_HTTP=$(requete_http \
  "POST" \
  "$API_URL/categories" \
  "{
    \"nom\": \"Budget privé $TIMESTAMP\",
    \"type_categorie\": \"depense\"
  }")

verifier_code_http "$CODE_HTTP" "201" "Création de la catégorie privée"
CATEGORIE_ID=$(jq -r '.id' "$FICHIER_REPONSE")

# L'actif est global dans le schéma, mais sa route exige un JWT.
CODE_HTTP=$(requete_http \
  "POST" \
  "$API_URL/actifs-financiers" \
  "{
    \"symbole\": \"T$TIMESTAMP\",
    \"nom\": \"Actif test autorisation\",
    \"type_actif\": \"etf\",
    \"devise\": \"EUR\"
  }")

verifier_code_http "$CODE_HTTP" "201" "Création de l'actif global"
ACTIF_ID=$(jq -r '.id' "$FICHIER_REPONSE")

# 🟨 NOUVEAU : utilisateur_id n'est plus envoyé.
CODE_HTTP=$(requete_http \
  "POST" \
  "$API_URL/budgets" \
  "{
    \"categorie_id\": $CATEGORIE_ID,
    \"montant_limite\": 500,
    \"mois\": $MOIS_TEST,
    \"annee\": $ANNEE_TEST
  }")

verifier_code_http "$CODE_HTTP" "201" "Création du budget privé"
BUDGET_ID=$(jq -r '.id' "$FICHIER_REPONSE")

# 🟨 NOUVEAU : utilisateur_id n'est plus envoyé.
CODE_HTTP=$(requete_http \
  "POST" \
  "$API_URL/objectifs" \
  "{
    \"nom\": \"Objectif secret\",
    \"montant_cible\": 5000,
    \"montant_actuel\": 100,
    \"date_echeance\": \"$DATE_TEST\",
    \"statut\": \"en cours\"
  }")

verifier_code_http "$CODE_HTTP" "201" "Création de l'objectif privé"
OBJECTIF_ID=$(jq -r '.id' "$FICHIER_REPONSE")

CODE_HTTP=$(requete_http \
  "POST" \
  "$API_URL/operations-investissement" \
  "{
    \"compte_id\": $COMPTE_ID,
    \"actif_financier_id\": $ACTIF_ID,
    \"type_operation\": \"achat\",
    \"quantite\": 2,
    \"prix_unitaire\": 100,
    \"frais\": 1,
    \"date_operation\": \"$DATE_TEST\"
  }")

verifier_code_http "$CODE_HTTP" "201" "Création de l'opération privée"
OPERATION_ID=$(jq -r '.id' "$FICHIER_REPONSE")

# ============================================================
# 4. LISTES PRIVÉES DE L'INTRUS
# ============================================================

afficher_etape "4. VÉRIFICATION DES LISTES PRIVÉES"

TOKEN="$TOKEN_2"

CODE_HTTP=$(requete_http "GET" "$API_URL/budgets")
verifier_code_http "$CODE_HTTP" "200" "Liste des budgets de l'intrus"
verifier_absence_id \
  '[.budgets[] | select(.id == $idRecherche)] | length == 0' \
  "$BUDGET_ID" \
  "Le budget du propriétaire est invisible"

CODE_HTTP=$(requete_http "GET" "$API_URL/objectifs")
verifier_code_http "$CODE_HTTP" "200" "Liste des objectifs de l'intrus"
verifier_absence_id \
  '[.[] | select(.id == $idRecherche)] | length == 0' \
  "$OBJECTIF_ID" \
  "L'objectif du propriétaire est invisible"

CODE_HTTP=$(requete_http "GET" "$API_URL/operations-investissement")
verifier_code_http "$CODE_HTTP" "200" "Liste des opérations de l'intrus"
verifier_absence_id \
  '[.[] | select(.id == $idRecherche)] | length == 0' \
  "$OPERATION_ID" \
  "L'opération du propriétaire est invisible"

# ============================================================
# 5. ATTAQUES DE L'INTRUS
# ============================================================

afficher_etape "5. LECTURES, MODIFICATIONS ET SUPPRESSIONS REFUSÉES"

CODE_HTTP=$(requete_http "GET" "$API_URL/budgets/$BUDGET_ID")
verifier_code_http "$CODE_HTTP" "404" "Lecture du budget étranger refusée"

CODE_HTTP=$(requete_http \
  "PUT" \
  "$API_URL/budgets/$BUDGET_ID" \
  "{
    \"categorie_id\": $CATEGORIE_ID,
    \"montant_limite\": 1,
    \"mois\": $MOIS_TEST,
    \"annee\": $ANNEE_TEST
  }")
verifier_code_http "$CODE_HTTP" "404" "Modification du budget étranger refusée"

CODE_HTTP=$(requete_http "DELETE" "$API_URL/budgets/$BUDGET_ID")
verifier_code_http "$CODE_HTTP" "404" "Suppression du budget étranger refusée"

CODE_HTTP=$(requete_http "GET" "$API_URL/objectifs/$OBJECTIF_ID")
verifier_code_http "$CODE_HTTP" "404" "Lecture de l'objectif étranger refusée"

CODE_HTTP=$(requete_http \
  "PUT" \
  "$API_URL/objectifs/$OBJECTIF_ID" \
  "{
    \"nom\": \"Objectif piraté\",
    \"montant_cible\": 1,
    \"montant_actuel\": 0,
    \"date_echeance\": \"$DATE_TEST\",
    \"statut\": \"en cours\"
  }")
verifier_code_http "$CODE_HTTP" "404" "Modification de l'objectif étranger refusée"

CODE_HTTP=$(requete_http "DELETE" "$API_URL/objectifs/$OBJECTIF_ID")
verifier_code_http "$CODE_HTTP" "404" "Suppression de l'objectif étranger refusée"

CODE_HTTP=$(requete_http "GET" "$API_URL/operations-investissement/$OPERATION_ID")
verifier_code_http "$CODE_HTTP" "404" "Lecture de l'opération étrangère refusée"

CODE_HTTP=$(requete_http \
  "PUT" \
  "$API_URL/operations-investissement/$OPERATION_ID" \
  "{
    \"compte_id\": $COMPTE_ID,
    \"actif_financier_id\": $ACTIF_ID,
    \"type_operation\": \"vente\",
    \"quantite\": 1,
    \"prix_unitaire\": 1,
    \"frais\": 0,
    \"date_operation\": \"$DATE_TEST\"
  }")
verifier_code_http "$CODE_HTTP" "404" "Modification de l'opération étrangère refusée"

CODE_HTTP=$(requete_http "DELETE" "$API_URL/operations-investissement/$OPERATION_ID")
verifier_code_http "$CODE_HTTP" "404" "Suppression de l'opération étrangère refusée"

# L'intrus ne peut pas créer une ressource avec les relations du propriétaire.
CODE_HTTP=$(requete_http \
  "POST" \
  "$API_URL/budgets" \
  "{
    \"categorie_id\": $CATEGORIE_ID,
    \"montant_limite\": 999,
    \"mois\": $MOIS_TEST,
    \"annee\": $ANNEE_TEST
  }")
verifier_code_http "$CODE_HTTP" "404" "Création avec la catégorie étrangère refusée"

CODE_HTTP=$(requete_http \
  "POST" \
  "$API_URL/operations-investissement" \
  "{
    \"compte_id\": $COMPTE_ID,
    \"actif_financier_id\": $ACTIF_ID,
    \"type_operation\": \"achat\",
    \"quantite\": 1,
    \"prix_unitaire\": 1,
    \"frais\": 0,
    \"date_operation\": \"$DATE_TEST\"
  }")
verifier_code_http "$CODE_HTTP" "404" "Création avec le compte étranger refusée"

# ============================================================
# 6. INTÉGRITÉ ET NETTOYAGE PAR LE PROPRIÉTAIRE
# ============================================================

afficher_etape "6. INTÉGRITÉ ET NETTOYAGE"

TOKEN="$TOKEN_1"

CODE_HTTP=$(requete_http "GET" "$API_URL/budgets/$BUDGET_ID")
verifier_code_http "$CODE_HTTP" "200" "Budget encore accessible au propriétaire"

if [ "$(jq -r '.montant_limite' "$FICHIER_REPONSE")" != "500.00" ]; then
  echo "❌ Le budget a été modifié par l'intrus."
  exit 1
fi

CODE_HTTP=$(requete_http "GET" "$API_URL/objectifs/$OBJECTIF_ID")
verifier_code_http "$CODE_HTTP" "200" "Objectif encore accessible au propriétaire"

if [ "$(jq -r '.nom' "$FICHIER_REPONSE")" != "Objectif secret" ]; then
  echo "❌ L'objectif a été modifié par l'intrus."
  exit 1
fi

CODE_HTTP=$(requete_http "GET" "$API_URL/operations-investissement/$OPERATION_ID")
verifier_code_http "$CODE_HTTP" "200" "Opération encore accessible au propriétaire"

if [ "$(jq -r '.type_operation' "$FICHIER_REPONSE")" != "achat" ]; then
  echo "❌ L'opération a été modifiée par l'intrus."
  exit 1
fi

CODE_HTTP=$(requete_http "DELETE" "$API_URL/budgets/$BUDGET_ID")
verifier_code_http "$CODE_HTTP" "200" "Suppression du budget"

CODE_HTTP=$(requete_http "DELETE" "$API_URL/objectifs/$OBJECTIF_ID")
verifier_code_http "$CODE_HTTP" "200" "Suppression de l'objectif"

CODE_HTTP=$(requete_http "DELETE" "$API_URL/operations-investissement/$OPERATION_ID")
verifier_code_http "$CODE_HTTP" "200" "Suppression de l'opération"

CODE_HTTP=$(requete_http "DELETE" "$API_URL/actifs-financiers/$ACTIF_ID")
verifier_code_http "$CODE_HTTP" "200" "Suppression de l'actif global de test"

CODE_HTTP=$(requete_http "DELETE" "$API_URL/categories/$CATEGORIE_ID")
verifier_code_http "$CODE_HTTP" "200" "Suppression de la catégorie"

CODE_HTTP=$(requete_http "DELETE" "$API_URL/comptes/$COMPTE_ID")
verifier_code_http "$CODE_HTTP" "200" "Suppression du compte"

TOKEN="$TOKEN_2"
CODE_HTTP=$(requete_http "DELETE" "$API_URL/utilisateurs/$UTILISATEUR_2_ID")
verifier_code_http "$CODE_HTTP" "200" "Suppression de l'intrus"

TOKEN="$TOKEN_1"
CODE_HTTP=$(requete_http "DELETE" "$API_URL/utilisateurs/$UTILISATEUR_1_ID")
verifier_code_http "$CODE_HTTP" "200" "Suppression du propriétaire"

TOKEN=""
rm -f "$FICHIER_REPONSE"

afficher_etape "✅ TOUTES LES AUTORISATIONS JWT SONT VALIDÉES"
