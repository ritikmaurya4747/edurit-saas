import { z } from "zod";

export const CreateSchoolSchema = z.object({
  name: z.string().min(2),
  subdomain: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens allowed"),
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
