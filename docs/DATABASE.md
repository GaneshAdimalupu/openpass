# Database guide

This project uses **Prisma migrations** on **Supabase (PostgreSQL)**.
Every schema change is a SQL file in `packages/db/prisma/migrations/`, committed to git
and applied in order. The database remembers which files it has already run
(in the `_prisma_migrations` table).

> **Golden rule:** never run `prisma db push`, `prisma migrate reset` or
> `prisma migrate dev` against staging or production. Those are for your local database only.

---

## 1. Environments

| Environment | Database | How it gets migrations |
| ----------- | -------- | ---------------------- |
| Local       | Docker Postgres (or your own dev DB) | `prisma migrate dev` |
| `staging`   | Separate Supabase project | **Deploy migrations** workflow |
| `Production`| Production Supabase project | **Deploy migrations** workflow (needs approval) |

GitHub environment secrets (Settings -> Environments), set separately for `staging` and `Production`:

| Secret | What it is |
| ------ | ---------- |
| `DATABASE_URL` | Supabase **transaction pooler** string (port 6543) |
| `DIRECT_URL` | Supabase **session pooler** string (port 5432). Used for migrations and backups. |
| `BACKUP_PASSPHRASE` | Long random passphrase that encrypts backups. Also keep it in a password manager. |

Never commit or paste these values anywhere. `Production` should only be deployable from `main`.

---

## 2. Everyday commands

| Task | Command |
| ---- | ------- |
| Generate Prisma client | `pnpm turbo run db:generate` |
| Open Prisma Studio | `pnpm --filter db exec prisma studio` |
| Check migration status | `pnpm --filter db exec prisma migrate status` |
| Apply existing migrations (fresh local DB) | `pnpm --filter db exec prisma migrate deploy` |
| Validate the schema file | `pnpm --filter db exec prisma validate` |

---

## 3. Changing the schema

1. Edit `packages/db/prisma/schema.prisma`.
2. Create the migration against your **local** database:
   ```bash
   pnpm --filter db exec prisma migrate dev --name describe_the_change
   ```
3. **Open the generated `migration.sql` and read it.**
   - `DROP TABLE` or `DROP COLUMN` means data will be deleted.
   - A rename appears as drop + create. Edit it to
     `ALTER TABLE "X" RENAME COLUMN "old" TO "new";` by hand.
4. Commit the new migration folder together with the `schema.prisma` change.
5. Open a pull request. CI rebuilds a fresh database from all migrations and fails if the
   result does not match `schema.prisma`, which catches a forgotten migration.

### How risky is my change?

| Change | Risk |
| ------ | ---- |
| New table | Safe |
| New nullable column, or a column with a default | Safe |
| New required (`NOT NULL`) column with no default | Fails if the table has rows |
| Rename or delete a column or table | Dangerous, can lose data |
| Change a column type | Dangerous, can fail or lose data |

### Expand, then contract (for risky changes)

Example: rename `eventName` to `title`.

1. Add `title` as nullable. Deploy.
2. Copy the data across, and make the code write to both columns. Deploy.
3. Change the code to read only `title`. Deploy.
4. In a later release, drop `eventName`.

At every step, the code that is currently running still works with the database as it is.

---

## 4. Deploying migrations

Migrations are applied by the **Deploy migrations** GitHub Action
(Actions tab -> Deploy migrations -> Run workflow), never from a laptop.

1. Merge the pull request into `development`.
2. Run the workflow from branch `development` with environment **staging**. Check every step is green.
3. Merge `development` into `main` with a pull request.
4. Run the workflow from branch `main` with environment **Production**, then approve the run when GitHub asks.

What the workflow does, in order:

1. Shows pending migrations (this step may print an error-looking message, which is expected).
2. Dumps the database with `pg_dump`.
3. Encrypts the dump with `BACKUP_PASSPHRASE`.
4. Uploads it as the artifact `pre-migration-backup-<environment>` (kept for 14 days).
5. Applies migrations with `prisma migrate deploy`.
6. Shows the status again to confirm everything is applied.

The repository is public, so artifacts can be downloaded by anyone. That is why backups are
always encrypted before upload. Never change the workflow to upload a raw dump.

---

## 5. Backups

### Open a backup

1. Download the artifact from the workflow run page (bottom of the page), and unzip it.
2. Decrypt it:
   ```bash
   gpg --pinentry-mode loopback --decrypt backup-<env>-<timestamp>.dump.gpg > restore.dump
   ```
3. Check that it is readable:
   ```bash
   pg_restore --list restore.dump | head
   ```
4. Delete `restore.dump` when you are done. It contains real data.

### Restore a backup

Restore into a **new, empty Supabase project first**, check the data there, and only then
decide what to do about production. Do not restore over a live production database without a plan.

```bash
pg_restore --no-owner --dbname "<direct connection string of the target database>" restore.dump
```

The backup covers only the `public` schema (the app's tables). Supabase manages its own
schemas (`auth`, `storage`, ...) separately.

### Supabase's own backups

Supabase Free does not provide downloadable backups or point-in-time recovery. Treat the
workflow's encrypted dump as your safety net, and take a manual `pg_dump` before anything unusual.

---

## 6. One-time baseline (only if a database was created with `db push`)

A database made with `db push` has tables but no migration history, so `migrate deploy`
would try to create tables that already exist.

1. Take a manual backup first.
2. In your terminal (do not commit these values), point Prisma at that database and mark the
   baseline migration as already applied. This does not change any data:
   ```bash
   cd packages/db
   DATABASE_URL="<pooled url>" DIRECT_URL="<session url>" \
     pnpm exec prisma migrate resolve --applied 20261023120000_baseline
   ```
3. Check the real schema matches `schema.prisma`:
   ```bash
   DATABASE_URL="<pooled url>" DIRECT_URL="<session url>" \
     pnpm exec prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code
   ```
   Exit code 0 means they match. If it prints differences, fix them before deploying.

Delete this section once production has been baselined.

---

## 7. Troubleshooting

| Message | Likely cause |
| ------- | ------------ |
| Can't reach database server | Wrong `DIRECT_URL`, or the project is paused or still starting. Use the session pooler string. |
| Authentication failed | Wrong password in the connection string. Re-save the secret. |
| `pg_dump` version mismatch | Set `PG_CLIENT_VERSION` in `.github/workflows/migrate.yml` to your Supabase Postgres major version. |
| Database schema is not empty | The database was created with `db push`. See the baseline section. |
| `Bad session key` when decrypting | Wrong or empty passphrase. Use `--pinentry-mode loopback`. |
| Run is refused for `Production` | You started it from a branch other than `main`. |
