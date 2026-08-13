#!/usr/bin/env bash

# ============================================================
# TEST DES AUTORISATIONS DU CRUD CATÉGORIES
# ============================================================
#
# Rôle :
# vérifie que :
# - une catégorie appartient à l'utilisateur de la session ;
# - utilisateur_id envoyé dans le JSON est ignoré ;
# - un utilisateur ne voit que ses catégories ;
# - il ne peut pas consulter, modifier ou supprimer
#   la catégorie d'un autre utilisateur.
#
# Utilise :
# - scripts/lib/test-helpers.sh (mutualisé)
#
# Depuis Lot 5 : l'authentification passe par un cookie
# httpOnly. Chaque utilisateur a donc son propre fichier de
# cookies (JAR_1, JAR_2) et utiliser_session bascule de l'un
# à l'autre — remplaçant l'ancienne variable TOKEN.
#
# Déroulé :
# 1. prérequis
# 2. création des deux utilisateurs et de leurs sessions
# 3. création d'une catégorie par utilisateur
# 4. l'intrus ne voit que la sienne dans la liste
# 5. l'intrus échoue sur la catégorie étrangère (404)
# 6. le propriétaire retrouve sa catégorie intacte
# 7. nettoyage
# ============================================================

set -e

# ------------------------------------------------------------
# CONFIGURATION
# ------------------------------------------------------------

API_URL="http://localhost:3000/api"
RESPONSE_FILE="/tmp/reponse-autorisation-categories.json"

# Un cookie jar par session : anonyme (avant connexion),
# propriétaire, puis intrus.
JAR_ANONYME="/tmp/cookies-categories-anonyme.txt"
JAR_1="/tmp/cookies-categories-1.txt"
JAR_2="/tmp/cookies-categories-2.txt"
COOKIE_JAR="$JAR_ANONYME"

TIMESTAMP=$(date +%s)
MOT_DE_PASSE="TestFinance123!"
EMAIL_1="autorisation-cat-1-${TIMESTAMP}@financepilot.test"
EMAIL_2="autorisation-cat-2-${TIMESTAMP}@financepilot.test"
NOM_CATEGORIE_1="Alimentation ${TIMESTAMP}"

source "$(dirname "$0")/lib/test-helpers.sh"

nettoyer() {
  rm -f "$RESPONSE_FILE" "$JAR_ANONYME" "$JAR_1" "$JAR_2"
}

trap nettoyer EXIT

# ============================================================
# 1. VÉRIFICATION DES PRÉREQUIS
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

# ============================================================
# 2. CRÉATION DES DEUX UTILISATEURS ET DE LEURS SESSIONS
# ============================================================

afficher_etape "2. CRÉATION DES DEUX UTILISATEURS"

CODE_HTTP=$(requete_http "POST" "$API_URL/utilisateurs" "{
  \"nom\": \"Propriétaire\", \"prenom\": \"Test\",
  \"email\": \"$EMAIL_1\", \"mot_de_passe\": \"$MOT_DE_PASSE\"
}")
verifier_code_http "$CODE_HTTP" "201" "Création du premier utilisateur"
UTILISATEUR_1_ID=$(recuperer_identifiant "le premier utilisateur")

CODE_HTTP=$(requete_http "POST" "$API_URL/utilisateurs" "{
  \"nom\": \"Intrus\", \"prenom\": \"Test\",
  \"email\": \"$EMAIL_2\", \"mot_de_passe\": \"$MOT_DE_PASSE\"
}")
verifier_code_http "$CODE_HTTP" "201" "Création du second utilisateur"
UTILISATEUR_2_ID=$(recuperer_identifiant "le second utilisateur")

ouvrir_session_pour "$JAR_1" "$EMAIL_1" "$MOT_DE_PASSE" "Connexion du premier utilisateur"
ouvrir_session_pour "$JAR_2" "$EMAIL_2" "$MOT_DE_PASSE" "Connexion du second utilisateur"

# ============================================================
# 3. CRÉATION D'UNE CATÉGORIE PAR UTILISATEUR
# ============================================================

afficher_etape "3. CRÉATION DES CATÉGORIES"

utiliser_session "$JAR_1"

# utilisateur_id pointe volontairement vers l'autre utilisateur :
# le backend doit l'ignorer et utiliser l'identité de la session.
CODE_HTTP=$(requete_http "POST" "$API_URL/categories" "{
  \"utilisateur_id\": $UTILISATEUR_2_ID,
  \"nom\": \"$NOM_CATEGORIE_1\", \"type_categorie\": \"depense\"
}")
verifier_code_http "$CODE_HTTP" "201" "Création de la catégorie du premier utilisateur"
CATEGORIE_1_ID=$(recuperer_identifiant "la première catégorie")

if [ "$(jq -r '.utilisateur_id' "$RESPONSE_FILE")" != "$UTILISATEUR_1_ID" ]; then
  echo "❌ utilisateur_id envoyé dans le JSON n'a pas été ignoré."
  cat "$RESPONSE_FILE"
  exit 1
fi

echo "✅ Le propriétaire vient bien de la session"

utiliser_session "$JAR_2"

CODE_HTTP=$(requete_http "POST" "$API_URL/categories" "{
  \"nom\": \"Transport ${TIMESTAMP}\", \"type_categorie\": \"depense\"
}")
verifier_code_http "$CODE_HTTP" "201" "Création de la catégorie du second utilisateur"
CATEGORIE_2_ID=$(recuperer_identifiant "la seconde catégorie")

# ============================================================
# 4. LISTE PRIVÉE DU SECOND UTILISATEUR
# ============================================================

afficher_etape "4. LISTE PRIVÉE DU SECOND UTILISATEUR"

CODE_HTTP=$(requete_http "GET" "$API_URL/categories")
verifier_code_http "$CODE_HTTP" "200" "Liste des catégories accessible"

if ! jq -e \
  --argjson categorieId "$CATEGORIE_2_ID" \
  --argjson utilisateurId "$UTILISATEUR_2_ID" \
  'length == 1 and .[0].id == $categorieId and .[0].utilisateur_id == $utilisateurId' \
  "$RESPONSE_FILE" >/dev/null; then
  echo "❌ Le second utilisateur ne devrait voir que sa catégorie."
  cat "$RESPONSE_FILE"
  exit 1
fi

echo "✅ Le second utilisateur voit uniquement sa catégorie"

# ============================================================
# 5. TENTATIVES CONTRE LA CATÉGORIE ÉTRANGÈRE
# ============================================================

afficher_etape "5. TENTATIVES CONTRE LA CATÉGORIE ÉTRANGÈRE"

CODE_HTTP=$(requete_http "GET" "$API_URL/categories/$CATEGORIE_1_ID")
verifier_code_http "$CODE_HTTP" "404" "Consultation de la catégorie étrangère refusée"

CODE_HTTP=$(requete_http "PUT" "$API_URL/categories/$CATEGORIE_1_ID" "{
  \"nom\": \"Catégorie piratée\", \"type_categorie\": \"revenu\"
}")
verifier_code_http "$CODE_HTTP" "404" "Modification de la catégorie étrangère refusée"

CODE_HTTP=$(requete_http "DELETE" "$API_URL/categories/$CATEGORIE_1_ID")
verifier_code_http "$CODE_HTTP" "404" "Suppression de la catégorie étrangère refusée"

# ============================================================
# 6. VÉRIFICATION AVEC LE PROPRIÉTAIRE
# ============================================================

afficher_etape "6. VÉRIFICATION AVEC LE PROPRIÉTAIRE"

utiliser_session "$JAR_1"

CODE_HTTP=$(requete_http "GET" "$API_URL/categories/$CATEGORIE_1_ID")
verifier_code_http "$CODE_HTTP" "200" "Le propriétaire peut consulter sa catégorie"

# Le nom contient un timestamp variable : la comparaison se fait
# donc en bash plutôt qu'avec un filtre jq figé.
if [ "$(jq -r '.nom' "$RESPONSE_FILE")" != "$NOM_CATEGORIE_1" ]; then
  echo "❌ La tentative étrangère a modifié la catégorie."
  cat "$RESPONSE_FILE"
  exit 1
fi

echo "✅ La catégorie n'a pas été modifiée par l'intrus"

# ============================================================
# 7. SUPPRESSION DES DONNÉES DE TEST
# ============================================================

afficher_etape "7. SUPPRESSION DES DONNÉES DE TEST"

CODE_HTTP=$(requete_http "DELETE" "$API_URL/categories/$CATEGORIE_1_ID")
verifier_code_http "$CODE_HTTP" "200" "Suppression de la première catégorie"

utiliser_session "$JAR_2"

CODE_HTTP=$(requete_http "DELETE" "$API_URL/categories/$CATEGORIE_2_ID")
verifier_code_http "$CODE_HTTP" "200" "Suppression de la seconde catégorie"

CODE_HTTP=$(requete_http "DELETE" "$API_URL/utilisateurs/$UTILISATEUR_2_ID")
verifier_code_http "$CODE_HTTP" "200" "Suppression du second utilisateur"

utiliser_session "$JAR_1"

CODE_HTTP=$(requete_http "DELETE" "$API_URL/utilisateurs/$UTILISATEUR_1_ID")
verifier_code_http "$CODE_HTTP" "200" "Suppression du premier utilisateur"

afficher_etape "✅ AUTORISATIONS DES CATÉGORIES VALIDÉES"