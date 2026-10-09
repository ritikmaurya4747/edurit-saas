# Examples for our apps:
# admin app
pnpm add axios --filter platform

# api app
pnpm add axios --filter api

# web app
pnpm add axios --filter web

# marketing app
pnpm add axios --filter marketing

# shared UI package
pnpm add clsx --filter @repo/ui

# 3. Installing a Root-Level Tool (affects whole repo — prettier, husky, etc.)
pnpm add -Dw <package-name>
-w = install at workspace root, not inside any app.

# After Pulling New Changes / Fresh Clone
cd edurit-saas
pnpm install

# Removing a Package
pnpm remove <package-name> --filter <app-name>
pnpm remove <package-name> --filter <app-name>

# Run all apps
pnpm dev

# Run a single app only
pnpm dev --filter platform
pnpm dev --filter api
pnpm dev --filter web
pnpm dev --filter marketing

# Build all apps
pnpm build

# Build a single app
pnpm build --filter platform

<!-- Remove below files code in root packge-workspace.ysml  -->
allowBuilds:
  '@nestjs/core': false
  '@prisma/client': false
  '@prisma/engines': false
  esbuild: false
  prisma: false
  unrs-resolver: false
  <!-- end here  -->
# School ERP — database & environment setup

## Apply the ERP schema changes (once per environment)
```
cd packages/database
pnpm db:generate                      # regenerate Prisma client
npx prisma migrate deploy             # applies 20261009120000_erp_core_extensions
pnpm db:seed                          # permission catalogue + syncs default role permissions into existing schools
```
The seed is idempotent. For existing schools it adds any missing system roles and grants the default permissions to
system roles that have none yet (custom edits are kept). The ADMIN role always gets every permission.

## API env (apps/api)
DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN (default 7d), PLATFORM_JWT_SECRET, PLATFORM_REFRESH_SECRET, PORT (default 4000)

## Web env (apps/web)
API_BASE_URL (e.g. http://localhost:4000/v1/), NEXT_PUBLIC_ROOT_DOMAIN (default edurit.in)
Open a school at http://<school-slug>.localhost:3001

## How the school dashboard talks to the API
Browser → `/api/proxy/<path>` (Next route handler, attaches the httpOnly `tenant_access_token`) → Nest `/v1/<path>`.
Client code uses `api` + `useApiQuery / usePaginatedQuery / useApiMutation` from `apps/web/lib/api`.
Permissions: `packages/database/src/index.ts` (PERMISSIONS, DEFAULT_ROLE_PERMISSIONS) is the single catalogue;
the API enforces it with `@TenantAuth()` / `@RequirePermissions()`, the UI hides actions with `useCan()`.
Swagger: http://localhost:4000/docs
