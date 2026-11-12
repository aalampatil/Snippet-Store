import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from "node:crypto";
import bcrypt from "bcryptjs";

const options = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const scrypt = (password: string, salt: string) =>
  new Promise<Buffer>((resolve, reject) => {
    scryptCallback(password, salt, 64, options, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });
export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
export const newToken = () => randomBytes(32).toString("hex");

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const key = await scrypt(password, salt);
  return `scrypt$${salt}$${key.toString("hex")}`;
}

export async function verifyPassword(password: string, hash: string) {
  if (hash.startsWith("$2")) return bcrypt.compare(password, hash);
  const [algorithm, salt, encoded] = hash.split("$");
  if (algorithm !== "scrypt" || !salt || !encoded) return false;
  const expected = Buffer.from(encoded, "hex");
  const actual = await scrypt(password, salt);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
