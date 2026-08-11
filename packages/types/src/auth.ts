import { z } from "zod";

export const RoleEnum = z.enum(["SUPERADMIN", "TEACHER", "PARENT", "STUDENT"]);
export type RoleType = z.infer<typeof RoleEnum>;

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  schoolSubdomain: z.string().min(1),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const AuthTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});
export type AuthTokens = z.infer<typeof AuthTokensSchema>;

export const JwtPayloadSchema = z.object({
  sub: z.string(),
  email: z.string(),
  role: RoleEnum,
  schoolId: z.string(),
  schoolSubdomain: z.string(),
});
export type JwtPayload = z.infer<typeof JwtPayloadSchema>;
