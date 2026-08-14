#!/usr/bin/env bash

# ============================================================
# TEST DE LA GÉNÉRATION DES OCCURRENCES
# ============================================================
#
# Rôle : vérifie que POST /api/recurrences/generer crée les
# transactions dues, avance le curseur, ne crée jamais de
# doublon, ne génère rien dans le futur, respecte la date de
# fin et l'état en pause, et reste étanche entre utilisateurs.
#
# Utilise : scripts/lib/test-helpers.sh (mutualisé)
#
# Les dates sont calculées à partir du jour du test, pour que
# le script reste valable dans six mois.
# ============================================================

set -e

API_URL="http://localhost:3000/api"
RESPONSE_FILE="/tmp/reponse-generation-recurrences.json"
JAR_ANONYME="/tmp/cookies-generation-anonyme.txt"
JAR_1="/tmp/cookies-generation-1.txt"
JAR_2="/tmp/cookies-generation-2.txt"
COOKIE_JAR="$JAR_ANONYME"

TIMESTAMP=$(date +%s)
MOT_DE_PASSE="TestFinance123!"
EMAIL_1="generation-1-${TIMESTAMP}@financepilot.test"
EMAIL_2="generation-2-${TIMESTAMP}@financepilot.test"

# Dates relatives au jour du test.
# macOS utilise -v, Linux (donc la CI) utilise -d.
decaler_date() {
  local decalage="$1"

  if date -v"$decalage" "+%Y-%m-%d" >/dev/null 2>&1; then
    date -v"$decalage" "+%Y-%m-%d"
  else
    date -d "$decalage" "+%Y-%m-%d"
  fi
}

DATE_IL_Y_A_3_MOIS=$(decaler_date "-3m")
DATE_DANS_1_MOIS=$(decaler_date "+1m")

source "$(dirname "$0")/lib/test-helpers.sh"

nettoyer() {
  rm -f "$RESPONSE_FILE" "$JAR_ANONYME" "$JAR_1" "$JAR_2"
}

trap nettoyer EXIT

# ============================================================
# 1. PRÉREQUIS
# ============================================================

afficher_etape "1. VÉRIFICATION DES PRÉREQUIS"

for outil in curl jq; do
  if ! command -v "$outil" >/dev/null 2>&1; then
    echo "❌ $outil n'est pas installé."
    exit 1
  fi
done

CODE_HTTP=$(requete_http "GET" "http://localhost:3000/")
verifier_code_http "$CODE_HTTP" "200" "Backend accessible"

echo "ℹ️  Début simulé : $DATE_IL_Y_A_3_MOIS"

# ============================================================
# 2. UTILISATEURS, COMPTE ET CATÉGORIE
# ============================================================

afficher_etape "2. PRÉPARATION DES DONNÉES"

CODE_HTTP=$(requete_http "POST" "$API_URL/utilisateurs" "{
  \"nom\": \"Propriétaire\", \"prenom\": \"Génération\",
  \"email\": \"$EMAIL_1\", \"mot_de_passe\": \"$MOT_DE_PASSE\"
}")
verifier_code_http "$CODE_HTTP" "201" "Création du premier utilisateur"

CODE_HTTP=$(requete_http "POST" "$API_URL/utilisateurs" "{
  \"nom\": \"Intrus\", \"prenom\": \"Génération\",
  \"email\": \"$EMAIL_2\", \"mot_de_passe\": \"$MOT_DE_PASSE\"
}")
verifier_code_http "$CODE_HTTP" "201" "Création du second utilisateur"

ouvrir_session_pour "$JAR_1" "$EMAIL_1" "$MOT_DE_PASSE" "Connexion du premier utilisateur"
ouvrir_session_pour "$JAR_2" "$EMAIL_2" "$MOT_DE_PASSE" "Connexion du second utilisateur"

utiliser_session "$JAR_1"

CODE_HTTP=$(requete_http "POST" "$API_URL/comptes" "{
  \"nom\": \"Compte courant\", \"type_compte\": \"courant\",
  \"sous_type_compte\": \"compte_courant\",
  \"solde_initial\": 5000, \"devise\": \"EUR\"
}")
verifier_code_http "$CODE_HTTP" "201" "Création du compte"
COMPTE_ID=$(recuperer_identifiant "le compte")

CODE_HTTP=$(requete_http "POST" "$API_URL/categories" "{
  \"nom\": \"Logement ${TIMESTAMP}\", \"type_categorie\": \"depense\"
}")
verifier_code_http "$CODE_HTTP" "201" "Création de la catégorie"
CATEGORIE_ID=$(recuperer_identifiant "la catégorie")

# ============================================================
# 3. GÉNÉRATION À VIDE
# ============================================================

afficher_etape "3. GÉNÉRATION SANS AUCUNE RÉCURRENCE"

CODE_HTTP=$(requete_http "POST" "$API_URL/recurrences/generer")
verifier_code_http "$CODE_HTTP" "200" "Génération acceptée"
verifier_json '.nombre_creees == 0' "Aucune transaction créée"

# ============================================================
# 4. RATTRAPAGE DE TROIS MOIS
# ============================================================

afficher_etape "4. RATTRAPAGE D'UNE RÉCURRENCE ÉCHUE"

# Début il y a 3 mois, mensuelle : 4 occurrences dues
# (le mois de départ, puis les trois suivants).
CODE_HTTP=$(requete_http "POST" "$API_URL/recurrences" "{
  \"compte_id\": $COMPTE_ID, \"categorie_id\": $CATEGORIE_ID,
  \"libelle\": \"Loyer\", \"montant\": -750,
  \"type_transaction\": \"depense\", \"frequence\": \"mensuelle\",
  \"date_debut\": \"$DATE_IL_Y_A_3_MOIS\"
}")
verifier_code_http "$CODE_HTTP" "201" "Création de la récurrence échue"
RECURRENCE_ID=$(recuperer_identifiant "la récurrence")

CODE_HTTP=$(requete_http "POST" "$API_URL/recurrences/generer")
verifier_code_http "$CODE_HTTP" "200" "Génération du rattrapage"
verifier_json '.nombre_creees == 4' "Quatre transactions générées"
verifier_json '.transactions | all(.libelle == "Loyer")' "Le libellé est repris du modèle"
verifier_json ".transactions | all(.recurrence_id == $RECURRENCE_ID)" \
  "Chaque transaction est reliée à sa récurrence"
verifier_json '.transactions | all(.montant == "-750.00")' "Le montant est repris du modèle"

# ============================================================
# 5. IDEMPOTENCE
# ============================================================

afficher_etape "5. LE SECOND APPEL NE CRÉE PAS DE DOUBLON"

CODE_HTTP=$(requete_http "POST" "$API_URL/recurrences/generer")
verifier_code_http "$CODE_HTTP" "200" "Seconde génération acceptée"
verifier_json '.nombre_creees == 0' "Aucune transaction recréée"

# Le curseur doit avoir dépassé aujourd'hui.
CODE_HTTP=$(requete_http "GET" "$API_URL/recurrences/$RECURRENCE_ID")
verifier_code_http "$CODE_HTTP" "200" "Lecture de la récurrence"
AUJOURDHUI=$(date "+%Y-%m-%d")
verifier_json "(.prochaine_occurrence > \"$AUJOURDHUI\")" \
  "Le curseur pointe vers une date future"

# ============================================================
# 6. RÉCURRENCE FUTURE
# ============================================================

afficher_etape "6. UNE RÉCURRENCE FUTURE NE GÉNÈRE RIEN"

CODE_HTTP=$(requete_http "POST" "$API_URL/recurrences" "{
  \"compte_id\": $COMPTE_ID, \"libelle\": \"Assurance\",
  \"montant\": -30, \"type_transaction\": \"depense\",
  \"frequence\": \"mensuelle\", \"date_debut\": \"$DATE_DANS_1_MOIS\"
}")
verifier_code_http "$CODE_HTTP" "201" "Création d'une récurrence future"
RECURRENCE_FUTURE_ID=$(recuperer_identifiant "la récurrence future")

CODE_HTTP=$(requete_http "POST" "$API_URL/recurrences/generer")
verifier_code_http "$CODE_HTTP" "200" "Génération acceptée"
verifier_json '.nombre_creees == 0' "Rien n'est généré dans le futur"

# ============================================================
# 7. RÉCURRENCE EN PAUSE
# ============================================================

afficher_etape "7. UNE RÉCURRENCE EN PAUSE NE GÉNÈRE RIEN"

CODE_HTTP=$(requete_http "POST" "$API_URL/recurrences" "{
  \"compte_id\": $COMPTE_ID, \"libelle\": \"Abonnement suspendu\",
  \"montant\": -10, \"type_transaction\": \"depense\",
  \"frequence\": \"mensuelle\", \"date_debut\": \"$DATE_IL_Y_A_3_MOIS\",
  \"active\": false
}")
verifier_code_http "$CODE_HTTP" "201" "Création d'une récurrence en pause"
RECURRENCE_PAUSE_ID=$(recuperer_identifiant "la récurrence en pause")

CODE_HTTP=$(requete_http "POST" "$API_URL/recurrences/generer")
verifier_code_http "$CODE_HTTP" "200" "Génération acceptée"
verifier_json '.nombre_creees == 0' "Une récurrence en pause est ignorée"

# ============================================================
# 8. ÉTANCHÉITÉ
# ============================================================

afficher_etape "8. LE SECOND UTILISATEUR NE GÉNÈRE RIEN"

utiliser_session "$JAR_2"

CODE_HTTP=$(requete_http "POST" "$API_URL/recurrences/generer")
verifier_code_http "$CODE_HTTP" "200" "Génération acceptée pour le second utilisateur"
verifier_json '.nombre_creees == 0' "Les récurrences d'autrui ne sont pas générées"

CODE_HTTP=$(requete_http "GET" "$API_URL/transactions")
verifier_code_http "$CODE_HTTP" "200" "Liste des transactions du second utilisateur"
verifier_json '.transactions | length == 0' "Aucune transaction visible"

# ============================================================
# 9. SURVIE DE L'HISTORIQUE
# ============================================================

afficher_etape "9. SUPPRIMER LA RÉCURRENCE GARDE LES TRANSACTIONS"

utiliser_session "$JAR_1"

CODE_HTTP=$(requete_http "DELETE" "$API_URL/recurrences/$RECURRENCE_ID")
verifier_code_http "$CODE_HTTP" "200" "Suppression de la récurrence"

CODE_HTTP=$(requete_http "GET" "$API_URL/transactions?limite=50")
verifier_code_http "$CODE_HTTP" "200" "Liste des transactions"
verifier_json '[.transactions[] | select(.libelle == "Loyer")] | length == 4' \
  "Les quatre loyers générés existent toujours"
verifier_json '[.transactions[] | select(.libelle == "Loyer" and .recurrence_id != null)] | length == 0' \
  "Leur lien vers la récurrence a été mis à null"

# ============================================================
# 10. NETTOYAGE
# ============================================================

afficher_etape "10. NETTOYAGE"

requete_http "DELETE" "$API_URL/recurrences/$RECURRENCE_FUTURE_ID" >/dev/null
requete_http "DELETE" "$API_URL/recurrences/$RECURRENCE_PAUSE_ID" >/dev/null

# Les transactions doivent partir avant le compte : la clé
# étrangère compte_id n'est pas ON DELETE SET NULL.
for ID_TRANSACTION in $(jq -r '.transactions[].id' "$RESPONSE_FILE" 2>/dev/null); do
  requete_http "DELETE" "$API_URL/transactions/$ID_TRANSACTION" >/dev/null
done

CODE_HTTP=$(requete_http "GET" "$API_URL/transactions?limite=50")
for ID_TRANSACTION in $(jq -r '.transactions[].id' "$RESPONSE_FILE"); do
  requete_http "DELETE" "$API_URL/transactions/$ID_TRANSACTION" >/dev/null
done

CODE_HTTP=$(requete_http "DELETE" "$API_URL/categories/$CATEGORIE_ID")
verifier_code_http "$CODE_HTTP" "200" "Suppression de la catégorie"

CODE_HTTP=$(requete_http "DELETE" "$API_URL/comptes/$COMPTE_ID")
verifier_code_http "$CODE_HTTP" "200" "Suppression du compte"

echo
echo "=================================================="
echo "✅ TOUS LES TESTS DE GÉNÉRATION SONT PASSÉS"
echo "=================================================="