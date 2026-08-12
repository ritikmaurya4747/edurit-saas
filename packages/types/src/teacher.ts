import { z } from "zod";

export const CreateTeacherSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  subject: z.string().optional(),
});
export type CreateTeacherInput = z.infer<typeof CreateTeacherSchema>;