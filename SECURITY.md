# Security policy

🇫🇷 [Lire en français](SECURITY.fr.md)

## Supported versions

FinancePilot is under active development.
Only the latest code on the `main` branch receives security fixes.

## Reporting a vulnerability

Please do not open a public issue.

1. Go to the **Security** tab of this repository.
2. Click **Report a vulnerability** (GitHub private vulnerability reporting).
3. Describe what is affected, how to reproduce it, and the impact you expect.

You will get a first answer within 7 days.
Once the fix is released, the vulnerability is published as a GitHub security advisory, with credit if you wish.

## Scope

- In scope: this repository → API, web app, container images, CI workflows.
- Out of scope: [financepilot-v0](https://github.com/victormetral/financepilot-v0) (archived), third-party services.

## How the project protects itself

- Dependabot alerts, and dependency updates every Monday.
- CodeQL code scanning on every pull request.
- Secret scanning with push protection.
- `npm audit` and a Trivy scan of both container images: a HIGH or CRITICAL vulnerability with a fix blocks the merge.
- Container images published from `main` only, with signed build provenance and SBOM attestations.

## Verifying an image

```bash
gh attestation verify oci://ghcr.io/victormetral/financepilot-api:<commit-sha> --repo victormetral/financepilot
gh attestation verify oci://ghcr.io/victormetral/financepilot-web:<commit-sha> --repo victormetral/financepilot
```
