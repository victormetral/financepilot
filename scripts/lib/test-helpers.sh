#!/usr/bin/env bash

# ============================================================
# FONCTIONS PARTAGÉES POUR LES SCRIPTS DE TEST FINANCEPILOT
# ============================================================
#
# Rôle général :
# centralise les fonctions communes à tous les scripts de
# scripts/ (affichage, requêtes HTTP, vérification des codes
# et du contenu JSON) pour éviter de les dupliquer dans chaque
# fichier.
#
# Utilisé par :
# - tous les scripts scripts/test-*.sh
#
# Utilisation dans un script :
#   source "$(dirname "$0")/lib/test-helpers.sh"
#
# Convention :
# chaque script définit ses propres variables globales
# (API_URL, RESPONSE_FILE, TOKEN...) avant de sourcer ce
# fichier ou juste après, selon ses besoins. 
# ============================================================

# Affiche un titre homogène pour chaque étape du test.
afficher_etape() {
  echo
  echo "=================================================="
  echo "$1"
  echo "=================================================="
}

# Arrête le script si le code HTTP est différent de celui attendu.
# Nécessite une variable RESPONSE_FILE définie par le script appelant.
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

# Envoie une requête API, sauvegarde sa réponse JSON et renvoie
# son code HTTP. Le JWT est ajouté automatiquement dès que la
# variable globale TOKEN contient une valeur.
# Nécessite RESPONSE_FILE défini par le script appelant.
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

# Vérifie qu'un filtre jq est vrai sur la dernière réponse JSON.
# Utile pour tester une valeur précise (message, structure...)
# plutôt qu'un simple code HTTP.
# Nécessite RESPONSE_FILE défini par le script appelant.
verifier_json() {
  local filtre_jq="$1"
  local nom_test="$2"

  if ! jq -e "$filtre_jq" "$RESPONSE_FILE" >/dev/null; then
    echo "❌ ÉCHEC : $nom_test"
    echo
    echo "Réponse reçue :"
    cat "$RESPONSE_FILE"
    exit 1
  fi

  echo "✅ $nom_test"
}