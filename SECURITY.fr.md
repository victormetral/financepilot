# Politique de sécurité

🇬🇧 [Read in English](SECURITY.md)

## Versions suivies

FinancePilot est en cours de développement.
Seul le code le plus récent de la branche `main` reçoit les correctifs de sécurité.

## Signaler une faille

Merci de ne pas ouvrir de ticket (issue) public.

1. Ouvrir l'onglet **Security** de ce dépôt.
2. Cliquer sur **Report a vulnerability** (signalement privé des failles de GitHub).
3. Décrire ce qui est touché, comment le reproduire, et l'impact attendu.

Une première réponse arrive sous 7 jours.
Une fois le correctif publié, la faille est rendue publique dans un avis de sécurité GitHub, avec le nom de la personne qui l'a trouvée si elle le souhaite.

## Périmètre

- Compris : ce dépôt → API, application web, images Docker, workflows de CI.
- Non compris : [financepilot-v0](https://github.com/victormetral/financepilot-v0) (archivé), les services tiers.

## Comment le projet se protège

- Alertes Dependabot, et mises à jour des dépendances chaque lundi.
- Analyse du code par CodeQL à chaque pull request.
- Détection des secrets, avec blocage à l'envoi (push protection).
- `npm audit` et scan Trivy des deux images Docker : une faille HIGH ou CRITICAL qui a un correctif bloque la fusion.
- Images publiées depuis `main` seulement, avec des attestations signées d'origine et de SBOM (liste des composants).

## Vérifier une image

```bash
gh attestation verify oci://ghcr.io/victormetral/financepilot-api:<sha-du-commit> --repo victormetral/financepilot
gh attestation verify oci://ghcr.io/victormetral/financepilot-web:<sha-du-commit> --repo victormetral/financepilot
```
