import { z } from "zod";

const RESERVED_SUBDOMAINS = [
  "www",
  "api",
  "admin",
  "mail",
  "app",
  "dashboard",
  "docs",
  "help",
  "support",
  "blog",
  "static",
  "cdn",
  "assets",
  "ftp",
  "test",
  "staging",
  "dev",
  "demo", 
];

export const CreateSchoolSchema = z.object({
  name: z.string().min(2),
  subdomain: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens allowed")
    .refine((val) => !RESERVED_SUBDOMAINS.includes(val), {
      message: "This subdomain is reserved and cannot be used",
    }),
  principalEmail: z.string().email(),
  principalName: z.string().min(2),
  phone: z.string().optional(),
});
export type CreateSchoolInput = z.infer<typeof CreateSchoolSchema>;

export const CreateStudentSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  rollNumber: z.string().optional(),
  classRoomId: z.string().optional(),
  parentEmail: z.string().email().optional(),
});
export type CreateStudentInput = z.infer<typeof CreateStudentSchema>;