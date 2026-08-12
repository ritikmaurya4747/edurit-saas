import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  const hashBuffer = Buffer.from(hash, "hex");
  const candidateHash = scryptSync(password, salt, 64);
  return timingSafeEqual(hashBuffer, candidateHash);
}

export function generateTempPassword(): string {
  return randomBytes(6).toString("hex");
}
