# AKRA Operations Runbook

## 1. Environment & Health Verification

Before and after any deployment, verify configuration and process readiness:

1. Ensure all 6 `NEXT_PUBLIC_FIREBASE_*` environment variables are populated in your hosting environment (production fails closed when omitted; `NEXT_PUBLIC_ENABLE_DEMO_MODE=true` is ignored in `NODE_ENV=production`).
2. Probe the built-in health endpoint:

```bash
curl -fsS https://<your-domain>/api/health
```

Expected payload fields:
- `status: "ok"`
- `firebaseConfigured: true`
- `missingFirebaseKeys: []`

## 2. Deploying Firestore Security Rules

Always deploy updated rules before releasing schema or write-path changes:

```bash
firebase login
firebase use <project-id>
firebase deploy --only firestore:rules
```

Reference rules live in [firestore.rules](../firestore.rules). Rules enforce owner-only writes for `users`, `progress`, `goals`, and `posts`, bounded query limits match `FIRESTORE_QUERY_LIMITS`, and deny-all applies by default.

## 3. Firestore Backup, Export & Restore

Configure a Cloud Storage backup bucket in the same region as your Firestore database, then run managed exports prior to migrations or on a daily schedule:

```bash
# Manual export
gcloud firestore export gs://<backup-bucket>/akra-backups/$(date -u +%Y%m%d-%H%M%S) \
  --project=<project-id>

# Restore from a snapshot (writes into target database; test in staging first)
gcloud firestore import gs://<backup-bucket>/akra-backups/<timestamp> \
  --project=<project-id>
```

## 4. Application Rollback

1. Promote the previous verified immutable deployment in your hosting provider (Vercel / Cloud Run / App Hosting) or redeploy the previous release commit tag:
   ```bash
   git checkout <last-known-good-tag-or-sha>
   npm ci && npm run build
   ```
2. If Firestore rules caused write rejections, revert [firestore.rules](../firestore.rules) to the prior commit and run `firebase deploy --only firestore:rules`.
3. Verify `/api/health` returns `status: "ok"` and confirm zero elevated `error` events from `src/lib/logger.ts`.

## 5. Incident Triage Checklist

- **Users cannot sign in**: Check `firebase.init_failed` / `firebase.config_partial` logs and `/api/health` (`missingFirebaseKeys`), plus Authorized Domains in Firebase Auth Console.
- **Outbound sync failures (`firestore.outbound_sync_failed`)**: Confirm `firestore.rules` matches `cleanUndefined` document keys (`userId == request.auth.uid`) and check Firestore quota usage.
- **Slow or failing book search (`book_api.*_failed`)**: Upstream Google Books / Open Library timeout (`7000ms` via `fetchWithTimeout`) falls back automatically to cached local books (`filterLocalBooks`).
