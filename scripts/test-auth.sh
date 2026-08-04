#!/usr/bin/env bash

# 🟨 NOUVEAU
# ============================================================
# TESTS COMPLETS DE L’AUTHENTIFICATION JWT
# ============================================================
#
# Rôle :
# tester automatiquement la route :
# POST /api/auth/connexion
#
# Tests effectués :
# 1. création d’un utilisateur temporaire ;
# 2. connexion avec les bons identifiants ;
# 3. vérification de la présence du JWT ;
# 4. vérification de la structure du JWT ;
# 5. vérification de l’absence du mot de passe ;
# 6. normalisation de l’adresse email ;
# 7. refus d’un mauvais mot de passe ;
# 8. refus d’un email inconnu ;
# 9. refus des champs manquants ;
# 10. refus d’un email invalide ;
# 11. refus d’un mot de passe trop court ;
# 12. suppression de l’utilisateur temporaire.
#
# Prérequis :
# - le backend fonctionne sur localhost:3000 ;
# - PostgreSQL est démarré ;
# - curl et jq sont installés.
# ============================================================

# Arrête le script dès qu’une commande échoue.
set -e

# Adresse commune des routes de l’API.
API_URL="http://localhost:3000/api"

# Fichier temporaire contenant la dernière réponse JSON.
FICHIER_REPONSE="/tmp/reponse-auth-financepilot.json"

# Valeur unique évitant les doublons d’emails.
TIMESTAMP=$(date +%s)

EMAIL_TEST="jwt-${TIMESTAMP}@financepilot.test"
EMAIL_INCONNU="inconnu-${TIMESTAMP}@financepilot.test"

MOT_DE_PASSE_TEST="MotDePasse123!"
MAUVAIS_MOT_DE_PASSE="MauvaisMotDePasse123!"

# L’identifiant sera rempli après la création.
UTILISATEUR_ID=""

# ------------------------------------------------------------
# Affichage d’une grande étape
# ------------------------------------------------------------

afficher_etape() {
  echo
  echo "=================================================="
  echo "$1"
  echo "=================================================="
}

# ------------------------------------------------------------
# Envoi d’une requête HTTP
#
# $1 = méthode HTTP : GET, POST, DELETE...
# $2 = URL
# $3 = données JSON facultatives
#
# La réponse JSON est enregistrée dans FICHIER_REPONSE.
# La fonction renvoie uniquement le code HTTP.
# ------------------------------------------------------------

requete_http() {
  methode="$1"
  url="$2"
  donnees="${3:-}"

  # 🟨 NOUVEAU
  jeton="${4:-}"

  if [ -n "$donnees" ]; then
    curl -sS \
      -o "$FICHIER_REPONSE" \
      -w "%{http_code}" \
      -X "$methode" \
      -H "Content-Type: application/json" \
      -d "$donnees" \
      "$url"
  elif [ -n "$jeton" ]; then
    # 🟨 NOUVEAU
    curl -sS \
      -o "$FICHIER_REPONSE" \
      -w "%{http_code}" \
      -X "$methode" \
      -H "Authorization: Bearer $jeton" \
      "$url"
  else
    curl -sS \
      -o "$FICHIER_REPONSE" \
      -w "%{http_code}" \
      -X "$methode" \
      "$url"
  fi
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
# Vérification d’une valeur dans la réponse JSON
#
# jq teste le filtre reçu dans $1.
# ------------------------------------------------------------

verifier_json() {
  filtre_jq="$1"
  nom_test="$2"

  if ! jq -e "$filtre_jq" "$FICHIER_REPONSE" \
    >/dev/null; then
    echo "❌ ÉCHEC : $nom_test"
    echo
    echo "Réponse reçue :"
    cat "$FICHIER_REPONSE"
    echo
    exit 1
  fi

  echo "✅ $nom_test"
}

# ------------------------------------------------------------
# Nettoyage automatique
#
# Si un test échoue après la création de l’utilisateur,
# cette fonction essaie quand même de le supprimer.
# ------------------------------------------------------------

nettoyer_en_cas_erreur() {
  if [ -n "$UTILISATEUR_ID" ]; then
    curl -sS \
      -o /dev/null \
      -X DELETE \
      "$API_URL/utilisateurs/$UTILISATEUR_ID" \
      || true
  fi

  rm -f "$FICHIER_REPONSE"
}

# EXIT signifie :
# exécuter le nettoyage lorsque le script se termine,
# même après une erreur.
trap nettoyer_en_cas_erreur EXIT

# ============================================================
# VÉRIFICATION DES PRÉREQUIS
# ============================================================

afficher_etape "VÉRIFICATION DES PRÉREQUIS"

if ! command -v curl >/dev/null 2>&1; then
  echo "❌ curl n’est pas installé."
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "❌ jq n’est pas installé."
  echo "Installation : brew install jq"
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
# 1. CRÉATION DE L’UTILISATEUR TEMPORAIRE
# ============================================================

afficher_etape "1. CRÉATION DE L’UTILISATEUR DE TEST"

CODE_HTTP=$(requete_http \
  "POST" \
  "$API_URL/utilisateurs" \
  "{
    \"nom\": \"JWT\",
    \"prenom\": \"Test\",
    \"email\": \"$EMAIL_TEST\",
    \"mot_de_passe\": \"$MOT_DE_PASSE_TEST\"
  }")

verifier_code_http \
  "$CODE_HTTP" \
  "201" \
  "Création utilisateur"

UTILISATEUR_ID=$(jq -r '.id' "$FICHIER_REPONSE")

if [ -z "$UTILISATEUR_ID" ] ||
  [ "$UTILISATEUR_ID" = "null" ]; then
  echo "❌ L’identifiant de l’utilisateur est absent."
  cat "$FICHIER_REPONSE"
  exit 1
fi

echo "Utilisateur temporaire créé : $UTILISATEUR_ID"

verifier_json \
  'has("mot_de_passe") | not' \
  "Le mot de passe est absent de la création"

# ============================================================
# 2. CONNEXION RÉUSSIE
# ============================================================

afficher_etape "2. CONNEXION AVEC LES BONS IDENTIFIANTS"

CODE_HTTP=$(requete_http \
  "POST" \
  "$API_URL/auth/connexion" \
  "{
    \"email\": \"$EMAIL_TEST\",
    \"mot_de_passe\": \"$MOT_DE_PASSE_TEST\"
  }")

verifier_code_http \
  "$CODE_HTTP" \
  "200" \
  "Connexion réussie"

verifier_json \
  '.message == "Connexion réussie"' \
  "Le message de confirmation est correct"

verifier_json \
  '.token | type == "string" and length > 0' \
  "Un JWT est présent"

TOKEN=$(jq -r '.token' "$FICHIER_REPONSE")

NOMBRE_PARTIES_JWT=$(
  printf '%s' "$TOKEN" |
    awk -F'.' '{ print NF }'
)

if [ "$NOMBRE_PARTIES_JWT" != "3" ]; then
  echo "❌ Le JWT ne contient pas trois parties."
  exit 1
fi

echo "✅ Le JWT contient trois parties"

if ! jq -e \
  --argjson utilisateur_id "$UTILISATEUR_ID" \
  '.utilisateur.id == $utilisateur_id' \
  "$FICHIER_REPONSE" >/dev/null; then
  echo "❌ L’utilisateur du JWT est incorrect."
  cat "$FICHIER_REPONSE"
  exit 1
fi

echo "✅ L’identifiant utilisateur est correct"

verifier_json \
  '(.mot_de_passe? == null) and (.utilisateur.mot_de_passe? == null)' \
  "Aucun mot de passe n’est renvoyé"

# ============================================================
# 3. NORMALISATION DE L’EMAIL
# ============================================================

afficher_etape "3. NORMALISATION DE L’EMAIL"

EMAIL_MAJUSCULES=$(
  printf '%s' "$EMAIL_TEST" |
    tr '[:lower:]' '[:upper:]'
)

CODE_HTTP=$(requete_http \
  "POST" \
  "$API_URL/auth/connexion" \
  "{
    \"email\": \"  $EMAIL_MAJUSCULES  \",
    \"mot_de_passe\": \"$MOT_DE_PASSE_TEST\"
  }")

verifier_code_http \
  "$CODE_HTTP" \
  "200" \
  "Email nettoyé et converti en minuscules"

# ============================================================
# 4. MAUVAIS MOT DE PASSE
# ============================================================

afficher_etape "4. REFUS D’UN MAUVAIS MOT DE PASSE"

CODE_HTTP=$(requete_http \
  "POST" \
  "$API_URL/auth/connexion" \
  "{
    \"email\": \"$EMAIL_TEST\",
    \"mot_de_passe\": \"$MAUVAIS_MOT_DE_PASSE\"
  }")

verifier_code_http \
  "$CODE_HTTP" \
  "401" \
  "Mauvais mot de passe refusé"

verifier_json \
  '.message == "Email ou mot de passe incorrect"' \
  "Le message de sécurité est volontairement imprécis"

# ============================================================
# 5. EMAIL INCONNU
# ============================================================

afficher_etape "5. REFUS D’UN EMAIL INCONNU"

CODE_HTTP=$(requete_http \
  "POST" \
  "$API_URL/auth/connexion" \
  "{
    \"email\": \"$EMAIL_INCONNU\",
    \"mot_de_passe\": \"$MOT_DE_PASSE_TEST\"
  }")

verifier_code_http \
  "$CODE_HTTP" \
  "401" \
  "Email inconnu refusé"

verifier_json \
  '.message == "Email ou mot de passe incorrect"' \
  "Email inconnu et mauvais mot de passe ont le même message"

# ============================================================
# 6. EMAIL MANQUANT
# ============================================================

afficher_etape "6. REFUS D’UN EMAIL MANQUANT"

CODE_HTTP=$(requete_http \
  "POST" \
  "$API_URL/auth/connexion" \
  "{
    \"mot_de_passe\": \"$MOT_DE_PASSE_TEST\"
  }")

verifier_code_http \
  "$CODE_HTTP" \
  "400" \
  "Email manquant refusé"

verifier_json \
  '.message == "email et mot_de_passe sont obligatoires"' \
  "Message des champs obligatoires correct"

# ============================================================
# 7. MOT DE PASSE MANQUANT
# ============================================================

afficher_etape "7. REFUS D’UN MOT DE PASSE MANQUANT"

CODE_HTTP=$(requete_http \
  "POST" \
  "$API_URL/auth/connexion" \
  "{
    \"email\": \"$EMAIL_TEST\"
  }")

verifier_code_http \
  "$CODE_HTTP" \
  "400" \
  "Mot de passe manquant refusé"

verifier_json \
  '.message == "email et mot_de_passe sont obligatoires"' \
  "Message des champs obligatoires correct"

# ============================================================
# 8. EMAIL INVALIDE
# ============================================================

afficher_etape "8. REFUS D’UN EMAIL INVALIDE"

CODE_HTTP=$(requete_http \
  "POST" \
  "$API_URL/auth/connexion" \
  "{
    \"email\": \"email-invalide\",
    \"mot_de_passe\": \"$MOT_DE_PASSE_TEST\"
  }")

verifier_code_http \
  "$CODE_HTTP" \
  "400" \
  "Email invalide refusé"

verifier_json \
  '.message == "email doit avoir un format valide"' \
  "Message de validation de l’email correct"

# ============================================================
# 9. MOT DE PASSE TROP COURT
# ============================================================

afficher_etape "9. REFUS D’UN MOT DE PASSE TROP COURT"

CODE_HTTP=$(requete_http \
  "POST" \
  "$API_URL/auth/connexion" \
  "{
    \"email\": \"$EMAIL_TEST\",
    \"mot_de_passe\": \"court\"
  }")

verifier_code_http \
  "$CODE_HTTP" \
  "400" \
  "Mot de passe trop court refusé"

verifier_json \
  '.message == "mot_de_passe doit contenir au moins 8 caractères"' \
  "Message de validation du mot de passe correct"

# ============================================================
# 10. SUPPRESSION DE L’UTILISATEUR TEMPORAIRE
# ============================================================

afficher_etape "10. SUPPRESSION DES DONNÉES DE TEST"

CODE_HTTP=$(requete_http \
  "DELETE" \
"$API_URL/utilisateurs/$UTILISATEUR_ID" \
  "" \
  "$TOKEN")

verifier_code_http \
  "$CODE_HTTP" \
  "200" \
  "Suppression utilisateur temporaire"

# L’utilisateur est déjà supprimé :
# le nettoyage automatique ne doit pas recommencer.
UTILISATEUR_ID=""

rm -f "$FICHIER_REPONSE"

afficher_etape "✅ TOUS LES TESTS JWT FONCTIONNENT"