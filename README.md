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