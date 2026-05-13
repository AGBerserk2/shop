# Anroy

Tienda online de esmaltes en República Dominicana, construida sobre [EverShop](https://evershop.io) con Supabase (Postgres), Firebase Auth + Storage y Cloud Run.

## Stack

- **Frontend & SSR**: EverShop (React + Express + GraphQL)
- **Base de datos**: Supabase Postgres (session pooler `aws-1-us-west-2.pooler.supabase.com:5432`)
- **Auth**: Firebase Auth (email/password + Google)
- **Storage**: Firebase Storage / GCS (`anroy-shop-media`)
- **Hosting**: Cloud Run (`us-east1`)
- **CI/CD**: GitHub Actions → Cloud Build → Cloud Run, con Workload Identity Federation

## Desarrollo local

```bash
npm install
npm run compile && npm run compile:db
npm run dev
```

Necesitás `.env` con `DB_*` + `FIREBASE_WEB_API_KEY` + `FIREBASE_AUTH_DOMAIN` + `FIREBASE_PROJECT_ID` + `FIREBASE_APP_ID`. Para auth server-side el helper cae a Application Default Credentials, así que en dev podés autenticarte con `gcloud auth application-default login`.

## Deploy

Cada `git push` a `dev` o `main` dispara el workflow `.github/workflows/deploy-cloud-run.yml`, que llama a `cloudbuild.yaml`. Una falla rolea automáticamente a la revisión anterior.

URL actual: <https://anroy-shop-xqdo3btyka-ue.a.run.app>

## Setup one-time (solo si reconstruís el proyecto GCP desde cero)

Está documentado en el historial de commits (`feat(deploy): production-ready Cloud Run pipeline`). Resumen:

1. Habilitar APIs: `run`, `cloudbuild`, `artifactregistry`, `secretmanager`, `iamcredentials`, `sts`.
2. Crear Artifact Registry `anroy` en `us-east1`.
3. Crear Workload Identity Pool `github` + provider OIDC vinculado al repo.
4. Crear service account `gh-deployer` con roles `cloudbuild.builds.editor`, `run.admin`, `iam.serviceAccountUser`, `artifactregistry.writer`, `storage.admin`, `secretmanager.secretAccessor`, `logging.logWriter`.
5. Pegar 12 secretos en Secret Manager (DB_*, FIREBASE_*, COOKIE_SECRET).
6. Setear 3 secrets en GitHub (GCP_WIF_PROVIDER, GCP_DEPLOYER_SA, GCP_PROJECT_ID).
7. `gh workflow run "Deploy to Cloud Run"` para el primer deploy.

## Licencia

Forkeado de [EverShop](https://github.com/evershopcommerce/evershop) — GPL-3.0.
