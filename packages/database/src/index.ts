import { PrismaClient, Prisma } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

const TENANT_SCOPED_MODELS = [
  "user",
  "classRoom",
  "teacherProfile",
  "parentProfile",
  "studentProfile",
  "auditLog",
] as const;

export function tenantDb(schoolId: string) {
  if (!schoolId) {
    throw new Error(
      "tenantDb() called without a schoolId - refusing to create an unscoped client."
    );
  }

  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const modelKey = model
            ? model.charAt(0).toLowerCase() + model.slice(1)
            : "";

          if (!TENANT_SCOPED_MODELS.includes(modelKey as any)) {
            return query(args);
          }

          const readOps = ["findFirst", "findMany", "findUnique", "count", "aggregate", "groupBy"];
          const writeOpsWithWhere = ["updateMany", "deleteMany"];
          const singleWriteOps = ["update", "delete", "upsert"];
          const createOps = ["create"];
          const createManyOps = ["createMany"];

          const a = args as any;

          if (readOps.includes(operation) || writeOpsWithWhere.includes(operation)) {
            a.where = { ...(a.where ?? {}), schoolId };
          } else if (singleWriteOps.includes(operation)) {
            a.where = { ...(a.where ?? {}), schoolId };
          } else if (createOps.includes(operation)) {
            a.data = { ...(a.data ?? {}), schoolId };
          } else if (createManyOps.includes(operation)) {
            if (Array.isArray(a.data)) {
              a.data = a.data.map((d: any) => ({ ...d, schoolId }));
            }
          }

          return query(a);
        },
      },
    },
  });
}

export type TenantPrismaClient = ReturnType<typeof tenantDb>;

export * from "@prisma/client";
export { Prisma };
