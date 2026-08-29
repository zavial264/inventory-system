import { randomBytes } from "node:crypto";

const PASSWORD_CHARS =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$";

export function generateTemporaryPassword(length = 12) {
  const bytes = randomBytes(length);
  return Array.from(bytes, (byte) => PASSWORD_CHARS[byte % PASSWORD_CHARS.length]).join(
    "",
  );
}
