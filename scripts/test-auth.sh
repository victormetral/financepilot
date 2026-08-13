#!/usr/bin/env bash

# ============================================================
# TESTS COMPLETS DE L'AUTHENTIFICATION
# ============================================================
#
# Rôle : tester les routes
# - POST /api/auth/connexion
# - POST /api/auth/deconnexion
#
# Utilise :
# - scripts/lib/test-helpers.sh (mutualisé)
#
# Depuis Lot 5 : le JWT n'est plus renvoyé dans le JSON mais
# posé en cookie httpOnly. Les tests vérifient donc la présence
# du cookie dans COOKIE_JAR et son effacement à la déconnexion,
# au lieu d'inspecter un champ .token.
#
# Prérequis : backend sur localhost:3000, PostgreSQL démarré,
# curl et jq installés.
# ============================================================

set -e

API_URL="http://localhost:3000/api"
RESPONSE_FILE="/tmp/reponse-auth-financepilot.json"
COOKIE_JAR="/tmp/cookies-auth-financepilot.txt"

TIMESTAMP=$(date +%s)
EMAIL_TEST="jwt-${TIMESTAMP}@financepilot.test"
EMAIL_INCONNU="inconnu-${TIMESTAMP}@financepilot.test"
MOT_DE_PASSE_TEST="MotDePasse123!"
MAUVAIS_MOT_DE_PASSE="MauvaisMotDePasse123!"

UTILISATEUR_ID=""

source "$(dirname "$0")/lib/test-helpers.sh"

# Vérifie la présence (ou l'absence) du cookie de session dans
# le cookie jar. C'est le remplaçant direct de l'ancienne
# vérification du champ .token dans le JSON.
verifier_cookie_session() {
  local presence_attendue="$1"
  local nom_test="$2"

  if grep -q $'\ttoken\t' "$COOKIE_JAR" 2>/dev/null; then
    presence_reelle="present"
  else
    presence_reelle="absent"
  fi

  if [ "$presence_reelle" != "$presence_attendue" ]; then
    echo "❌ ÉCHEC : $nom_test"
    echo "Cookie attendu : $presence_attendue"
    echo "Cookie constaté : $presence_reelle"
    exit 1
  fi

  echo "✅ $nom_test"
}

# Si un test échoue après la création de l'utilisateur, on
# essaie quand même de le supprimer.
nettoyer() {
  if [ -n "$UTILISATEUR_ID" ]; then
    requete_http "DELETE" "$API_URL/utilisateurs/$UTILISATEUR_ID" >/dev/null || true
  fi

  rm -f "$RESPONSE_FILE" "$COOKIE_JAR"
}

trap nettoyer EXIT

# ============================================================
# PRÉREQUIS
# ============================================================

afficher_etape "VÉRIFICATION DES PRÉREQUIS"

for outil in curl jq; do
  if ! command -v "$outil" >/dev/null 2>&1; then
    echo "❌ $outil n'est pas installé."
    exit 1
  fi
done

CODE_HTTP=$(requete_http "GET" "http://localhost:3000/")
verifier_code_http "$CODE_HTTP" "200" "Backend accessible"

# ============================================================
# 1. CRÉATION DE L'UTILISATEUR DE TEST
# ============================================================

afficher_etape "1. CRÉATION DE L'UTILISATEUR DE TEST"

CODE_HTTP=$(requete_http "POST" "$API_URL/utilisateurs" "{
  \"nom\": \"JWT\", \"prenom\": \"Test\",
  \"email\": \"$EMAIL_TEST\", \"mot_de_passe\": \"$MOT_DE_PASSE_TEST\"
}")
verifier_code_http "$CODE_HTTP" "201" "Création utilisateur"

UTILISATEUR_ID=$(recuperer_identifiant "l'utilisateur")
echo "Utilisateur temporaire créé : $UTILISATEUR_ID"

verifier_json 'has("mot_de_passe") | not' "Le mot de passe est absent de la création"

# ============================================================
# 2. CONNEXION RÉUSSIE
# ============================================================

afficher_etape "2. CONNEXION AVEC LES BONS IDENTIFIANTS"

CODE_HTTP=$(requete_http "POST" "$API_URL/auth/connexion" "{
  \"email\": \"$EMAIL_TEST\", \"mot_de_passe\": \"$MOT_DE_PASSE_TEST\"
}")
verifier_code_http "$CODE_HTTP" "200" "Connexion réussie"

verifier_json '.message == "Connexion réussie"' "Le message de confirmation est correct"

# Le JWT ne doit plus circuler dans le corps de la réponse.
verifier_json 'has("token") | not' "Aucun JWT n'est exposé dans le JSON"
verifier_cookie_session "present" "Le cookie de session est posé"

verifier_json '.utilisateur.id != null' "L'utilisateur est présent dans la réponse"

if ! jq -e --argjson utilisateur_id "$UTILISATEUR_ID" \
  '.utilisateur.id == $utilisateur_id' "$RESPONSE_FILE" >/dev/null; then
  echo "❌ L'identifiant utilisateur renvoyé est incorrect."
  cat "$RESPONSE_FILE"
  exit 1
fi

echo "✅ L'identifiant utilisateur est correct"

verifier_json \
  '(.mot_de_passe? == null) and (.utilisateur.mot_de_passe? == null)' \
  "Aucun mot de passe n'est renvoyé"

# ============================================================
# 3. ACCÈS À UNE ROUTE PROTÉGÉE AVEC LE COOKIE
# ============================================================

afficher_etape "3. ACCÈS PROTÉGÉ AVEC LE COOKIE"

CODE_HTTP=$(requete_http "GET" "$API_URL/utilisateurs/$UTILISATEUR_ID")
verifier_code_http "$CODE_HTTP" "200" "Le cookie donne accès aux routes protégées"

# ============================================================
# 4. NORMALISATION DE L'EMAIL
# ============================================================

afficher_etape "4. NORMALISATION DE L'EMAIL"

EMAIL_MAJUSCULES=$(printf '%s' "$EMAIL_TEST" | tr '[:lower:]' '[:upper:]')

CODE_HTTP=$(requete_http "POST" "$API_URL/auth/connexion" "{
  \"email\": \"  $EMAIL_MAJUSCULES  \", \"mot_de_passe\": \"$MOT_DE_PASSE_TEST\"
}")
verifier_code_http "$CODE_HTTP" "200" "Email nettoyé et converti en minuscules"

# ============================================================
# 5. IDENTIFIANTS REFUSÉS
# ============================================================

afficher_etape "5. REFUS D'UN MAUVAIS MOT DE PASSE"

CODE_HTTP=$(requete_http "POST" "$API_URL/auth/connexion" "{
  \"email\": \"$EMAIL_TEST\", \"mot_de_passe\": \"$MAUVAIS_MOT_DE_PASSE\"
}")
verifier_code_http "$CODE_HTTP" "401" "Mauvais mot de passe refusé"
verifier_json '.message == "Email ou mot de passe incorrect"' "Le message de sécurité est volontairement imprécis"

afficher_etape "6. REFUS D'UN EMAIL INCONNU"

CODE_HTTP=$(requete_http "POST" "$API_URL/auth/connexion" "{
  \"email\": \"$EMAIL_INCONNU\", \"mot_de_passe\": \"$MOT_DE_PASSE_TEST\"
}")
verifier_code_http "$CODE_HTTP" "401" "Email inconnu refusé"
verifier_json '.message == "Email ou mot de passe incorrect"' "Email inconnu et mauvais mot de passe ont le même message"

# ============================================================
# 7. VALIDATION DES CHAMPS
# ============================================================

afficher_etape "7. VALIDATION DES CHAMPS DE CONNEXION"

CODE_HTTP=$(requete_http "POST" "$API_URL/auth/connexion" "{
  \"mot_de_passe\": \"$MOT_DE_PASSE_TEST\"
}")
verifier_code_http "$CODE_HTTP" "400" "Email manquant refusé"
verifier_json '.message == "email et mot_de_passe sont obligatoires"' "Message des champs obligatoires correct"

CODE_HTTP=$(requete_http "POST" "$API_URL/auth/connexion" "{
  \"email\": \"$EMAIL_TEST\"
}")
verifier_code_http "$CODE_HTTP" "400" "Mot de passe manquant refusé"

CODE_HTTP=$(requete_http "POST" "$API_URL/auth/connexion" "{
  \"email\": \"email-invalide\", \"mot_de_passe\": \"$MOT_DE_PASSE_TEST\"
}")
verifier_code_http "$CODE_HTTP" "400" "Email invalide refusé"
verifier_json '.message == "email doit avoir un format valide"' "Message de validation de l'email correct"

CODE_HTTP=$(requete_http "POST" "$API_URL/auth/connexion" "{
  \"email\": \"$EMAIL_TEST\", \"mot_de_passe\": \"court\"
}")
verifier_code_http "$CODE_HTTP" "400" "Mot de passe trop court refusé"
verifier_json '.message == "mot_de_passe doit contenir au moins 8 caractères"' "Message de validation du mot de passe correct"

# ============================================================
# 8. DÉCONNEXION
# ============================================================

afficher_etape "8. DÉCONNEXION"

# Une connexion valide est nécessaire : les tests précédents
# ont échoué volontairement et n'ont pas renouvelé le cookie.
CODE_HTTP=$(requete_http "POST" "$API_URL/auth/connexion" "{
  \"email\": \"$EMAIL_TEST\", \"mot_de_passe\": \"$MOT_DE_PASSE_TEST\"
}")
verifier_code_http "$CODE_HTTP" "200" "Reconnexion avant déconnexion"

CODE_HTTP=$(requete_http "POST" "$API_URL/auth/deconnexion")
verifier_code_http "$CODE_HTTP" "200" "Déconnexion réussie"
verifier_json '.message == "Déconnexion réussie"' "Message de déconnexion correct"

CODE_HTTP=$(requete_http "GET" "$API_URL/utilisateurs/$UTILISATEUR_ID")
verifier_code_http "$CODE_HTTP" "401" "Les routes protégées sont de nouveau refusées"

# ============================================================
# 9. SUPPRESSION DE L'UTILISATEUR TEMPORAIRE
# ============================================================

afficher_etape "9. SUPPRESSION DES DONNÉES DE TEST"

CODE_HTTP=$(requete_http "POST" "$API_URL/auth/connexion" "{
  \"email\": \"$EMAIL_TEST\", \"mot_de_passe\": \"$MOT_DE_PASSE_TEST\"
}")
verifier_code_http "$CODE_HTTP" "200" "Reconnexion pour le nettoyage"

CODE_HTTP=$(requete_http "DELETE" "$API_URL/utilisateurs/$UTILISATEUR_ID")
verifier_code_http "$CODE_HTTP" "200" "Suppression utilisateur temporaire"

# Déjà supprimé : le nettoyage automatique ne doit pas recommencer.
UTILISATEUR_ID=""

afficher_etape "✅ TOUS LES TESTS D'AUTHENTIFICATION FONCTIONNENT"