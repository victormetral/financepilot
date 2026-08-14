#!/usr/bin/env bash

# ============================================================
# TEST DU CRUD DES RÉCURRENCES
# ============================================================
#
# Rôle : vérifie le cycle complet d'une récurrence (création,
# lecture, modification, suppression), le refus des données
# invalides, et l'étanchéité entre deux utilisateurs.
#
# Utilise : scripts/lib/test-helpers.sh (mutualisé)
#
# Ce que le script NE teste pas : la génération des occurrences,
# qui arrive au groupe 3 et aura son propre script.
# ============================================================

set -e

API_URL="http://localhost:3000/api"
RESPONSE_FILE="/tmp/reponse-crud-recurrences.json"
JAR_ANONYME="/tmp/cookies-recurrences-anonyme.txt"
JAR_1="/tmp/cookies-recurrences-1.txt"
JAR_2="/tmp/cookies-recurrences-2.txt"
COOKIE_JAR="$JAR_ANONYME"

TIMESTAMP=$(date +%s)
MOT_DE_PASSE="TestFinance123!"
EMAIL_1="recurrence-1-${TIMESTAMP}@financepilot.test"
EMAIL_2="recurrence-2-${TIMESTAMP}@financepilot.test"

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

# ============================================================
# 2. DEUX UTILISATEURS ET LEURS SESSIONS
# ============================================================

afficher_etape "2. CRÉATION DES DEUX UTILISATEURS"

CODE_HTTP=$(requete_http "POST" "$API_URL/utilisateurs" "{
  \"nom\": \"Propriétaire\", \"prenom\": \"Récurrence\",
  \"email\": \"$EMAIL_1\", \"mot_de_passe\": \"$MOT_DE_PASSE\"
}")
verifier_code_http "$CODE_HTTP" "201" "Création du premier utilisateur"

CODE_HTTP=$(requete_http "POST" "$API_URL/utilisateurs" "{
  \"nom\": \"Intrus\", \"prenom\": \"Récurrence\",
  \"email\": \"$EMAIL_2\", \"mot_de_passe\": \"$MOT_DE_PASSE\"
}")
verifier_code_http "$CODE_HTTP" "201" "Création du second utilisateur"

ouvrir_session_pour "$JAR_1" "$EMAIL_1" "$MOT_DE_PASSE" "Connexion du premier utilisateur"
ouvrir_session_pour "$JAR_2" "$EMAIL_2" "$MOT_DE_PASSE" "Connexion du second utilisateur"

# ============================================================
# 3. DONNÉES DE BASE DU PREMIER UTILISATEUR
# ============================================================

afficher_etape "3. COMPTE ET CATÉGORIE"

utiliser_session "$JAR_1"

CODE_HTTP=$(requete_http "POST" "$API_URL/comptes" "{
  \"nom\": \"Compte courant\", \"type_compte\": \"courant\",
  \"sous_type_compte\": \"compte_courant\",
  \"solde_initial\": 2000, \"devise\": \"EUR\"
}")
verifier_code_http "$CODE_HTTP" "201" "Création du compte"
COMPTE_ID=$(recuperer_identifiant "le compte")

CODE_HTTP=$(requete_http "POST" "$API_URL/categories" "{
  \"nom\": \"Logement ${TIMESTAMP}\", \"type_categorie\": \"depense\"
}")
verifier_code_http "$CODE_HTTP" "201" "Création de la catégorie"
CATEGORIE_ID=$(recuperer_identifiant "la catégorie")

# ============================================================
# 4. CRÉATION D'UNE RÉCURRENCE
# ============================================================

afficher_etape "4. CRÉATION DE LA RÉCURRENCE"

CODE_HTTP=$(requete_http "POST" "$API_URL/recurrences" "{
  \"compte_id\": $COMPTE_ID, \"categorie_id\": $CATEGORIE_ID,
  \"libelle\": \"Loyer\", \"montant\": -750,
  \"type_transaction\": \"depense\", \"frequence\": \"mensuelle\",
  \"date_debut\": \"2026-09-05\"
}")
verifier_code_http "$CODE_HTTP" "201" "Création de la récurrence"
RECURRENCE_ID=$(recuperer_identifiant "la récurrence")

# Le curseur doit être initialisé à la date de début, et les
# valeurs par défaut appliquées sans avoir été envoyées.
verifier_json '.prochaine_occurrence | startswith("2026-09-05")' \
  "prochaine_occurrence initialisée à date_debut"
verifier_json '.intervalle == 1' "intervalle par défaut à 1"
verifier_json '.active == true' "récurrence active par défaut"
verifier_json '.date_fin == null' "récurrence sans date de fin"

# ============================================================
# 5. LECTURE
# ============================================================

afficher_etape "5. LECTURE"

CODE_HTTP=$(requete_http "GET" "$API_URL/recurrences")
verifier_code_http "$CODE_HTTP" "200" "Liste des récurrences"
verifier_json 'length == 1' "La liste contient une récurrence"
verifier_json '.[0].nom_compte != null' "Le nom du compte est joint"
verifier_json '.[0].nom_categorie != null' "Le nom de la catégorie est joint"

CODE_HTTP=$(requete_http "GET" "$API_URL/recurrences/$RECURRENCE_ID")
verifier_code_http "$CODE_HTTP" "200" "Lecture par identifiant"

CODE_HTTP=$(requete_http "GET" "$API_URL/recurrences/999999")
verifier_code_http "$CODE_HTTP" "404" "Récurrence inexistante refusée"

CODE_HTTP=$(requete_http "GET" "$API_URL/recurrences/abc")
verifier_code_http "$CODE_HTTP" "400" "Identifiant non numérique refusé"

# ============================================================
# 6. DONNÉES INVALIDES
# ============================================================

afficher_etape "6. REFUS DES DONNÉES INVALIDES"

CODE_HTTP=$(requete_http "POST" "$API_URL/recurrences" "{
  \"compte_id\": $COMPTE_ID, \"libelle\": \"Sans fréquence\",
  \"montant\": -10, \"type_transaction\": \"depense\",
  \"date_debut\": \"2026-09-05\"
}")
verifier_code_http "$CODE_HTTP" "400" "Fréquence manquante refusée"

CODE_HTTP=$(requete_http "POST" "$API_URL/recurrences" "{
  \"compte_id\": $COMPTE_ID, \"libelle\": \"Fréquence inventée\",
  \"montant\": -10, \"type_transaction\": \"depense\",
  \"frequence\": \"toutes_les_lunes\", \"date_debut\": \"2026-09-05\"
}")
verifier_code_http "$CODE_HTTP" "400" "Fréquence inconnue refusée"

# Un transfert exige un compte de destination : hors périmètre 9d.
CODE_HTTP=$(requete_http "POST" "$API_URL/recurrences" "{
  \"compte_id\": $COMPTE_ID, \"libelle\": \"Virement PEA\",
  \"montant\": -300, \"type_transaction\": \"transfert\",
  \"frequence\": \"mensuelle\", \"date_debut\": \"2026-09-05\"
}")
verifier_code_http "$CODE_HTTP" "400" "Type transfert refusé"

CODE_HTTP=$(requete_http "POST" "$API_URL/recurrences" "{
  \"compte_id\": $COMPTE_ID, \"libelle\": \"Intervalle nul\",
  \"montant\": -10, \"type_transaction\": \"depense\",
  \"frequence\": \"mensuelle\", \"intervalle\": 0,
  \"date_debut\": \"2026-09-05\"
}")
verifier_code_http "$CODE_HTTP" "400" "Intervalle à 0 refusé"

CODE_HTTP=$(requete_http "POST" "$API_URL/recurrences" "{
  \"compte_id\": $COMPTE_ID, \"libelle\": \"Fin avant début\",
  \"montant\": -10, \"type_transaction\": \"depense\",
  \"frequence\": \"mensuelle\", \"date_debut\": \"2026-09-05\",
  \"date_fin\": \"2026-08-05\"
}")
verifier_code_http "$CODE_HTTP" "400" "Date de fin antérieure refusée"

CODE_HTTP=$(requete_http "POST" "$API_URL/recurrences" "{
  \"compte_id\": $COMPTE_ID, \"libelle\": \"Montant nul\",
  \"montant\": 0, \"type_transaction\": \"depense\",
  \"frequence\": \"mensuelle\", \"date_debut\": \"2026-09-05\"
}")
verifier_code_http "$CODE_HTTP" "400" "Montant à 0 refusé"

# ============================================================
# 7. MODIFICATION
# ============================================================

afficher_etape "7. MODIFICATION"

CODE_HTTP=$(requete_http "PUT" "$API_URL/recurrences/$RECURRENCE_ID" "{
  \"compte_id\": $COMPTE_ID, \"categorie_id\": $CATEGORIE_ID,
  \"libelle\": \"Loyer révisé\", \"montant\": -800,
  \"type_transaction\": \"depense\", \"frequence\": \"mensuelle\",
  \"intervalle\": 1, \"date_debut\": \"2026-09-05\",
  \"date_fin\": \"2027-09-05\", \"active\": false
}")
verifier_code_http "$CODE_HTTP" "200" "Modification de la récurrence"
verifier_json '.libelle == "Loyer révisé"' "Le libellé est modifié"
verifier_json '.active == false' "La récurrence est mise en pause"
verifier_json '.date_fin != null' "La date de fin est enregistrée"

# ============================================================
# 8. ÉTANCHÉITÉ ENTRE UTILISATEURS
# ============================================================

afficher_etape "8. ISOLATION DU SECOND UTILISATEUR"

utiliser_session "$JAR_2"

CODE_HTTP=$(requete_http "GET" "$API_URL/recurrences")
verifier_code_http "$CODE_HTTP" "200" "Liste accessible au second utilisateur"
verifier_json 'length == 0' "Le second utilisateur ne voit aucune récurrence"

CODE_HTTP=$(requete_http "GET" "$API_URL/recurrences/$RECURRENCE_ID")
verifier_code_http "$CODE_HTTP" "404" "Lecture de la récurrence d'autrui refusée"

CODE_HTTP=$(requete_http "PUT" "$API_URL/recurrences/$RECURRENCE_ID" "{
  \"compte_id\": $COMPTE_ID, \"libelle\": \"Détournement\",
  \"montant\": -1, \"type_transaction\": \"depense\",
  \"frequence\": \"mensuelle\", \"date_debut\": \"2026-09-05\"
}")
verifier_code_http "$CODE_HTTP" "404" "Modification de la récurrence d'autrui refusée"

CODE_HTTP=$(requete_http "DELETE" "$API_URL/recurrences/$RECURRENCE_ID")
verifier_code_http "$CODE_HTTP" "404" "Suppression de la récurrence d'autrui refusée"

# Créer une récurrence sur le compte d'un autre doit échouer.
CODE_HTTP=$(requete_http "POST" "$API_URL/recurrences" "{
  \"compte_id\": $COMPTE_ID, \"libelle\": \"Sur compte volé\",
  \"montant\": -50, \"type_transaction\": \"depense\",
  \"frequence\": \"mensuelle\", \"date_debut\": \"2026-09-05\"
}")
verifier_code_http "$CODE_HTTP" "404" "Création sur le compte d'autrui refusée"

# ============================================================
# 9. SUPPRESSION PAR LE PROPRIÉTAIRE
# ============================================================

afficher_etape "9. SUPPRESSION"

utiliser_session "$JAR_1"

CODE_HTTP=$(requete_http "DELETE" "$API_URL/recurrences/$RECURRENCE_ID")
verifier_code_http "$CODE_HTTP" "200" "Suppression par le propriétaire"

CODE_HTTP=$(requete_http "GET" "$API_URL/recurrences/$RECURRENCE_ID")
verifier_code_http "$CODE_HTTP" "404" "La récurrence a bien disparu"

# ============================================================
# 10. NETTOYAGE
# ============================================================

afficher_etape "10. NETTOYAGE"

CODE_HTTP=$(requete_http "DELETE" "$API_URL/categories/$CATEGORIE_ID")
verifier_code_http "$CODE_HTTP" "200" "Suppression de la catégorie"

CODE_HTTP=$(requete_http "DELETE" "$API_URL/comptes/$COMPTE_ID")
verifier_code_http "$CODE_HTTP" "200" "Suppression du compte"

echo
echo "=================================================="
echo "✅ TOUS LES TESTS DU CRUD RÉCURRENCES SONT PASSÉS"
echo "=================================================="